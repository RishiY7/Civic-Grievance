from main import engine
from sqlalchemy import text

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE grievances ADD COLUMN visual_issue VARCHAR"))
    print("Successfully added visual_issue column.")
except Exception as e:
    print("Error adding visual_issue:", e)

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE grievances ADD COLUMN is_duplicate BOOLEAN DEFAULT FALSE"))
    print("Successfully added is_duplicate column.")
except Exception as e:
    print("Error adding is_duplicate:", e)

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE grievances ADD COLUMN parent_id INTEGER"))
    print("Successfully added parent_id column.")
except Exception as e:
    print("Error adding parent_id:", e)
