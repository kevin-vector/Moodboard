import torch
from torchvision import transforms
from PIL import Image
import numpy as np
import os

# Load DINOv2
dinov2 = torch.hub.load('facebookresearch/dinov2', 'dinov2_vitb14').eval()

# Preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def get_embedding(image_path):
    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0)
    with torch.no_grad():
        embedding = dinov2(tensor).cpu().numpy()
    return embedding[0]

def generate_embeddings(image_dir, output_file):
    image_paths = [os.path.join(image_dir, f) for f in os.listdir(image_dir) if f.endswith(('.png', '.jpg'))]
    embeddings = np.array([get_embedding(path) for path in image_paths])
    np.save(output_file, embeddings)
    # Save paths for metadata
    with open("image_paths.txt", "w") as f:
        f.write("\n".join(image_paths))
    return image_paths

if __name__ == "__main__":
    image_paths = generate_embeddings("../data/images/", "../data/embeddings.npy")
    print(f"Generated embeddings for {len(image_paths)} images.")