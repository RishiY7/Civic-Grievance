from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, UserRole
from ..schemas import UserCreate
from ..security import get_password_hash, verify_password, create_access_token

router = APIRouter(tags=["auth"])

@router.post("/signup")
async def signup_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email.ilike(user_data.email)).first():
        raise HTTPException(status_code=400, detail="Email or username already registered")
    new_user = User(
        email=user_data.email, 
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        department=user_data.department
    )
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    # 1. Query user (case-insensitive username/email)
    user = db.query(User).filter(User.email.ilike(form_data.username)).first()

    # 2. Verify existence and password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Determine role value for frontend routing & JWT
    if user.role == UserRole.department_official or str(user.role).endswith("department_official"):
        role_value = "department"
    elif user.role == UserRole.admin or str(user.role).endswith("admin"):
        role_value = "admin"
    else:
        role_value = "citizen"

    access_token = create_access_token(
        data={
            "sub": user.email, 
            "role": role_value, 
            "department": user.department
        }
    )

    # 4. Return to React
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": role_value,
        "department": user.department
    }
