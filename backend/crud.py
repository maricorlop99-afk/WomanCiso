import sqlite3
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "centinela.db"


def guardar_evento(tipo, confianza, imagen):

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO eventos
        (fecha,tipo,confianza,imagen)
        VALUES (?,?,?,?)
    """, (
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        tipo,
        confianza,
        imagen
    ))

    conn.commit()
    conn.close()


def obtener_eventos():

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT fecha,tipo,confianza,imagen
        FROM eventos
        ORDER BY id DESC
    """)

    filas = cursor.fetchall()

    conn.close()

    return [
        {
            "fecha": f[0],
            "tipo": f[1],
            "confianza": f[2],
            "imagen": f[3]
        }
        for f in filas
    ]