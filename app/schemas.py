from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from .models import UserRole

# What FastAPI expects when creating a new user
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.citizen
    department: Optional[str] = None # Can be blank for citizens and admins

# What FastAPI returns to the frontend (NEVER return the password)
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    department: Optional[str] = None

    class Config:
        from_attributes = True

class StatusUpdateRequest(BaseModel):
    status: str

class DirectiveCreate(BaseModel):
    title: str
    department: str
    severity: str = "High"
    description: str
    latitude: float = 12.9716
    longitude: float = 77.5946

class GrievanceAnalysis(BaseModel):
    translated_text: str = Field(description="The English translation/transcription of the user's description, or visual description if none provided")
    visual_issue: str = Field(description="What you see in the image (e.g., 'pothole', 'broken pipe')")
    image_description: str = Field(description="A detailed description of what you see in the image")
    severity: str = Field(description="'Low', 'Medium', 'High', or 'Critical'")
    department: str = Field(description="'Roads', 'Water', 'Sanitation', or 'Electricity'")

# --- AI Form Assistant Models ---
class ChatRequest(BaseModel):
    question: str
    language: str = "English"

class TranslateRequest(BaseModel):
    texts: list[str]
    target_language: str

class TTSRequest(BaseModel):
    text: str
    lang: str = "kn"
