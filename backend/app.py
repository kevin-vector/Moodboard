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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Replace with your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

index = faiss.read_index("data/faiss_index.bin")
embeddings = np.load("data/embeddings.npy")
with open("data/metadata.json", "r") as f:
    metadata = json.load(f)
locked_embedding = None

class LockRequest(BaseModel):
    image_path: str  # Assuming your frontend sends 'imageId' in the body

@app.get("/api/search")
async def search(query: str):
    global locked_embedding
    if locked_embedding is not None:
        distances, indices = index.search(locked_embedding, k=100)
        top_k_indices = indices[0].tolist()
        if len(top_k_indices) <= 7:
            selected_indices = top_k_indices
        else:
            selected_indices = random.sample(top_k_indices, 7)
        return {"images": [metadata[i]["path"] for i in selected_indices]}
        # return {"images": [metadata[i]["path"] for i in indices[0]]}
    query_tags = query.split(",")
    matches = [i for i, meta in enumerate(metadata) if any(tag in meta["tags"] for tag in query_tags)]
    sample_indices = random.sample(matches, min(7, len(matches)))
    return {"images": [metadata[i]["path"] for i in sample_indices]}

@app.post("/api/lock")
async def lock(request_body: LockRequest):
    image_path = request_body.image_path
    global locked_embedding
    idx = next(i for i, meta in enumerate(metadata) if meta["path"] == image_path)
    locked_embedding = embeddings[idx:idx+1]  # Shape: (1, 768)
    return {"status": "locked"}

@app.get("/api/save")
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
@app.get("/api/images/{image_path:path}")
async def get_image(image_path: str):
    return FileResponse(os.path.join("data/images", image_path))