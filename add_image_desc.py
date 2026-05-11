from main import engine
from sqlalchemy import text

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE grievances ADD COLUMN image_description VARCHAR"))
    print("Successfully added image_description column.")
except Exception as e:
    print("Error adding image_description:", e)
