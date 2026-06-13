from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Admin, DepartmentAdmin
from ..schemas import UserSignup
from ..security import get_password_hash, verify_password, create_access_token, init_default_accounts

router = APIRouter(tags=["auth"])

@router.post("/signup")
async def signup_user(user_data: UserSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    new_user = User(username=user_data.username, hashed_password=get_password_hash(user_data.password))
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    init_default_accounts(db)
    
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()
    if admin and verify_password(form_data.password, admin.hashed_password):
        access_token = create_access_token(data={"sub": admin.username, "role": "admin"})
        return {"access_token": access_token, "token_type": "bearer", "role": "admin"}
        
    dept_admin = db.query(DepartmentAdmin).filter(DepartmentAdmin.username == form_data.username).first()
    if dept_admin and verify_password(form_data.password, dept_admin.hashed_password):
        access_token = create_access_token(data={"sub": dept_admin.username, "role": "department", "department": dept_admin.department_name})
        return {"access_token": access_token, "token_type": "bearer", "role": "department", "department": dept_admin.department_name}
        
    user = db.query(User).filter(User.username == form_data.username).first()
    if user and verify_password(form_data.password, user.hashed_password):
        access_token = create_access_token(data={"sub": user.username, "role": "user"})
        return {"access_token": access_token, "token_type": "bearer", "role": "user"}

    raise HTTPException(status_code=401, detail="Incorrect username or password")
