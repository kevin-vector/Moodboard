import torch
from torchvision import transforms
from PIL import Image
import numpy as np
from sklearn.mixture import GaussianMixture
import faiss
from transformers import CLIPProcessor, CLIPModel
import json
import os
from tqdm import tqdm  # For progress bars

# Configuration
IMAGE_DIR = "./data/images/"  # Directory with your images
OUTPUT_DIR = "./data/"        # Directory to save output files
N_CLUSTERS = 20               # Number of GMM clusters (adjustable)
BATCH_SIZE = 32               # Batch size for embedding generation
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Your 109 tags
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

# Preprocessing for DINOv2
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def generate_embeddings(image_paths, output_file):
    """Generate DINOv2 embeddings for all images."""
    dinov2 = torch.hub.load('facebookresearch/dinov2', 'dinov2_vitb14').to(DEVICE).eval()
    embeddings = []
    
    print("Generating embeddings...")
    for i in tqdm(range(0, len(image_paths), BATCH_SIZE), desc="Embedding batches"):
        batch_paths = image_paths[i:i + BATCH_SIZE]
        batch_images = []
        for path in batch_paths:
            try:
                image = Image.open(path).convert("RGB")
                tensor = transform(image)
                batch_images.append(tensor)
            except Exception as e:
                print(f"Error processing {path}: {e}")
                continue
        
        if batch_images:
            batch_tensor = torch.stack(batch_images).to(DEVICE)
            with torch.no_grad():
                batch_embeddings = dinov2(batch_tensor).cpu().numpy()
            embeddings.append(batch_embeddings)
    
    embeddings = np.vstack(embeddings)
    np.save(output_file, embeddings)
    return embeddings

def cluster_embeddings(embeddings, output_file):
    """Cluster embeddings with GMM."""
    print("Clustering embeddings...")
    gmm = GaussianMixture(n_components=N_CLUSTERS, covariance_type='full', random_state=42)
    cluster_labels = gmm.fit_predict(embeddings)
    np.save(output_file, cluster_labels)
    return cluster_labels

def index_embeddings(embeddings, output_file):
    """Index embeddings with FAISS."""
    print("Indexing embeddings with FAISS...")
    faiss.normalize_L2(embeddings)
    index = faiss.IndexFlatL2(768)  # DINOv2 embedding size
    index.add(embeddings)
    faiss.write_index(index, output_file)

def tag_images(image_paths, output_file):
    """Tag images with CLIP (zero-shot)."""
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(DEVICE)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    
    metadata = []
    print("Tagging images...")
    for path in tqdm(image_paths, desc="Tagging"):
        try:
            image = Image.open(path).convert("RGB")
            inputs = processor(text=TAGS, images=image, return_tensors="pt", padding=True).to(DEVICE)
            with torch.no_grad():
                outputs = model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1).cpu().numpy()[0]
            top_tags = [TAGS[i] for i in np.argsort(probs)[-3:]]  # Top 3 tags
            metadata.append({"path": path, "tags": top_tags})
        except Exception as e:
            print(f"Error tagging {path}: {e}")
            metadata.append({"path": path, "tags": []})
    
    with open(output_file, "w") as f:
        json.dump(metadata, f)
    return metadata

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Step 1: Collect image paths
    image_paths = [os.path.join(IMAGE_DIR, f) for f in os.listdir(IMAGE_DIR) 
                   if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    if not image_paths:
        raise ValueError(f"No images found in {IMAGE_DIR}")
    print(f"Found {len(image_paths)} images.")

    # Step 2: Generate embeddings
    embeddings_file = os.path.join(OUTPUT_DIR, "embeddings.npy")
    embeddings = generate_embeddings(image_paths, embeddings_file)

    # Step 3: Cluster embeddings
    cluster_file = os.path.join(OUTPUT_DIR, "cluster_labels.npy")
    cluster_labels = cluster_embeddings(embeddings, cluster_file)

    # Step 4: Index embeddings with FAISS
    faiss_file = os.path.join(OUTPUT_DIR, "faiss_index.bin")
    index_embeddings(embeddings, faiss_file)

    # Step 5: Tag images and generate metadata
    metadata_file = os.path.join(OUTPUT_DIR, "metadata.json")
    metadata = tag_images(image_paths, metadata_file)

    print("All tasks completed successfully!")
    print(f"- Embeddings: {embeddings_file} ({embeddings.shape})")
    print(f"- Cluster labels: {cluster_file} ({len(cluster_labels)} labels)")
    print(f"- FAISS index: {faiss_file}")
    print(f"- Metadata: {metadata_file} ({len(metadata)} entries)")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"An error occurred: {e}")