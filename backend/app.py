from fastapi import FastAPI
from fastapi.responses import FileResponse
from PIL import Image
import numpy as np
import faiss
import json
import random
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from sklearn.cluster import KMeans
import base64
from io import BytesIO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Replace with your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

DATA_DIR = "./data/"
DB_FILE = os.path.join(DATA_DIR, "metadata.db")
FAISS_INDEX_FILE = os.path.join(DATA_DIR, "faiss_index.bin")
FAISS_CLIP_INDEX_FILE = os.path.join(DATA_DIR, "faiss_clip_index.bin")
FAISS_ID_MAP_FILE = os.path.join(DATA_DIR, "faiss_id_map.json")
IMAGE_DIR = os.path.join(DATA_DIR, "images/")
MOODBOARD_FILE = os.path.join(DATA_DIR, "moodboard.png")
SIMILARITY_K = 100
NUM_CLUSTERS = 12

# Initialize Faiss indices
try:
    dino_index = faiss.read_index(FAISS_INDEX_FILE)
    clip_index = faiss.read_index(FAISS_CLIP_INDEX_FILE)
    print(f"Loaded DINOv2 index with {dino_index.ntotal} vectors, CLIP index with {clip_index.ntotal} vectors")
except Exception as e:
    print(f"Failed to load Faiss indices: {e}")
    raise ValueError(f"Failed to load Faiss indices: {e}")

# Load Faiss ID map
try:
    with open(FAISS_ID_MAP_FILE, "r") as f:
        id_map = json.load(f)
    print(f"Loaded Faiss ID map with {len(id_map)} entries")
except Exception as e:
    print(f"Failed to load Faiss ID map: {e}")
    raise ValueError(f"Failed to load Faiss ID map: {e}")

# Initialize SQLite database
try:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM images")
    db_count = cursor.fetchone()[0]
    print(f"Connected to SQLite database with {db_count} entries")
except Exception as e:
    print(f"Failed to connect to SQLite database: {e}")
    raise ValueError(f"Failed to connect to SQLite database: {e}")

# Global variables
locked_dino_embedding = None
locked_clip_embedding = None
locked_tags = None
locked_path = ''

class LockRequest(BaseModel):
    image_path: str  # Assuming your frontend sends 'imageId' in the body

@app.get("/api/search")
async def search(query: str, count: int = 12):
    print('search query = ', query, ' and count = ', count)
    tag_order = [
        "graphic design",
        "packaging",
        "photo",
        "illustration",
        "photo",
        "printmaking",
        "web landing page",
        "logomark",
        "typography"
    ]
    paths = []
    # Track recently returned paths to avoid repetition (in-memory, resets per call)
    recently_returned = set()  # Could be made persistent with a global or cache

    try:
        if locked_clip_embedding is not None:
            # CLIP-based search for vibe
            print('Performing CLIP similarity search')
            clip_index.hnsw.efSearch = 100
            clip_distances, clip_indices = clip_index.search(
                np.array(locked_clip_embedding, dtype=np.float32), k=SIMILARITY_K
            )

            # Collect candidate IDs
            candidate_ids = set()
            clip_ids = [id_map.get(str(idx)) for idx in clip_indices[0] if str(idx) in id_map]
            candidate_ids.update(clip_ids)
            if not candidate_ids:
                print("No valid image IDs found in CLIP search")
                return {"images": []}

            # Fetch metadata from database
            cursor.execute("SELECT image_id, path, tags FROM images WHERE image_id IN ({})".format(
                ",".join("?" * len(candidate_ids))
            ), list(candidate_ids))
            candidates = cursor.fetchall()
            candidate_paths = {row[0]: row[1] for row in candidates}
            candidate_tags = {row[0]: json.loads(row[2]) for row in candidates}

            # Exclude locked path and recently returned images
            if locked_path:
                candidate_ids = {cid for cid in candidate_ids if candidate_paths.get(cid) != locked_path}
                print(f"Excluded locked image with path {locked_path} from candidates")
            candidate_ids = {cid for cid in candidate_ids if candidate_paths.get(cid) not in recently_returned}
            print(f"Found {len(candidate_ids)} candidates in CLIP search after exclusions")

            # Compute CLIP scores with slight random perturbation for variability
            scores = {}
            for cid in candidate_ids:
                if cid not in candidate_paths:
                    continue
                if cid in clip_ids:
                    idx = clip_ids.index(cid)
                    clip_score = 1 / (1 + clip_distances[0][idx])
                    # Add small random perturbation to vary results
                    scores[cid] = clip_score + random.uniform(-0.01, 0.01)
                else:
                    scores[cid] = random.uniform(0, 0.1)  # Low score for non-CLIP matches

            # Group candidates by tag_order tags
            tag_to_candidates = {tag: [] for tag in tag_order}
            for cid in candidate_ids:
                if cid not in candidate_tags or cid not in candidate_paths:
                    continue
                tags = [t.lower() for t in candidate_tags[cid]]
                for tag in tag_order:
                    if tag in tags:
                        tag_to_candidates[tag].append((cid, scores.get(cid, 0)))
                        break  # Assign to first matching tag in tag_order

            # Select images in tag_order sequence with randomization
            remaining_count = count
            for tag in tag_order:
                if remaining_count <= 0:
                    break
                candidates = tag_to_candidates.get(tag, [])
                if candidates:
                    # Shuffle candidates to ensure different selections
                    random.shuffle(candidates)
                    num_to_take = min(len(candidates), remaining_count)
                    selected_ids = [cid for cid, _ in candidates[:num_to_take]]
                    paths.extend([candidate_paths[cid] for cid in selected_ids])
                    remaining_count -= num_to_take

            print(f"CLIP search returned {len(paths)} images, randomized within tag_order")
        else:
            # Non-query search: return random images aligned with tag_order
            print("Empty query; returning random images with tags aligned to tag_order")
            remaining_count = count
            for tag in tag_order:
                if remaining_count <= 0:
                    break
                cursor.execute("""
                    SELECT path FROM images
                    WHERE EXISTS (
                        SELECT 1 FROM json_each(tags)
                        WHERE lower(json_each.value) = ?
                    )
                    AND path NOT IN ({})
                    ORDER BY RANDOM()
                    LIMIT 1
                """.format(",".join("?" * len(recently_returned))), (tag.lower(), *recently_returned))
                tag_paths = [row[0] for row in cursor.fetchall()]
                paths.extend(tag_paths)
                remaining_count -= len(tag_paths)
            print(f"Non-query search returned {len(paths)} random images aligned to tag_order")

        # Process images to base64
        images = []
        for path in paths:
            file_path = os.path.join(path)
            if os.path.isfile(file_path):
                try:
                    with Image.open(file_path) as img:
                        img.verify()
                    with Image.open(file_path) as img:
                        img_byte_arr = BytesIO()
                        img.save(img_byte_arr, format=img.format)
                        base64_string = base64.b64encode(img_byte_arr.getvalue()).decode("utf-8")
                        mime_type = f"image/{os.path.splitext(path)[1][1:].lower()}"
                        base64_data = f"data:{mime_type};base64,{base64_string}"
                    images.append({'url': path, 'content': base64_data})
                    # Add to recently returned set
                    recently_returned.add(path)
                except Exception as e:
                    print(f"Error processing {path}: {e}")
                    images.append(str(e))
            else:
                images.append("File not found")

        print(f"Returning {len(images)} images")
        print(paths)
        return {"images": images}

    except Exception as e:
        print(f"Search error: {e}")
        return {"images": []}

@app.post("/api/lock")
async def lock(request_body: LockRequest):
    image_path = request_body.image_path
    global locked_dino_embedding, locked_clip_embedding, locked_tags, locked_path
    try:        
        cursor.execute("SELECT image_id, tags FROM images WHERE path = ?", (image_path,))
        result = cursor.fetchone()
        if not result:
            print(f"Image not in database: {image_path}")
            return {"status": "error", "message": "Image not in database"}
        
        image_id, tags_json = result
        locked_tags = json.loads(tags_json)
        locked_path = image_path
        
        faiss_idx = None
        for idx, mapped_id in id_map.items():
            if mapped_id == image_id:
                faiss_idx = int(idx)
                break
        if faiss_idx is None:
            print(f"No Faiss embedding for {image_path}")
            return {"status": "error", "message": "No embedding found"}
        
        locked_dino_embedding = dino_index.reconstruct(faiss_idx).reshape(1, -1)
        locked_dino_embedding = locked_dino_embedding / np.linalg.norm(locked_dino_embedding)
        locked_clip_embedding = clip_index.reconstruct(faiss_idx).reshape(1, -1)
        locked_clip_embedding = locked_clip_embedding / np.linalg.norm(locked_clip_embedding)
        print(f"Locked image: {image_path} (Faiss index: {faiss_idx}, tags: {locked_tags})")
        return {"status": "locked", "message": f"Locked {image_path}"}
    except Exception as e:
        print(f"Lock image error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/unlock")
async def unlock():
    global locked_dino_embedding, locked_clip_embedding, locked_tags, locked_path
    locked_dino_embedding = None
    locked_clip_embedding = None
    locked_tags = None
    locked_path = ''
    print("Unlocked all images")
    return {"status": "unlocked", "message": "Unlocked all images"}

@app.get("/api/save")
async def save_moodboard():
    global locked_dino_embedding
    query = "" if locked_dino_embedding is not None else "default"
    result = search(query)
    image_paths = result["images"]
    
    if not image_paths:
        print("No images to create moodboard")
        return {"status": "error", "message": "No images available"}
    
    imgs = []
    for path in image_paths:
        try:
            img = Image.open(path).convert("RGB")
            img = img.resize((200, 200))
            imgs.append(img)
        except Exception as e:
            print(f"Error loading image {path}: {e}")
            continue
    
    if not imgs:
        print("No valid images for moodboard")
        return {"status": "error", "message": "No valid images"}
    
    num_images = len(imgs)
    if num_images <= 4:
        cols, rows = num_images, 1
    else:
        cols, rows = 4, 2
    width = cols * 200
    height = rows * 200
    combined = Image.new("RGB", (width, height), color=(255, 255, 255))
    for i, img in enumerate(imgs[:cols * rows]):
        combined.paste(img, ((i % cols) * 200, (i // cols) * 200))
    
    combined.save(MOODBOARD_FILE)
    print(f"Moodboard saved to {MOODBOARD_FILE} with {num_images} images")
    return FileResponse("moodboard.png")

# Serve images
@app.get("/api/images/{image_path:path}")
async def get_image(image_path: str):
    return FileResponse(os.path.join("data/images", image_path))