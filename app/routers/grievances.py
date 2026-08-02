import os
import json
import shutil
import uuid
from math import radians, cos, sin, asin, sqrt
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from google.genai import types
from ultralytics import YOLO

from ..database import get_db
from ..models import Grievance, User
from ..schemas import GrievanceAnalysis
from ..security import get_optional_user_token
from ..ai_utils import call_gemini_with_fallback, translate_with_sarvam

router = APIRouter(tags=["grievances"])

# Initialize YOLO model
yolo_model = YOLO("civic_model.pt")

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    dLat = radians(lat2 - lat1)
    dLon = radians(lon2 - lon1)
    lat1 = radians(lat1)
    lat2 = radians(lat2)
    a = sin(dLat/2)**2 + cos(lat1)*cos(lat2)*sin(dLon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c

@router.post("/submit-grievance")
async def submit_grievance(
    file: UploadFile = File(...),
    text: str = Form(default=""),
    email: Optional[str] = Form(default=None),
    audio: Optional[UploadFile] = File(default=None),
    lat: float = Form(...),
    lng: float = Form(...),
    current_user: Optional[dict] = Depends(get_optional_user_token),
    db: Session = Depends(get_db)
):
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid file format. Only images are allowed.")

        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        image_path = f"static/uploads/{unique_filename}"
        os.makedirs("static/uploads", exist_ok=True)
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        with open(image_path, "rb") as f:
            contents = f.read()

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

        translated_text = translate_with_sarvam(text)

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
        2. Identify the core civic issue visually and contextually. The YOLO model specifically detects: garbage, pothole, streetlight, water leak, water log, wires. Ensure your analysis correlates with these if present.
        3. Assign a severity to the issue (Low, Medium, High, Critical).
        4. Route the issue to the appropriate department. Mapping guide:
           - Garbage/Sanitation -> Sanitation
           - Pothole/Road damage -> Roads
           - Streetlight/Wires -> Electricity
           - Water leak/Water log -> Water or Sanitation
           Choose EXACTLY one: Roads, Water, Sanitation, Electricity.
        """
        
        prompt = prompt_intro + "\n" + prompt_tasks
        parts.insert(0, prompt)
        parts.append(
            types.Part.from_bytes(
                data=contents,
                mime_type=file.content_type or "image/jpeg",
            )
        )
        
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GrievanceAnalysis,
        )
        response = call_gemini_with_fallback(parts, config)
        response_text = response.text.strip()
        
        ai_analysis = json.loads(response_text)
        ai_analysis["image_path"] = db_image_url
        
        if translated_text and text:
            ai_analysis["translated_text"] = translated_text

        if ai_analysis.get("translated_text") and "</think>" in ai_analysis["translated_text"]:
            ai_analysis["translated_text"] = ai_analysis["translated_text"].split("</think>")[-1].strip()
        
        is_duplicate = False
        parent_id = None
        
        existing_tickets = db.query(Grievance).filter(
            Grievance.department == ai_analysis.get("department"),
            Grievance.is_duplicate == False
        ).all()
        
        for ticket in existing_tickets:
            if ticket.latitude and ticket.longitude:
                distance = calculate_distance(lat, lng, ticket.latitude, ticket.longitude)
                if distance <= 50.0:
                    print(f"DUPLICATE DETECTED! Only {distance:.1f} meters from Ticket #{ticket.id}")
                    is_duplicate = True
                    parent_id = ticket.id
                    break 
        
        db_user_id = None
        if current_user and current_user.get("role") == "citizen":
            u = db.query(User).filter(User.email == current_user.get("username")).first()
            if u:
                db_user_id = u.id

        new_grievance = Grievance(
            user_id=db_user_id,
            original_text=text,
            translated_text=ai_analysis.get("translated_text"),
            visual_issue=ai_analysis.get("visual_issue"),
            image_description=ai_analysis.get("image_description"),
            department=ai_analysis.get("department"),
            severity=ai_analysis.get("severity"),
            latitude=lat,
            longitude=lng,
            image_path=db_image_url,
            citizen_email=email,
            is_duplicate=is_duplicate,
            parent_id=parent_id
        )
        db.add(new_grievance)
        db.commit()
        db.refresh(new_grievance)
        
        ai_analysis["is_duplicate"] = is_duplicate
        if is_duplicate:
            ai_analysis["duplicate_warning"] = f"Flagged as a duplicate of Ticket #{parent_id}."
            
        ai_analysis["id"] = new_grievance.id
        ai_analysis["status"] = new_grievance.status

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

@router.get("/grievances")
async def get_grievances(current_user: Optional[dict] = Depends(get_optional_user_token), db: Session = Depends(get_db)):
    if current_user and current_user.get("role") == "department":
        dept_name = current_user.get("department")
        grievances = db.query(Grievance).filter(Grievance.department == dept_name).all()
    else:
        grievances = db.query(Grievance).all()
        
    return [
        {
            "id": g.id,
            "original_text": g.original_text,
            "translated_text": g.translated_text,
            "visual_issue": g.visual_issue,
            "image_description": g.image_description,
            "department": g.department,
            "severity": g.severity,
            "latitude": g.latitude,
            "longitude": g.longitude,
            "image_path": g.image_path,
            "is_duplicate": g.is_duplicate,
            "parent_id": g.parent_id,
            "status": g.status
        }
        for g in grievances
    ]
