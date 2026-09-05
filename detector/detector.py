# ============================================================
# DETECTOR CENTINELA-X
# ============================================================
import sys
from pathlib import Path

# Esto DEBE ir antes de cualquier import que dependa de 'backend'
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import json
import time
import os
from datetime import datetime
import cv2
import requests
import torch
from dotenv import load_dotenv
from ultralytics import YOLO
from backend.crud import guardar_evento

load_dotenv()

# ============================================================
# CONFIGURACION
# ============================================================
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
TELEGRAM_ENABLED = bool(TELEGRAM_TOKEN and TELEGRAM_CHAT_ID)
if not TELEGRAM_ENABLED:
    print("Telegram no configurado.")

USE_WEBCAM = False
VIDEO_PATH = PROJECT_ROOT / "detector" / "arma.mp4"
MODEL_PATH = PROJECT_ROOT / "detector" / "runs" / "detect" / "train-4" / "weights" / "best.pt"
EVIDENCE_DIR = PROJECT_ROOT / "evidence"
EVIDENCE_DIR.mkdir(exist_ok=True)

print("Cargando modelo YOLO...")
model = YOLO(str(MODEL_PATH))

print("Abriendo fuente de video...")
cap = cv2.VideoCapture(str(VIDEO_PATH) if not USE_WEBCAM else 0)
if not cap.isOpened():
    print("No se pudo abrir la fuente de video")
    sys.exit(1)

print("Sistema iniciado correctamente")

last_alert_time = 0
COOLDOWN = 15
frame_count = 0
start_time = time.time()
status_update_counter = 0
DETECTOR_STATUS_PATH = PROJECT_ROOT / "detector_status.json"


def send_telegram_alert(message, image_path):
    if not TELEGRAM_ENABLED:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendPhoto"
    try:
        with open(image_path, "rb") as photo:
            files = {"photo": photo}
            data = {"chat_id": TELEGRAM_CHAT_ID, "caption": message}
            requests.post(url, files=files, data=data)
        print("Alerta enviada a Telegram")
    except Exception as e:
        print(f"Error en Telegram: {e}")


def actualizar_estado_detector(fps, gpu_disponible):
    status_data = {
        "fps": round(fps, 1),
        "gpu": gpu_disponible,
        "timestamp": time.time()
    }
    try:
        with open(DETECTOR_STATUS_PATH, "w") as f:
            json.dump(status_data, f)
    except Exception as e:
        print(f"Error guardando estado: {e}")


cv2.namedWindow("CENTINELA IA", cv2.WINDOW_NORMAL)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Fin del video o error de captura")
        break

    results = model(frame)

    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            confidence = float(box.conf[0])
            label = model.names[cls]

            if label == "pistol" and confidence > 0.50:
                current_time = time.time()
                if current_time - last_alert_time > COOLDOWN:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"event_{timestamp}.jpg"
                    filepath = EVIDENCE_DIR / filename
                    cv2.imwrite(str(filepath), frame)

                    guardar_evento(
                        tipo="pistol",
                        confianza=confidence,
                        imagen=filename
                    )

                    print("EVENTO DETECTADO")
                    print(f"Confianza: {confidence:.2f}")
                    print(f"Evidencia: {filename}")

                    current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    source_type = "WEBCAM" if USE_WEBCAM else "VIDEO"
                    alert_message = f"""
ALERTA CENTINELA IA

Evento detectado

Objeto: {label}

Confianza: {confidence:.2f}

Fuente: {source_type}

Fecha/Hora: {current_datetime}
"""
                    send_telegram_alert(alert_message, str(filepath))
                    last_alert_time = current_time

    frame_count += 1
    elapsed = time.time() - start_time
    fps = frame_count / elapsed if elapsed > 0 else 0

    status_update_counter += 1
    if status_update_counter >= 10:
        gpu_disponible = torch.cuda.is_available()
        actualizar_estado_detector(fps, gpu_disponible)
        status_update_counter = 0

    annotated_frame = results[0].plot()
    frame_path = PROJECT_ROOT / "detector" / "frame.jpg"
    cv2.imwrite(str(frame_path), annotated_frame)

    mode_text = "MODO: WEBCAM" if USE_WEBCAM else "MODO: VIDEO"
    cv2.putText(annotated_frame, mode_text, (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("CENTINELA IA", annotated_frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
print("Sistema finalizado")
