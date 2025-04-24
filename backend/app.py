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
SIMILARITY_K = 50
NUM_CLUSTERS = 5
DINO_WEIGHT = 0.7
CLIP_WEIGHT = 0.3

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

class LockRequest(BaseModel):
    image_path: str  # Assuming your frontend sends 'imageId' in the body

@app.get("/api/search")
async def search(query: str, count: int = 12):
    print('search query = ', query, ' and count = ', count)
    if query == "":
        query = "default"
    global locked_dino_embedding, locked_clip_embedding, locked_tags
    try:
        if locked_dino_embedding is not None and locked_clip_embedding is not None:
            # Hybrid similarity search
            dino_index.hnsw.efSearch = 100
            clip_index.hnsw.efSearch = 100
            dino_distances, dino_indices = dino_index.search(np.array(locked_dino_embedding, dtype=np.float32), k=SIMILARITY_K)
            clip_distances, clip_indices = clip_index.search(np.array(locked_clip_embedding, dtype=np.float32), k=SIMILARITY_K)
            
            # Combine candidates
            candidate_ids = set()
            dino_ids = [id_map.get(str(idx)) for idx in dino_indices[0] if str(idx) in id_map]
            clip_ids = [id_map.get(str(idx)) for idx in clip_indices[0] if str(idx) in id_map]
            candidate_ids.update(dino_ids + clip_ids)
            if not candidate_ids:
                print("No valid image IDs found in hybrid search")
                return {"images": []}

            # Fetch metadata
            cursor.execute("SELECT image_id, path, tags FROM images WHERE image_id IN ({})".format(
                ",".join("?" * len(candidate_ids))
            ), list(candidate_ids))
            candidates = cursor.fetchall()
            candidate_paths = {row[0]: row[1] for row in candidates}
            candidate_tags = {row[0]: json.loads(row[2]) for row in candidates}
            print(f"Found {len(candidate_ids)} candidates in hybrid search")

            # Compute hybrid scores
            scores = {}
            for cid in candidate_ids:
                if cid not in candidate_paths:
                    continue
                dino_score = 0
                clip_score = 0
                if cid in dino_ids:
                    idx = dino_ids.index(cid)
                    dino_score = 1 / (1 + dino_distances[0][idx])
                if cid in clip_ids:
                    idx = clip_ids.index(cid)
                    clip_score = 1 / (1 + clip_distances[0][idx])
                scores[cid] = DINO_WEIGHT * dino_score + CLIP_WEIGHT * clip_score
            
            # Filter by style tags
            style_tags = [tag for tag in (locked_tags or []) if tag not in ["black & white", "monochrome", "neon", "pastel", "vivid", "muted"]]
            if not style_tags:
                style_tags = locked_tags or []
            try:
                filtered_ids = [
                    cid for cid in scores
                    if cid in candidate_tags and any(tag in candidate_tags[cid] for tag in style_tags)
                ]
            except Exception as e:
                print(f"Error filtering candidates: {e}")
                filtered_ids = []
            # Cluster for diversity
            if len(filtered_ids) > count:
                candidate_embeddings = np.array([dino_index.reconstruct(int(idx)) for idx in range(len(dino_indices[0])) if dino_ids[idx] in filtered_ids])
                if len(candidate_embeddings) < NUM_CLUSTERS:
                    selected_ids = filtered_ids[:count]
                else:
                    kmeans = KMeans(n_clusters=min(NUM_CLUSTERS, len(filtered_ids)), random_state=42)
                    cluster_labels = kmeans.fit_predict(candidate_embeddings)
                    selected_ids = []
                    for cluster in range(min(NUM_CLUSTERS, len(filtered_ids))):
                        cluster_indices = [i for i, label in enumerate(cluster_labels) if label == cluster]
                        if cluster_indices:
                            selected_ids.append(filtered_ids[cluster_indices[0]])
                        if len(selected_ids) < count:
                            remaining_candidates = [cid for cid in filtered_ids if cid not in selected_ids]
                            if remaining_candidates:
                                remaining_with_scores = [(cid, scores[cid]) for cid in remaining_candidates]
                                remaining_with_scores.sort(key=lambda x: x[1], reverse=True)
                                remaining_needed = count - len(selected_ids)
                                for cid, _ in remaining_with_scores[:remaining_needed]:
                                    selected_ids.append(cid)
                    selected_ids = selected_ids[:count]
            else:
                selected_ids = filtered_ids[:count]


            paths = [candidate_paths[cid] for cid in selected_ids if cid in candidate_paths]
            print(f"Hybrid search with tags {style_tags} returned {len(paths)} images")
            print(paths)
            return {"images": paths}
        
        # Tag-based search
        query_tags = [tag.strip().lower() for tag in query.split(",") if tag.strip()]
        if not query_tags:
            print("Empty query; returning random images")
            cursor.execute("SELECT path FROM images ORDER BY RANDOM() LIMIT ?", (count,))
            paths = [row[0] for row in cursor.fetchall()]
            return {"images": paths}
        
        query_placeholders = ",".join("?" * len(query_tags))
        cursor.execute(f"""
            SELECT path FROM images
            WHERE EXISTS (
                SELECT 1 FROM json_each(tags)
                WHERE lower(json_each.value) IN ({query_placeholders})
            )
        """, query_tags)
        matches = [row[0] for row in cursor.fetchall()]
        
        if not matches:
            print("No matches found for query; returning random images")
            cursor.execute("SELECT path FROM images ORDER BY RANDOM() LIMIT ?", (count,))
            paths = [row[0] for row in cursor.fetchall()]
        else:
            paths = random.sample(matches, min(count, len(matches)))
        
        print(f"Tag search for '{query}' returned {len(paths)} images")
        print(paths)
        return {"images": paths}
    except Exception as e:
        print(f"Search error: {e}")
        return {"images": []}

@app.post("/api/lock")
async def lock(request_body: LockRequest):
    image_path = request_body.image_path
    global locked_dino_embedding, locked_clip_embedding, locked_tags
    try:        
        cursor.execute("SELECT image_id, tags FROM images WHERE path = ?", (image_path,))
        result = cursor.fetchone()
        if not result:
            print(f"Image not in database: {image_path}")
            return {"status": "error", "message": "Image not in database"}
        
        image_id, tags_json = result
        locked_tags = json.loads(tags_json)
        
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
    global locked_dino_embedding, locked_clip_embedding, locked_tags
    locked_dino_embedding = None
    locked_clip_embedding = None
    locked_tags = None
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