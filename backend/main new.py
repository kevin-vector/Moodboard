import sqlite3
import json
import faiss
import numpy as np
from PIL import Image
import random
import os
import logging

# Configuration
DATA_DIR = "./data/"
DB_FILE = os.path.join(DATA_DIR, "metadata.db")
FAISS_INDEX_FILE = os.path.join(DATA_DIR, "faiss_index.bin")
FAISS_ID_MAP_FILE = os.path.join(DATA_DIR, "faiss_id_map.json")
IMAGE_DIR = os.path.join(DATA_DIR, "images/")
MOODBOARD_FILE = os.path.join(DATA_DIR, "moodboard.png")
LOG_FILE = os.path.join(DATA_DIR, "test_data.log")

# Setup logging
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger()

# Initialize Faiss index
try:
    index = faiss.read_index(FAISS_INDEX_FILE)
    logger.info(f"Loaded Faiss index with {index.ntotal} vectors")
except Exception as e:
    logger.error(f"Failed to load Faiss index: {e}")
    raise ValueError(f"Failed to load Faiss index: {e}")

# Load Faiss ID map
try:
    with open(FAISS_ID_MAP_FILE, "r") as f:
        id_map = json.load(f)
    logger.info(f"Loaded Faiss ID map with {len(id_map)} entries")
except Exception as e:
    logger.error(f"Failed to load Faiss ID map: {e}")
    raise ValueError(f"Failed to load Faiss ID map: {e}")

try:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM images")
    db_count = cursor.fetchone()[0]
    logger.info(f"Connected to SQLite database with {db_count} entries")
except Exception as e:
    logger.error(f"Failed to connect to SQLite database: {e}")
    raise ValueError(f"Failed to connect to SQLite database: {e}")

# Global variable for locked embedding
locked_embedding = None

def search(query: str):
    global locked_embedding
    try:
        if locked_embedding is not None:
            # Similarity search using Faiss
            index.hnsw.efSearch = 100  # Adjust for accuracy vs. speed
            distances, indices = index.search(locked_embedding, k=7)
            image_ids = [id_map.get(str(idx)) for idx in indices[0] if str(idx) in id_map]
            cursor.execute("SELECT path FROM images WHERE image_id IN ({})".format(
                ",".join("?" * len(image_ids))
            ), image_ids)
            paths = [row[0] for row in cursor.fetchall()]
            logger.info(f"Similarity search returned {len(paths)} images")
            return {"images": paths}
        
        # Tag-based search
        query_tags = [tag.strip().lower() for tag in query.split(",") if tag.strip()]
        if not query_tags:
            logger.warning("Empty query; returning random images")
            cursor.execute("SELECT path FROM images ORDER BY RANDOM() LIMIT 7")
            paths = [row[0] for row in cursor.fetchall()]
            return {"images": paths}
        
        # Search for images with matching tags
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
            logger.info("No matches found for query; returning random images")
            cursor.execute("SELECT path FROM images ORDER BY RANDOM() LIMIT 7")
            paths = [row[0] for row in cursor.fetchall()]
        else:
            paths = random.sample(matches, min(7, len(matches)))
        
        logger.info(f"Tag search for '{query}' returned {len(paths)} images")
        return {"images": paths}
    except Exception as e:
        logger.error(f"Search error: {e}")
        print(f"Search error: {e}")
        return {"images": []}

def lock_image(image_path: str):
    global locked_embedding
    try:
        # Normalize path for consistency
        image_path = os.path.normpath(image_path)
        if not os.path.exists(image_path):
            logger.error(f"Image not found: {image_path}")
            print(f"Image not found: {image_path}")
            return {"status": "error", "message": "Image not found"}
        
        # Find image_id from SQLite
        cursor.execute("SELECT image_id FROM images WHERE path = ?", (image_path,))
        result = cursor.fetchone()
        if not result:
            logger.error(f"Image not in database: {image_path}")
            print(f"Image not in database: {image_path}")
            return {"status": "error", "message": "Image not in database"}
        
        image_id = result[0]
        
        # Find Faiss index for the image
        faiss_idx = None
        for idx, mapped_id in id_map.items():
            if mapped_id == image_id:
                faiss_idx = int(idx)
                break
        if faiss_idx is None:
            logger.error(f"No Faiss embedding for image_id: {image_id}")
            print(f"No Faiss embedding for {image_path}")
            return {"status": "error", "message": "No embedding found"}
        
        # Recompute embedding (since embeddings.npy is not available)
        try:
            image = Image.open(image_path).convert("RGB")
            transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            tensor = transform(image).unsqueeze(0).to(device)
            with torch.no_grad():
                embedding = dino_model(tensor).cpu().numpy()
            locked_embedding = embedding / np.linalg.norm(embedding)
            logger.info(f"Locked image: {image_path}")
            return {"status": "locked", "message": f"Locked {image_path}"}
        except Exception as e:
            logger.error(f"Error computing embedding for {image_path}: {e}")
            print(f"Error locking image: {e}")
            return {"status": "error", "message": f"Error computing embedding: {e}"}
    except Exception as e:
        logger.error(f"Lock image error: {e}")
        print(f"Lock image error: {e}")
        return {"status": "error", "message": str(e)}

def save_moodboard():
    global locked_embedding
    try:
        # Get images from search
        query = "" if locked_embedding is not None else "default"
        result = search(query)
        image_paths = result["images"]
        
        if not image_paths:
            logger.warning("No images to create moodboard")
            print("No images to create moodboard")
            return {"status": "error", "message": "No images available"}
        
        # Load and resize images
        imgs = []
        for path in image_paths:
            try:
                img = Image.open(path).convert("RGB")
                img = img.resize((200, 200))
                imgs.append(img)
            except Exception as e:
                logger.error(f"Error loading image {path}: {e}")
                continue
        
        if not imgs:
            logger.warning("No valid images for moodboard")
            print("No valid images for moodboard")
            return {"status": "error", "message": "No valid images"}
        
        # Create moodboard (4x2 grid, up to 7 images)
        combined = Image.new("RGB", (800, 400), color=(255, 255, 255))  # White background
        for i, img in enumerate(imgs[:7]):
            combined.paste(img, ((i % 4) * 200, (i // 4) * 200))
        
        # Save moodboard
        combined.save(MOODBOARD_FILE)
        logger.info(f"Moodboard saved to {MOODBOARD_FILE}")
        print(f"Moodboard saved to {MOODBOARD_FILE}")
        return {"status": "success", "message": f"Moodboard saved to {MOODBOARD_FILE}"}
    except Exception as e:
        logger.error(f"Save moodboard error: {e}")
        print(f"Save moodboard error: {e}")
        return {"status": "error", "message": str(e)}

def main():
    global locked_embedding
    print("Moodboard Test CLI")
    print(f"Database: {DB_FILE} ({cursor.execute('SELECT COUNT(*) FROM images').fetchone()[0]} images)")
    print(f"Faiss index: {FAISS_INDEX_FILE} ({index.ntotal} vectors)")
    
    while True:
        print("\nOptions:")
        print("1. Search by tags")
        print("2. Lock an image")
        print("3. Save moodboard")
        print("4. Exit")
        choice = input("Select an option (1-4): ").strip()
        
        if choice == "1":
            query = input("Enter search query (comma-separated tags, e.g., nature,bright): ").strip()
            result = search(query)
            if result["images"]:
                print("Search results:")
                for i, path in enumerate(result["images"], 1):
                    print(f"{i}. {path}")
            else:
                print("No results found")
        
        elif choice == "2":
            image_path = input("Enter the path of the image to lock (e.g., ./data/images/sample1.jpg): ").strip()
            result = lock_image(image_path)
            print(result["message"])
        
        elif choice == "3":
            result = save_moodboard()
            print(result["message"])
        
        elif choice == "4":
            print("Exiting...")
            logger.info("Test script terminated")
            conn.close()
            break
        
        else:
            print("Invalid option. Please try again.")

if __name__ == "__main__":
    # Lazy import for DINOv2 to avoid loading unless needed
    try:
        from dinov2.models.vision_transformer import vit_base
        from dinov2.utils.utils import load_pretrained_weights
        import torchvision.transforms as transforms
        import torch
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        dino_model = vit_base().to(device)
        load_pretrained_weights(dino_model, "dinov2_vitb14", checkpoint_key="teacher")
        dino_model.eval()
        logger.info("DINOv2 model loaded")
        
        main()
    except Exception as e:
        logger.error(f"Startup error: {e}")
        print(f"Startup error: {e}")
        if "conn" in globals():
            conn.close()