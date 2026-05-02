import os
import json
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from .env file
load_dotenv(override=True)

DATABASE_URL = "postgresql://postgres:Rishi@localhost/civic_triage"
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

class GrievanceAnalysis(BaseModel):
    translated_text: str = Field(description="The English translation/transcription of the user's description, or visual description if none provided")
    visual_issue: str = Field(description="What you see in the image (e.g., 'pothole', 'broken pipe')")
    severity: str = Field(description="'Low', 'Medium', 'High', or 'Critical'")
    department: str = Field(description="'Roads', 'Water', 'Sanitation', or 'Electricity'")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Civic Grievance API")

# Mount the static directory for the frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

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
        # Read the image file bytes
        contents = await file.read()
        
        parts = []
        
        prompt_intro = """
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
                longitude=lng
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
                "longitude": g.longitude
            }
            for g in grievances
        ]
    finally:
        db.close()
