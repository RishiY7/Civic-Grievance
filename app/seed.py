import os
from sqlalchemy.orm import Session
from .models import User, UserRole
from .security import get_password_hash
from .database import SessionLocal

def seed_default_users():
    """
    Seeds default admin and department accounts from environment variables (.env).
    Ensures accounts are ready out-of-the-box upon server startup.
    """
    db: Session = SessionLocal()
    try:
        accounts = [
            {
                "username": os.getenv("DEFAULT_ADMIN_USER", "admin"),
                "password": os.getenv("DEFAULT_ADMIN_PASS", "adminpass"),
                "full_name": "System Administrator",
                "role": UserRole.admin,
                "department": None,
            },
            {
                "username": os.getenv("DEPT_ROADS_USER", "roads"),
                "password": os.getenv("DEPT_ROADS_PASS", "roadspass"),
                "full_name": "Roads & Infrastructure Department",
                "role": UserRole.department_official,
                "department": "Roads",
            },
            {
                "username": os.getenv("DEPT_WATER_USER", "water"),
                "password": os.getenv("DEPT_WATER_PASS", "waterpass"),
                "full_name": "Water & Sewage Department",
                "role": UserRole.department_official,
                "department": "Water",
            },
            {
                "username": os.getenv("DEPT_SANITATION_USER", "sanitation"),
                "password": os.getenv("DEPT_SANITATION_PASS", "sanitationpass"),
                "full_name": "Sanitation & Waste Management",
                "role": UserRole.department_official,
                "department": "Sanitation",
            },
            {
                "username": os.getenv("DEPT_ELECTRICITY_USER", "electricity"),
                "password": os.getenv("DEPT_ELECTRICITY_PASS", "electricitypass"),
                "full_name": "Electricity & Power Department",
                "role": UserRole.department_official,
                "department": "Electricity",
            },
        ]

        for acc in accounts:
            if not acc["username"] or not acc["password"]:
                continue

            existing_user = db.query(User).filter(User.email.ilike(acc["username"])).first()
            if not existing_user:
                new_user = User(
                    email=acc["username"],
                    hashed_password=get_password_hash(acc["password"]),
                    full_name=acc["full_name"],
                    role=acc["role"],
                    department=acc["department"]
                )
                db.add(new_user)
                print(f"[SEED] Created default account: {acc['username']} ({acc['role'].value if hasattr(acc['role'], 'value') else acc['role']})")
            else:
                # Update password and role to ensure .env stays in sync
                existing_user.hashed_password = get_password_hash(acc["password"])
                existing_user.role = acc["role"]
                existing_user.department = acc["department"]

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[SEED] Notice during user seeding: {e}")
    finally:
        db.close()
