
import sqlite3
import os

DB_FILE = "gestion_documental.db"

def migrate_db():
    if not os.path.exists(DB_FILE):
        print(f"Base de datos {DB_FILE} no encontrada.")
        return

    print(f"Conectando a {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Columnas a agregar
    columns_to_add = [
        ("password_reset_token_hash", "VARCHAR"),
        ("password_reset_token_expires_at", "DATETIME"),
        ("password_reset_token_used_at", "DATETIME")
    ]

    for col_name, col_type in columns_to_add:
        try:
            print(f"Intentando agregar columna {col_name}...")
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"✅ Columna {col_name} agregada correctamente.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"⚠️ La columna {col_name} ya existe.")
            else:
                print(f"❌ Error al agregar {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migración completada.")

if __name__ == "__main__":
    migrate_db()
