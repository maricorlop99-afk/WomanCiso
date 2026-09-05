import sqlite3
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "centinela.db"


def crear_tabla_si_no_existe():
    """Crea la tabla 'eventos' si no existe. Es idempotente (seguro ejecutarlo múltiples veces)."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS eventos(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha TEXT,
                tipo TEXT,
                confianza REAL,
                imagen TEXT
            )
        """)
        conn.commit()
        conn.close()
        print(f"✅ Base de datos verificada/creada en: {DB_PATH}")
    except Exception as e:
        print(f"❌ Error creando/verificando la base de datos: {e}")


# Al importar este módulo, se asegura de que la tabla existe.
# Esto beneficia tanto al backend (uvicorn) como al detector (detector.py).
crear_tabla_si_no_existe()


def guardar_evento(tipo, confianza, imagen):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO eventos
        (fecha, tipo, confianza, imagen)
        VALUES (?, ?, ?, ?)
    """, (
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        tipo,
        confianza,
        imagen
    ))

    conn.commit()
    conn.close()


def obtener_eventos():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT fecha, tipo, confianza, imagen
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
    except sqlite3.OperationalError as e:
        # Si por algún motivo extremo la tabla no existe (nunca debería, porque la creamos arriba),
        # devolvemos una lista vacía para que el endpoint /eventos no reviente con un 500.
        print(f"⚠️ Advertencia en obtener_eventos: {e}")
        return []
