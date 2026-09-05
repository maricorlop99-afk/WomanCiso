"""
Migración única: limpia la columna 'imagen' de centinela.db.

Antes: podía guardar rutas relativas dependientes del SO
       (ej. "evidence\\event_20260722_202750.jpg" en Windows).
Después: solo el nombre de archivo (ej. "event_20260722_202750.jpg"),
       que es lo que backend/crud.py guarda desde ahora y lo que
       dashboard/script.js espera para construir la URL de /evidence.

Uso:
    cd backend
    python migrar_evidencia.py
"""

import ntpath
import posixpath
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "centinela.db"


def solo_nombre_archivo(imagen):
    if not imagen:
        return imagen
    return posixpath.basename(ntpath.basename(imagen))


def main():
    if not DB_PATH.exists():
        print(f"❌ No se encontró {DB_PATH}")
        return

    # Respaldo antes de tocar nada
    respaldo = DB_PATH.with_name(
        f"centinela.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    )
    shutil.copy2(DB_PATH, respaldo)
    print(f"🗄️  Respaldo creado en: {respaldo}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT id, imagen FROM eventos")
    filas = cursor.fetchall()

    cambios = 0
    for id_, imagen in filas:
        nuevo = solo_nombre_archivo(imagen)
        if nuevo != imagen:
            cursor.execute(
                "UPDATE eventos SET imagen = ? WHERE id = ?", (nuevo, id_)
            )
            cambios += 1
            print(f"  id={id_}: '{imagen}' → '{nuevo}'")

    conn.commit()
    conn.close()

    print(
        f"\n✅ Migración completa. {cambios} de {len(filas)} filas actualizadas.")
    if cambios == 0:
        print("   (No había nada que corregir.)")


if __name__ == "__main__":
    main()
