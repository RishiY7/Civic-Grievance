from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base, engine

class Grievance(Base):
    __tablename__ = "grievances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    original_text = Column(String, nullable=True)
    translated_text = Column(String, nullable=True)
    department = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_path = Column(String, nullable=True)
    visual_issue = Column(String, nullable=True)
    
    # Module additions
    image_description = Column(String, nullable=True) 
    citizen_email = Column(String, nullable=True) 
    status = Column(String, default="Open")
    
    # Duplicate Detection
    is_duplicate = Column(Boolean, default=False)
    parent_id = Column(Integer, nullable=True)

    user = relationship("User", back_populates="grievances")

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class DepartmentAdmin(Base):
    __tablename__ = "department_admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    department_name = Column(String) # 'Roads', 'Water', 'Sanitation', 'Electricity'

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    grievances = relationship("Grievance", back_populates="user")

# Create tables
Base.metadata.create_all(bind=engine)
