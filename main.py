import os
import json
import shutil
import uuid
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from fastapi.responses import FileResponse
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from .env file
load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Grievance(Base):
    __tablename__ = "grievances"
    id = Column(Integer, primary_key=True, index=True)
    original_text = Column(String, nullable=True)
    translated_text = Column(String, nullable=True)
    department = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_path = Column(String, nullable=True)

class GrievanceAnalysis(BaseModel):
    translated_text: str = Field(description="The English translation/transcription of the user's description, or visual description if none provided")
    visual_issue: str = Field(description="What you see in the image (e.g., 'pothole', 'broken pipe')")
    severity: str = Field(description="'Low', 'Medium', 'High', or 'Critical'")
    department: str = Field(description="'Roads', 'Water', 'Sanitation', or 'Electricity'")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Civic Grievance API")

# 1. Create a folder to permanently save uploaded images
os.makedirs("static/uploads", exist_ok=True)

# 2. Tell FastAPI to serve this folder so the frontend map can display the pictures
app.mount("/static", StaticFiles(directory="static"), name="static")

# 3. Load your custom-trained YOLOv8 brain!
yolo_model = YOLO("civic_model.pt")

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

# Configure Gemini AI
api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None
    print("Warning: Neither GEMINI_API_KEY nor GOOGLE_API_KEY environment variable is set. API calls will fail.")

@app.post("/submit-grievance")
async def submit_grievance(
    file: UploadFile = File(...),
    text: str = Form(default=""),
    audio: Optional[UploadFile] = File(default=None),
    lat: float = Form(...),
    lng: float = Form(...)
):
    if not client:
        raise HTTPException(status_code=500, detail="Server configuration error: Gemini API key is not set.")
        
    try:
        # --- 1. SAVE THE IMAGE ---
        # Give the image a unique ID so files don't overwrite each other
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        image_path = f"static/uploads/{unique_filename}"
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Read the image file bytes for Gemini after saving it
        with open(image_path, "rb") as f:
            contents = f.read()

        # --- 2. RUN YOLOv8 INFERENCE ---
        # Scan the saved image
        yolo_results = yolo_model(image_path)
        
        # Extract what the AI found into a clean list
        detected_issues = []
        for result in yolo_results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                class_name = yolo_model.names[class_id]
                detected_issues.append(class_name)
                
        # Remove duplicates (e.g., if it finds 3 potholes, just say "pothole")
        unique_issues = list(set(detected_issues))
        yolo_findings = ", ".join(unique_issues) if unique_issues else "No trained issues detected"

        # --- 3. PREPARE THE DATABASE RECORD ---
        # IMPORTANT: Make sure your SQLAlchemy model has this column: image_path = Column(String)
        db_image_url = f"/static/uploads/{unique_filename}" 

        parts = []
        
        # --- 4. UPDATE GEMINI PROMPT ---
        prompt_intro = f"""
        The custom computer vision model scanned the image and detected: [{yolo_findings}].
        
        Using this visual confirmation, and the provided audio transcript, generate a structured 
        summary of this civic grievance...
        
        Analyze the provided image and the user's description of a civic grievance.
        The description might be provided as text or as an audio recording (which could be in English, Kannada, Hindi, or a mix of these languages).
        """
        
        if text:
            prompt_intro += f'\nUser Description (Text): "{text}"'
        if audio and audio.filename:
            audio_contents = await audio.read()
            parts.append(
                types.Part.from_bytes(
                    data=audio_contents,
                    mime_type=audio.content_type or "audio/webm",
                )
            )
            prompt_intro += '\nUser Description (Audio): Please listen to the provided audio file.'
        
        if not text and not (audio and audio.filename):
            prompt_intro += '\nUser Description: No text or audio description provided. Please infer the issue solely from the image.'

        prompt_tasks = """
        Perform the following tasks:
        1. Translate the user's description (from text or audio) to English. If no description is provided, just describe the issue based on the image.
        2. Identify the issue visually from the image.
        3. Assign a severity to the issue (Low, Medium, High, Critical).
        4. Route the issue to the appropriate department (Choose one: Roads, Water, Sanitation, Electricity).
        """
        
        prompt = prompt_intro + "\n" + prompt_tasks
        parts.insert(0, prompt)
        parts.append(
            types.Part.from_bytes(
                data=contents,
                mime_type=file.content_type or "image/jpeg",
            )
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=parts,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GrievanceAnalysis,
            )
        )
        response_text = response.text.strip()
        
        # Parse the JSON response from Gemini
        ai_analysis = json.loads(response_text)
        
        # Save the grievance to the database
        db = SessionLocal()
        try:
            new_grievance = Grievance(
                original_text=text,
                translated_text=ai_analysis.get("translated_text"),
                department=ai_analysis.get("department"),
                severity=ai_analysis.get("severity"),
                latitude=lat,
                longitude=lng,
                image_path=db_image_url
            )
            db.add(new_grievance)
            db.commit()
            db.refresh(new_grievance)
        finally:
            db.close()
        
        # Return the combined result
        return {
            "ai_analysis": ai_analysis,
            "coordinates": {
                "lat": lat,
                "lng": lng
            }
        }
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON from AI response: {response.text}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except Exception as e:
        print(f"Error processing grievance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/grievances")
async def get_grievances():
    db = SessionLocal()
    try:
        grievances = db.query(Grievance).all()
        return [
            {
                "id": g.id,
                "original_text": g.original_text,
                "translated_text": g.translated_text,
                "department": g.department,
                "severity": g.severity,
                "latitude": g.latitude,
                "longitude": g.longitude,
                "image_path": g.image_path
            }
            for g in grievances
        ]
    finally:
        db.close()
)
