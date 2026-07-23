from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.crud import obtener_eventos

# ===========================
# Crear aplicación
# ===========================

app = FastAPI(title="CENTINELA-X")

# ===========================
# CORS
# ===========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================
# Ruta de la imagen
# ===========================

BASE_DIR = Path(__file__).resolve().parent
FRAME_PATH = BASE_DIR.parent / "detector" / "frame.jpg"

# ===========================
# API
# ===========================

@app.get("/")
def inicio():
    return {"mensaje": "CENTINELA-X funcionando"}

@app.get("/frame")
def frame():

    if not FRAME_PATH.exists():
        return {"error": "No existe frame.jpg"}

    return FileResponse(str(FRAME_PATH))

@app.get("/eventos")
def eventos():
    return obtener_eventos()