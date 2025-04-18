import os
import json
import sqlite3
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import numpy as np
import faiss
import uuid
import torchvision.transforms as transforms
from tqdm import tqdm
import logging
from torch.utils.data import DataLoader, Dataset
from sklearn.mixture import GaussianMixture
import glob

CONFIG = {
    "image_dir": "./data/images/",
    "output_dir": "./data/",
    "db_file": "./data/metadata.db",
    "faiss_index_file": "./data/faiss_index.bin",
    "faiss_id_map_file": "./data/faiss_id_map.json",
    "dimension": 768,  # DINOv2 vitb14
    "batch_size": 32,
    "n_clusters": 20,  # For optional GMM clustering
    "do_clustering": False,  # Set to True to enable GMM
    "tag_threshold": 0.2,  # Probability threshold for CLIP tags
    "min_tags": 1,  # Minimum number of tags per image
    "max_tags": 5,  # Maximum number of tags per image
    "top_n_tags": 3,  # Fallback to top-N tags if none exceed threshold
    "image_extensions": (".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff"),
}

TAGS = [
    "illustration", "collage", "3D render", "motion graphics", "animation", "painting", "drawing",
    "sculpture", "printmaking", "installation art", "AR/VR", "AI-generated", "cinematography",
    "fashion design", "product design", "industrial design", "UI design", "architecture",
    "interior design", "layout", "grid system", "negative space", "balance", "asymmetry",
    "overlap", "depth", "iconography", "diagram", "map", "infographic", "emoji", "logomark",
    "pictogram", "double exposure", "halftone", "glitch", "pixel art", "datamoshing", "silhouette",
    "line art", "scanography", "hand-drawn", "metal", "glass", "concrete", "plastic", "paper",
    "fabric", "wood", "skin", "fur", "water", "fire", "smoke", "dust", "mirror", "black & white",
    "monochrome", "neon", "pastel", "primary colors", "complementary", "analogous", "duotone",
    "CMYK", "RGB", "warm", "cool", "neutral", "vivid", "muted", "earth tones", "sunset tones",
    "underwater tones", "futuristic palette", "natural palette", "nostalgic palette",
    "psychedelic colors", "vaporwave palette", "minimal palette", "high contrast", "brutalism",
    "minimalism", "maximalism", "cyberpunk", "solarpunk", "biophilic", "memphis", "bauhaus",
    "de stijl", "baroque", "vintage", "retro-futurism", "Y2K", "new ugly", "editorial",
    "high fashion", "corporate memphis", "dada", "surrealism", "art deco", "modernist",
    "dreamy", "gritty", "ethereal", "industrial", "romantic", "playful", "melancholy", "serene",
    "bold", "mysterious", "chaotic", "clinical", "organic", "eerie", "luxurious",
    "editorial layout", "poster design", "book cover", "packaging", "social post", "web landing page",
    "billboard", "pitch deck", "logo system", "ad campaign"
]

logging.basicConfig(
    filename=os.path.join(CONFIG["output_dir"], "generate_data.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

dino_model = torch.hub.load('facebookresearch/dinov2', 'dinov2_vitb14').to(device).eval()

os.makedirs(CONFIG["output_dir"], exist_ok=True)
conn = sqlite3.connect(CONFIG["db_file"])
cursor = conn.cursor()
cursor.execute("""
    CREATE TABLE IF NOT EXISTS images (
        image_id TEXT PRIMARY KEY,
        path TEXT UNIQUE,
        tags TEXT,
        cluster_label INTEGER
    )
""")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_path ON images (path)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_tags ON images (tags)")
conn.commit()

index = faiss.IndexHNSWFlat(CONFIG["dimension"], 16)  # HNSW index with M=16
index.hnsw.efConstruction = 200
id_map = {}

if os.path.exists(CONFIG["faiss_index_file"]) and os.path.exists(CONFIG["faiss_id_map_file"]):
    index = faiss.read_index(CONFIG["faiss_index_file"])
    with open(CONFIG["faiss_id_map_file"], "r") as f:
        id_map = json.load(f)
    logger.info(f"Loaded existing Faiss index with {index.ntotal} vectors")

class ImageDataset(Dataset):
    def __init__(self, image_paths):
        self.image_paths = image_paths
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        path = self.image_paths[idx]
        try:
            image = Image.open(path).convert("RGB")
            tensor = self.transform(image)
            return tensor, path
        except Exception as e:
            logger.error(f"Error loading {path}: {e}")
            return None, path

def generate_embeddings(loader):
    embeddings = []
    valid_paths = []
    for batch_tensors, batch_paths in tqdm(loader, desc="Generating embeddings"):
        valid_tensors = []
        valid_indices = []
        for i, tensor in enumerate(batch_tensors):
            if tensor is not None:
                valid_tensors.append(tensor)
                valid_indices.append(i)
        
        if valid_tensors:
            batch_tensor = torch.stack(valid_tensors).to(device)
            with torch.no_grad():
                batch_embeddings = dino_model(batch_tensor).cpu().numpy()
            for i, embedding in zip(valid_indices, batch_embeddings):
                embedding = embedding / np.linalg.norm(embedding)
                embeddings.append(embedding)
                valid_paths.append(batch_paths[i])
    
    return np.array(embeddings), valid_paths

def cluster_embeddings(embeddings):
    if len(embeddings) < CONFIG["n_clusters"]:
        logger.warning(f"Too few embeddings ({len(embeddings)}) for {CONFIG['n_clusters']} clusters")
        return np.zeros(len(embeddings), dtype=np.int32)
    
    logger.info("Clustering embeddings with GMM...")
    gmm = GaussianMixture(n_components=CONFIG["n_clusters"], covariance_type="full", random_state=42)
    cluster_labels = gmm.fit_predict(embeddings)
    logger.info("Clustering completed")
    return cluster_labels

def generate_tags(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
        inputs = clip_processor(text=TAGS, images=image, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            outputs = clip_model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1).cpu().numpy()[0]
        
        tags = [TAGS[i] for i, prob in enumerate(probs) if prob > CONFIG["tag_threshold"]]
        
        if len(tags) < CONFIG["min_tags"]:
            top_n_indices = np.argsort(probs)[-CONFIG["top_n_tags"]:]
            top_n_tags = [TAGS[i] for i in top_n_indices if TAGS[i] not in tags]
            tags.extend(top_n_tags)
            tags = tags[:CONFIG["max_tags"]]  # Cap at max_tags
        
        if not tags:
            logger.warning(f"No confident tags for {image_path}; assigning 'general'")
            return ["general"]
        
        logger.debug(f"Tags for {image_path}: {tags} (probs: {[probs[TAGS.index(tag)] for tag in tags]})")
        return tags
    except Exception as e:
        logger.error(f"Error tagging {image_path}: {e}")
        return ["error"]

def process_images(image_paths):
    # Filter out already processed images
    cursor.execute("SELECT path FROM images")
    processed_paths = set(row[0] for row in cursor.fetchall())
    image_paths = [p for p in image_paths if p not in processed_paths]
    
    if not image_paths:
        logger.info("No new images to process")
        return
    
    logger.info(f"Processing {len(image_paths)} new images")
    
    # Create DataLoader for efficient batch processing
    dataset = ImageDataset(image_paths)
    loader = DataLoader(dataset, batch_size=CONFIG["batch_size"], num_workers=4, pin_memory=True)
    
    embeddings, valid_paths = generate_embeddings(loader)
    
    # Optional clustering
    cluster_labels = cluster_embeddings(embeddings) if CONFIG["do_clustering"] else [-1] * len(embeddings)
    
    metadata = []
    for path, embedding, cluster_label in zip(valid_paths, embeddings, cluster_labels):
        image_id = str(uuid.uuid4())
        tags = generate_tags(path)
        if tags == ["error"]:
            continue
        
        metadata.append((image_id, path, json.dumps(tags), cluster_label))
        faiss_id = index.ntotal
        index.add(np.array([embedding], dtype=np.float32))
        id_map[str(faiss_id)] = image_id
        
        # Checkpoint after each image to allow resuming
        cursor.executemany(
            "INSERT INTO images (image_id, path, tags, cluster_label) VALUES (?, ?, ?, ?)",
            [metadata[-1]]
        )
        conn.commit()
        faiss.write_index(index, CONFIG["faiss_index_file"])
        with open(CONFIG["faiss_id_map_file"], "w") as f:
            json.dump(id_map, f)
    
    logger.info(f"Processed {len(metadata)} images. Total in Faiss: {index.ntotal}")

def main():
    # Normalize and validate image directory
    image_dir = os.path.normpath(CONFIG["image_dir"])
    if not os.path.exists(image_dir):
        logger.error(f"Image directory {image_dir} does not exist")
        raise ValueError(f"Image directory {image_dir} does not exist")
    
    if not os.path.isdir(image_dir):
        logger.error(f"{image_dir} is not a directory")
        raise ValueError(f"{image_dir} is not a directory")
    
    image_paths = []
    for ext in CONFIG["image_extensions"]:
        image_paths.extend(glob.glob(os.path.join(image_dir, f"**/*{ext}"), recursive=True))
    
    image_paths = sorted(set(os.path.normpath(p) for p in image_paths))
    
    if not image_paths:
        try:
            all_files = []
            for root, _, files in os.walk(image_dir):
                all_files.extend(os.path.join(root, f) for f in files)
            logger.error(f"No images found in {image_dir} or its subfolders. Files present: {all_files[:10]}")
        except Exception as e:
            logger.error(f"Failed to list files in {image_dir}: {e}")
        raise ValueError(f"No images found in {image_dir} or its subfolders")
    
    logger.info(f"Found {len(image_paths)} images")
    logger.debug(f"Sample image paths: {image_paths[:5]}")
    
    process_images(image_paths)
    
    # Summary
    cursor.execute("SELECT COUNT(*) FROM images")
    db_count = cursor.fetchone()[0]
    logger.info(f"Completed. {db_count} images in SQLite, {index.ntotal} vectors in Faiss")
    print(f"Output files:")
    print(f"- SQLite: {CONFIG['db_file']} ({db_count} entries)")
    print(f"- Faiss index: {CONFIG['faiss_index_file']} ({index.ntotal} vectors)")
    print(f"- Faiss ID map: {CONFIG['faiss_id_map_file']}")
    print(f"- Log: {os.path.join(CONFIG['output_dir'], 'generate_data.log')}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        print(f"An error occurred: {e}")
    finally:
        conn.close()