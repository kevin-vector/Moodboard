from transformers import CLIPProcessor, CLIPModel
import torch
from PIL import Image
import numpy as np
import json

# Load CLIP
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Your 109 tags
tags = [
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

def tag_image(image_path):
    image = Image.open(image_path).convert("RGB")
    inputs = processor(text=tags, images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
    logits_per_image = outputs.logits_per_image
    probs = logits_per_image.softmax(dim=1).cpu().numpy()[0]
    top_tags = [tags[i] for i in np.argsort(probs)[-3:]]  # Top 3 tags
    return top_tags

def generate_metadata(image_paths_file, output_file):
    with open(image_paths_file, "r") as f:
        image_paths = f.read().splitlines()
    metadata = [{"path": path, "tags": tag_image(path)} for path in image_paths]
    with open(output_file, "w") as f:
        json.dump(metadata, f)

if __name__ == "__main__":
    generate_metadata("../data/image_paths.txt", "../data/metadata.json")
    print("Generated metadata with tags.")