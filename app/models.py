import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum
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
    status = Column(String, default="Pending")
    proof_image_path = Column(String, nullable=True)
    
    # Duplicate Detection
    is_duplicate = Column(Boolean, default=False)
    parent_id = Column(Integer, nullable=True)

    user = relationship("User", back_populates="grievances")

class UserRole(str, enum.Enum):
    citizen = "citizen"
    department_official = "department_official"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    
    role = Column(Enum(UserRole), default=UserRole.citizen, nullable=False)
    department = Column(String, nullable=True) 
    is_active = Column(Boolean, default=True)

    grievances = relationship("Grievance", back_populates="user")

# Create tables
Base.metadata.create_all(bind=engine)
