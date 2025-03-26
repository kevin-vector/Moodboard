from fastapi import FastAPI
from fastapi.responses import FileResponse
from PIL import Image
import numpy as np
import faiss
import json
import random
import os

app = FastAPI()
index = faiss.read_index("data/faiss_index.bin")
embeddings = np.load("data/embeddings.npy")
with open("data/metadata.json", "r") as f:
    metadata = json.load(f)
locked_embedding = None

@app.get("/search")
async def search(query: str):
    global locked_embedding
    if locked_embedding is not None:
        distances, indices = index.search(locked_embedding, k=7)
        return {"images": [metadata[i]["path"] for i in indices[0]]}
    query_tags = query.split(",")
    matches = [i for i, meta in enumerate(metadata) if any(tag in meta["tags"] for tag in query_tags)]
    sample_indices = random.sample(matches, min(7, len(matches)))
    return {"images": [metadata[i]["path"] for i in sample_indices]}

@app.post("/lock")
async def lock_image(image_path: str):
    global locked_embedding
    idx = next(i for i, meta in enumerate(metadata) if meta["path"] == image_path)
    locked_embedding = embeddings[idx:idx+1]  # Shape: (1, 768)
    return {"status": "locked"}

@app.get("/save")
async def save_moodboard():
    global locked_embedding
    images = await search("") if locked_embedding is not None else await search("default")
    imgs = [Image.open(path).resize((200, 200)) for path in images["images"]]
    combined = Image.new("RGB", (800, 400))  # 4x2 grid
    for i, img in enumerate(imgs[:7]):
        combined.paste(img, ((i % 4) * 200, (i // 4) * 200))
    combined.save("moodboard.png")
    return FileResponse("moodboard.png")

# Serve images
@app.get("/images/{image_path:path}")
async def get_image(image_path: str):
    return FileResponse(os.path.join("data/images", image_path))