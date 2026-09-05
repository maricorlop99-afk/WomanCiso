from pathlib import Path
import json
import time
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from backend.crud import obtener_eventos, DB_PATH, crear_tabla_si_no_existe

app = FastAPI(title="CENTINELA-X")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# Montar carpetas estáticas
EVIDENCE_PATH = PROJECT_ROOT / "evidence"
if EVIDENCE_PATH.exists():
    app.mount("/evidence", StaticFiles(directory=str(EVIDENCE_PATH)),
              name="evidence")

DASHBOARD_PATH = PROJECT_ROOT / "dashboard"
if DASHBOARD_PATH.exists():
    app.mount("/dashboard", StaticFiles(directory=str(DASHBOARD_PATH),
              html=True), name="dashboard")

# Montar imágenes (para logo, etc.)
IMG_PATH = DASHBOARD_PATH / "img"
if IMG_PATH.exists():
    app.mount("/img", StaticFiles(directory=str(IMG_PATH)), name="img")

FRAME_PATH = PROJECT_ROOT / "detector" / "frame.jpg"
DETECTOR_STATUS_PATH = PROJECT_ROOT / "detector_status.json"


# ==== INICIALIZACIÓN DE LA BASE DE DATOS AL ARRANCAR ====
@app.on_event("startup")
def startup_db():
    """Verifica que la base de datos y la tabla existan al iniciar el servidor."""
    crear_tabla_si_no_existe()


@app.get("/")
def landing():
    """Sirve la nueva landing (dashboard/index-landing.html)."""
    landing_file = DASHBOARD_PATH / "index-landing.html"
    if landing_file.exists():
        return FileResponse(str(landing_file))
    return {"error": "Landing page no encontrada"}, 404


@app.get("/eventos")
def eventos():
    return obtener_eventos()


@app.get("/status")
def system_status():
    """Estado en tiempo real del sistema y del detector."""
    frame_ok = FRAME_PATH.exists() and (time.time() - FRAME_PATH.stat().st_mtime) < 5

    detector_info = {}
    if DETECTOR_STATUS_PATH.exists():
        try:
            with open(DETECTOR_STATUS_PATH, "r") as f:
                detector_info = json.load(f)
        except Exception:
            pass

    return {
        "api": True,
        "db": DB_PATH.exists(),
        "camera": frame_ok,
        "detector_activo": frame_ok,
        "fps": detector_info.get("fps", 0),
        "gpu": detector_info.get("gpu", False),
        "telegram_configured": bool(os.getenv("TELEGRAM_TOKEN")),
    }


def generate_video_feed():
    """Generador de frames MJPEG para streaming continuo."""
    while True:
        if FRAME_PATH.exists():
            with open(FRAME_PATH, "rb") as f:
                frame_data = f.read()
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_data + b"\r\n")
        else:
            time.sleep(0.1)


@app.get("/video_feed")
def video_feed():
    """Endpoint de streaming MJPEG para el dashboard."""
    return StreamingResponse(generate_video_feed(),
                             media_type="multipart/x-mixed-replace; boundary=frame")
