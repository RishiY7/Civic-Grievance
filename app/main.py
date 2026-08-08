import os
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, grievances, chat
from .seed import seed_default_users

app = FastAPI(title="Civic Grievance API")

@app.on_event("startup")
def on_startup():
    seed_default_users()

# Add CORS middleware to allow the frontend to interact during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's a dev demo, allowing all. Should be restricted in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(grievances.router)
app.include_router(chat.router)

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')
