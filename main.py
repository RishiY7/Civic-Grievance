import os
import json
import shutil
import uuid
from math import radians, cos, sin, asin, sqrt
from typing import Optional
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from fastapi.responses import FileResponse
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import OpenAI

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables
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
    visual_issue = Column(String, nullable=True)

    # --- NEW COLUMNS FOR DUPLICATE DETECTION ---    is_duplicate = Column(Boolean, default=False)
    parent_id = Column(Integer, nullable=True)

# --- SECURITY SETUP ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class GrievanceAnalysis(BaseModel):
    translated_text: str = Field(description="The English translation/transcription of the user's description, or visual description if none provided")
    visual_issue: str = Field(description="What you see in the image (e.g., 'pothole', 'broken pipe')")
    severity: str = Field(description="'Low', 'Medium', 'High', or 'Critical'")
    department: str = Field(description="'Roads', 'Water', 'Sanitation', or 'Electricity'")

Base.metadata.create_all(bind=engine)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculates the distance in meters between two GPS coordinates using the Haversine formula."""
    R = 6371000  # Radius of Earth in meters
    
    dLat = radians(lat2 - lat1)
    dLon = radians(lon2 - lon1)
    lat1 = radians(lat1)
    lat2 = radians(lat2)
    
    a = sin(dLat/2)**2 + cos(lat1)*cos(lat2)*sin(dLon/2)**2
    c = 2 * asin(sqrt(a))
    
    return R * c

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

app = FastAPI(title="Civic Grievance API")

os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

yolo_model = YOLO("civic_model.pt")

# --- API KEY SETUP ---
# 1. NVIDIA / Sarvam Setup
nvidia_api_key = os.getenv("NVIDIA_API_KEY")
nvidia_client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=nvidia_api_key
) if nvidia_api_key else None

# 2. Gemini Multi-Key Backup Setup
gemini_keys_str = os.getenv("GEMINI_API_KEYS", "")
gemini_keys = [k.strip() for k in gemini_keys_str.split(",") if k.strip()]

if not gemini_keys:
    print("Warning: GEMINI_API_KEYS environment variable is not set. API calls will fail.")

def call_gemini_with_fallback(parts, response_schema):
    """Loops through available Gemini keys and models until one succeeds."""
    models_to_try = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview', 'gemini-1.5-flash']
    last_error = None
    for key in gemini_keys:
        for model_name in models_to_try:
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=parts,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=response_schema,
                    )
                )
                return response
            except Exception as e:
                print(f"Warning: Model {model_name} with API Key ending in ...{key[-4:]} failed. Error: {e}")
                last_error = e
                continue  # Try the next model/key
            
    raise HTTPException(status_code=500, detail=f"All Gemini API keys and models failed. Last error: {last_error}")

def translate_with_sarvam(text: str) -> str:
    """Uses NVIDIA's Sarvam endpoint for native translation."""
    if not text or not nvidia_client:
        return text
    try:
        completion = nvidia_client.chat.completions.create(
            model="sarvamai/sarvam-m",
            messages=[{"role":"user","content": f"Accurately translate this civic grievance to English. Use simple, everyday words. Only return the translated text: {text}"}],
            temperature=0.5,
            top_p=1,
            max_tokens=16384,
            stream=False
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Sarvam translation failed, falling back to original text. Error: {e}")
        return text

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

@app.post("/submit-grievance")
async def submit_grievance(
    file: UploadFile = File(...),
    text: str = Form(default=""),
    audio: Optional[UploadFile] = File(default=None),
    lat: float = Form(...),
    lng: float = Form(...)
):
    try:
        # --- 0. SECURITY CHECK: FILE VALIDATION ---
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid file format. Only images are allowed.")

        # --- 1. SAVE THE IMAGE ---
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        image_path = f"static/uploads/{unique_filename}"
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        with open(image_path, "rb") as f:
            contents = f.read()

        # --- 2. RUN YOLOv8 INFERENCE ---
        yolo_results = yolo_model(image_path)
        
        detected_issues = []
        for result in yolo_results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                class_name = yolo_model.names[class_id]
                detected_issues.append(class_name)
                
        unique_issues = list(set(detected_issues))
        yolo_findings = ", ".join(unique_issues) if unique_issues else "No trained issues detected"

        db_image_url = f"/static/uploads/{unique_filename}" 

        # --- 3. SARVAM NATIVE TRANSLATION ---
        translated_text = translate_with_sarvam(text)

        # --- 4. PREPARE MULTIMODAL PAYLOAD ---
        parts = []
        prompt_intro = f"""
        The custom computer vision model scanned the image and detected: [{yolo_findings}].
        
        Analyze the provided image and the user's description of a civic grievance.
        """
        
        if translated_text:
            prompt_intro += f'\nUser Description (Pre-Translated via Sarvam AI): "{translated_text}"'
            
        if audio and audio.filename:
            audio_contents = await audio.read()
            parts.append(
                types.Part.from_bytes(
                    data=audio_contents,
                    mime_type=audio.content_type or "audio/webm",
                )
            )
            prompt_intro += '\nUser Description (Audio): Please listen to the provided audio file.'
        
        if not translated_text and not (audio and audio.filename):
            prompt_intro += '\nUser Description: No text or audio description provided. Please infer the issue solely from the image.'

        prompt_tasks = """
        Perform the following tasks:
        1. Review the pre-translated text (if provided) and image. If audio is provided, translate it to English.
        2. Identify the core civic issue visually and contextually.
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
        
        # --- 5. EXECUTE GEMINI WITH MULTI-KEY BACKUP ---
        response = call_gemini_with_fallback(parts, GrievanceAnalysis)
        response_text = response.text.strip()
        
        ai_analysis = json.loads(response_text)
        ai_analysis["image_path"] = db_image_url
        
        # Override the Gemini translated text with the Sarvam text if Sarvam processed it successfully
        if translated_text and text:
            ai_analysis["translated_text"] = translated_text
        
        # --- 6. DUPLICATE DETECTION & SAVE TO DATABASE ---
        with SessionLocal() as db:
            is_duplicate = False
            parent_id = None
            
            # Step A: Find all existing original (non-duplicate) tickets in the SAME department
            existing_tickets = db.query(Grievance).filter(
                Grievance.department == ai_analysis.get("department"),
                Grievance.is_duplicate == False
            ).all()
            
            # Step B: Check the distance against every existing ticket
            for ticket in existing_tickets:
                if ticket.latitude and ticket.longitude:
                    distance = calculate_distance(lat, lng, ticket.latitude, ticket.longitude)
                    
                    # If it's within 50 meters, flag it!
                    if distance <= 50.0:
                        print(f"DUPLICATE DETECTED! Only {distance:.1f} meters from Ticket #{ticket.id}")
                        is_duplicate = True
                        parent_id = ticket.id
                        break # Stop searching, we found the parent
            
            # Step C: Save the new grievance with its duplicate status
            new_grievance = Grievance(
                original_text=text,
                translated_text=ai_analysis.get("translated_text"),
                visual_issue=ai_analysis.get("visual_issue"),
                department=ai_analysis.get("department"),
                severity=ai_analysis.get("severity"),
                latitude=lat,
                longitude=lng,
                image_path=db_image_url,
                is_duplicate=is_duplicate,
                parent_id=parent_id
            )
            db.add(new_grievance)
            db.commit()
            db.refresh(new_grievance)
            
            # Attach the duplicate status to the JSON response so the frontend knows
            ai_analysis["is_duplicate"] = is_duplicate
            if is_duplicate:
                ai_analysis["duplicate_warning"] = f"Flagged as a duplicate of Ticket #{parent_id}."
        
        return {
            "ai_analysis": ai_analysis,
            "coordinates": {
                "lat": lat,
                "lng": lng
            }
        }
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON from AI response: {response_text}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response as JSON")
    except Exception as e:
        print(f"Error processing grievance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    with SessionLocal() as db:
        # Check if the user exists
        admin = db.query(Admin).filter(Admin.username == form_data.username).first()
        
        default_admin_user = os.getenv("DEFAULT_ADMIN_USER")
        default_admin_pass = os.getenv("DEFAULT_ADMIN_PASS")
        
        if not admin and default_admin_user and default_admin_pass:
            if form_data.username == default_admin_user and form_data.password == default_admin_pass:
                new_admin = Admin(username=default_admin_user, hashed_password=get_password_hash(default_admin_pass))
                db.add(new_admin)
                db.commit()
                admin = new_admin
            
        if not admin or not verify_password(form_data.password, admin.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect username or password")
            
        access_token = create_access_token(data={"sub": admin.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        return {"access_token": access_token, "token_type": "bearer"}

# --- PROTECT THIS ROUTE ---
# Notice we added `current_admin: str = Depends(get_current_admin)`
@app.get("/grievances")
async def get_grievances(current_admin: str = Depends(get_current_admin)):
    with SessionLocal() as db:
        grievances = db.query(Grievance).all()
        return [
            {
                "id": g.id,
                "original_text": g.original_text,
                "translated_text": g.translated_text,
                "visual_issue": g.visual_issue,
                "department": g.department,
                "severity": g.severity,
                "latitude": g.latitude,
                "longitude": g.longitude,
                "image_path": g.image_path,
                "is_duplicate": g.is_duplicate,
                "parent_id": g.parent_id
            }
            for g in grievances
        ]