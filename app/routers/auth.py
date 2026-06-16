from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate
from ..security import get_password_hash, verify_password, create_access_token

router = APIRouter(tags=["auth"])

@router.post("/signup")
async def signup_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
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
    
    # 1. ONE clean query to find the user
    user = db.query(User).filter(User.email == form_data.username).first()

    # 2. Verify existence and password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Bake the role and department right into the JWT Token!
    access_token = create_access_token(
        data={
            "sub": user.email, 
            "role": user.role.value, 
            "department": user.department
        }
    )

    # 4. Return to React
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role.value,
        "department": user.department
    }
