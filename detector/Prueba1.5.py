from ultralytics import YOLO
import cv2
from datetime import datetime
import time
import os
import requests


import sys
import os

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.crud import guardar_evento

# =====================================================
# TELEGRAM
# =====================================================

TELEGRAM_TOKEN = "8571786725:AAEaIRDjtjyRck8WG4Px0trwGULSMpx5lsw"
TELEGRAM_CHAT_ID = "1603925280"

# =====================================================
# MODO
# =====================================================

# True  = Webcam
# False = Video

USE_WEBCAM = False 

# Ruta video si USE_WEBCAM = False
VIDEO_PATH = r"C:\Users\yeyam\OneDrive\Documentos\Proyecto Woman\CENTINELA-X\detector\video5.mp4"

# =====================================================
# CARGAR MODELO
# =====================================================

model = YOLO(
    r"C:\Users\yeyam\OneDrive\Documentos\Proyecto Woman\CENTINELA-X\detector\runs\detect\train-4\weights\best.pt"
)
# =====================================================
# FUENTE VIDEO
# =====================================================

if USE_WEBCAM:

    print("📷 Usando webcam")

    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

else:

    print(f"🎥 Analizando video: {VIDEO_PATH}")

    cap = cv2.VideoCapture(VIDEO_PATH)

# =====================================================
# VALIDAR CÁMARA / VIDEO
# =====================================================

if not cap.isOpened():

    print("No se pudo abrir la fuente de video")

    exit()

print("Sistema iniciado correctamente")

# =====================================================
# CARPETA EVIDENCIA
# =====================================================

os.makedirs("evidence", exist_ok=True)

# =====================================================
# ALERTAS
# =====================================================

last_alert_time = 0

cooldown = 15

# =====================================================
# FUNCIÓN TELEGRAM
# =====================================================

def send_telegram_alert(message, image_path):

    url = (
        f"https://api.telegram.org/bot"
        f"{TELEGRAM_TOKEN}/sendPhoto"
    )

    with open(image_path, "rb") as photo:

        files = {
            "photo": photo
        }

        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "caption": message
        }

        response = requests.post(
            url,
            files=files,
            data=data
        )

    if response.status_code == 200:

        print("📨 Alerta enviada a Telegram")

    else:

        print("❌ Error enviando alerta")

# =====================================================
# VENTANA
# =====================================================

cv2.namedWindow(
    "CENTINELA IA",
    cv2.WINDOW_NORMAL
)

# =====================================================
# LOOP PRINCIPAL
# =====================================================

while True:

    ret, frame = cap.read()

    # =================================================
    # FIN VIDEO
    # =================================================

    if not ret:

        print("Fin del video o error")

        break

    # =================================================
    # IA
    # =================================================

    results = model(frame)

    # =================================================
    # DETECCIONES
    # =================================================

    for r in results:

        for box in r.boxes:

            cls = int(box.cls[0])

            confidence = float(box.conf[0])

            label = model.names[cls]

            # =========================================
            # DETECCIÓN
            # =========================================

            # Aqui pondremos gun (arma) 

            if label == "pistol" and confidence > 0.50:

                current_time = time.time()

                # =====================================
                # EVITAR SPAM
                # =====================================

                if current_time - last_alert_time > cooldown:

                    timestamp = datetime.now().strftime(
                        "%Y%m%d_%H%M%S"
                    )

                    filename = (
                        f"evidence/"
                        f"event_{timestamp}.jpg"
                    )

                    # =================================
                    # GUARDAR EVIDENCIA
                    # =================================

                    cv2.imwrite(filename, frame)
                    # ==============================
                    # GUARDAR EVENTO EN BD
                    # ==============================

                    guardar_evento(
                        "Pistol",
                        confidence,
                        filename
                    )

                    print("\n🚨 EVENTO DETECTADO")

                    print(f"📊 Confianza: {confidence:.2f}")

                    print(f"🖼 Evidencia: {filename}")

                    current_datetime = datetime.now().strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )

                    # =================================
                    # MENSAJE ALERTA
                    # =================================

                    source_type = (
                        "WEBCAM"
                        if USE_WEBCAM
                        else "VIDEO"
                    )

                    alert_message = f"""
🚨 ALERTA CENTINELA IA

⚠ Evento detectado

🏷 Objeto:
{label}

📊 Confianza:
{confidence:.2f}

📹 Fuente:
{source_type}

🕒 Fecha/Hora:
{current_datetime}
"""

                    # =================================
                    # TELEGRAM
                    # =================================

                    try:

                        send_telegram_alert(
                            alert_message,
                            filename
                        )

                    except Exception as e:

                        print("❌ Error Telegram:", e)

                    last_alert_time = current_time

    # =================================================
    # FRAME ANOTADO
    # =================================================

    annotated_frame = results[0].plot()
    cv2.imwrite(
    r"C:\Users\yeyam\OneDrive\Documentos\Proyecto Woman\CENTINELA-X\detector\frame.jpg",
    annotated_frame
)

    # =================================================
    # TEXTO MODO
    # =================================================

    mode_text = (
        "MODO: WEBCAM"
        if USE_WEBCAM
        else "MODO: VIDEO"
    )

    cv2.putText(
        annotated_frame,
        mode_text,
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    # =================================================
    # MOSTRAR VIDEO
    # =================================================

    cv2.imshow(
        "CENTINELA IA",
        annotated_frame
    )

    # =================================================
    # SALIR
    # =================================================

    if cv2.waitKey(1) & 0xFF == 27:

        break

# =====================================================
# CERRAR
# =====================================================

cap.release()

cv2.destroyAllWindows()

print("🛑 Sistema finalizado")