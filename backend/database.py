import sqlite3

conn = sqlite3.connect("centinela.db")

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