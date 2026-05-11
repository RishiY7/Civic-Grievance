from main import engine
from sqlalchemy import text

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE grievances ADD COLUMN email VARCHAR"))
    print("Successfully added email column.")
except Exception as e:
    print("Error adding email column:", e)
