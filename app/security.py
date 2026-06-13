import os
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from .database import SessionLocal
from .models import Admin, DepartmentAdmin

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        department: str = payload.get("department")
        if username is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return {"username": username, "role": role, "department": department}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def get_optional_user_token(token: str = Depends(OAuth2PasswordBearer(tokenUrl="/token", auto_error=False))):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        return {"username": username, "role": role}
    except jwt.PyJWTError:
        return None

def init_default_accounts(db):
    default_admin_user = os.getenv("DEFAULT_ADMIN_USER")
    default_admin_pass = os.getenv("DEFAULT_ADMIN_PASS")
    if default_admin_user and default_admin_pass:
        if not db.query(Admin).filter(Admin.username == default_admin_user).first():
            db.add(Admin(username=default_admin_user, hashed_password=get_password_hash(default_admin_pass)))
    
    departments = ["Roads", "Water", "Sanitation", "Electricity"]
    for dept in departments:
        env_user = os.getenv(f"DEPT_{dept.upper()}_USER")
        env_pass = os.getenv(f"DEPT_{dept.upper()}_PASS")
        if env_user and env_pass:
            if not db.query(DepartmentAdmin).filter(DepartmentAdmin.username == env_user).first():
                db.add(DepartmentAdmin(username=env_user, hashed_password=get_password_hash(env_pass), department_name=dept))
    db.commit()
