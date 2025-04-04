from fastapi import FastAPI
from fastapi.responses import FileResponse
from PIL import Image
import numpy as np
import faiss
import json
import random
import os

index = faiss.read_index("data/faiss_index.bin")
embeddings = np.load("data/embeddings.npy")
with open("data/metadata.json", "r") as f:
    metadata = json.load(f)
locked_embedding = None

def search(query: str):
    global locked_embedding
    if locked_embedding is not None:
        distances, indices = index.search(locked_embedding, k=7)
        return {"images": [metadata[i]["path"] for i in indices[0]]}
    query_tags = query.split(",")
    matches = [i for i, meta in enumerate(metadata) if any(tag in meta["tags"] for tag in query_tags)]
    sample_indices = random.sample(matches, min(7, len(matches)))
    return {"images": [metadata[i]["path"] for i in sample_indices]}

def lock_image(image_path: str):
    global locked_embedding
    idx = next(i for i, meta in enumerate(metadata) if meta["path"] == image_path)
    locked_embedding = embeddings[idx:idx+1]  # Shape: (1, 768)
    return {"status": "locked"}

def save_moodboard():
    global locked_embedding
    images = search("") if locked_embedding is not None else search("default")
    imgs = [Image.open(path).resize((200, 200)) for path in images["images"]]
    combined = Image.new("RGB", (800, 400))  # 4x2 grid
    for i, img in enumerate(imgs[:7]):
        combined.paste(img, ((i % 4) * 200, (i // 4) * 200))
    combined.save("moodboard.png")
    return combined

def get_image(image_path: str):
    return os.path.join("data/images", image_path)

def main():
    global locked_embedding
    while True:
        print("\nOptions:")
        print("1. Search")
        print("2. Lock an image")
        print("3. Save moodboard")
        print("4. Exit")
        choice = input("Select an option (1-4): ")

        if choice == "1":
            query = input("Enter search query (comma-separated tags): ")
            result = search(query)
            print("Search results:", result["images"])

        elif choice == "2":
            image_path = input("Enter the path of the image to lock: ")
            if os.path.exists(image_path):
                result = lock_image(image_path)
                print(result["status"])
            else:
                print("Image not found!")

        elif choice == "3":
            result = save_moodboard()
            print(result)

        elif choice == "4":
            print("Exiting...")
            break

        else:
            print("Invalid option. Please try again.")

if __name__ == "__main__":
    main()