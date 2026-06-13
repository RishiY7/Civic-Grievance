from pydantic import BaseModel, Field

class UserSignup(BaseModel):
    username: str
    password: str

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
