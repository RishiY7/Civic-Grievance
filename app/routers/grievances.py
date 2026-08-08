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
from ..schemas import GrievanceAnalysis, DirectiveCreate
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
            "proof_image_path": g.proof_image_path,
            "is_duplicate": g.is_duplicate,
            "parent_id": g.parent_id,
            "status": g.status
        }
        for g in grievances
    ]

@router.patch("/grievances/{grievance_id}/status")
@router.post("/grievances/{grievance_id}/status")
async def update_grievance_status(
    grievance_id: int,
    status: str = Form(...),
    proof_file: Optional[UploadFile] = File(None),
    current_user: Optional[dict] = Depends(get_optional_user_token),
    db: Session = Depends(get_db)
):
    if not current_user or current_user.get("role") not in ["admin", "department"]:
        raise HTTPException(status_code=403, detail="Not authorized to change status")

    grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    
    if grievance.status == "Resolved" and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Cannot change status of a resolved grievance")
    
    grievance.status = status
    
    if proof_file and proof_file.filename:
        unique_filename = f"proof_{uuid.uuid4()}_{proof_file.filename}"
        proof_path = f"static/uploads/{unique_filename}"
        os.makedirs("static/uploads", exist_ok=True)
        with open(proof_path, "wb") as buffer:
            shutil.copyfileobj(proof_file.file, buffer)
        grievance.proof_image_path = f"/static/uploads/{unique_filename}"
        
    db.commit()
    db.refresh(grievance)
    
    return {
        "message": "Status updated successfully",
        "id": grievance.id,
        "status": grievance.status,
        "proof_image_path": grievance.proof_image_path
    }

@router.patch("/grievances/{grievance_id}/override-department")
@router.post("/grievances/{grievance_id}/override-department")
async def override_department(
    grievance_id: int,
    department: str = Form(...),
    current_user: Optional[dict] = Depends(get_optional_user_token),
    db: Session = Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can override department")

    grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    
    grievance.department = department
    db.commit()
    db.refresh(grievance)
    return {"message": "Department updated successfully", "id": grievance.id, "department": grievance.department}

@router.post("/grievances/run-sla-escalation")
async def run_sla_escalation(
    current_user: Optional[dict] = Depends(get_optional_user_token),
    db: Session = Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can trigger SLA check")

    from datetime import datetime, timedelta
    
    # Define SLA threshold (2 minutes for demo)
    threshold = datetime.utcnow() - timedelta(minutes=2)
    
    pending_issues = db.query(Grievance).filter(
        Grievance.status == "Pending",
        Grievance.created_at <= threshold
    ).all()
    
    escalated_count = 0
    severity_order = ["Low", "Medium", "High", "Critical"]
    
    for g in pending_issues:
        current_sev = g.severity or "Low"
        try:
            current_idx = severity_order.index(current_sev)
            if current_idx < len(severity_order) - 1:
                g.severity = severity_order[current_idx + 1]
                escalated_count += 1
        except ValueError:
            g.severity = "Medium"
            escalated_count += 1
            
    db.commit()
    
    return {"message": f"SLA Check complete. Escalated {escalated_count} issues.", "escalated_count": escalated_count}

@router.post("/directives")
def create_directive(
    directive: DirectiveCreate,
    current_user: Optional[dict] = Depends(get_optional_user_token),
    db: Session = Depends(get_db)
):
    dept = directive.department
    if current_user and current_user.get("role") == "department" and current_user.get("department"):
        dept = current_user.get("department")

    db_grievance = Grievance(
        original_text=f"[DIRECTIVE] {directive.title}: {directive.description}",
        translated_text=f"[DIRECTIVE] {directive.title}: {directive.description}",
        visual_issue=f"⚡ Directive: {directive.title}",
        image_description="Official directive issued by administration",
        department=dept,
        severity=directive.severity,
        latitude=directive.latitude,
        longitude=directive.longitude,
        status="Pending",
        is_duplicate=False
    )
    db.add(db_grievance)
    db.commit()
    db.refresh(db_grievance)
    return {
        "id": db_grievance.id,
        "title": directive.title,
        "department": db_grievance.department,
        "severity": db_grievance.severity,
        "status": db_grievance.status,
        "original_text": db_grievance.original_text,
        "translated_text": db_grievance.translated_text,
        "visual_issue": db_grievance.visual_issue,
        "image_description": db_grievance.image_description,
        "latitude": db_grievance.latitude,
        "longitude": db_grievance.longitude,
        "is_duplicate": False
    }

@router.post("/grievances/{grievance_id}/citizen-feedback")
async def citizen_feedback(
    grievance_id: int,
    action: str = Form(...),
    current_user: Optional[dict] = Depends(get_optional_user_token),
    db: Session = Depends(get_db)
):
    if not current_user or current_user.get("role") != "citizen":
        raise HTTPException(status_code=403, detail="Only citizens can provide feedback")

    grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    if grievance.status != "Resolved":
        raise HTTPException(status_code=400, detail="Grievance must be Resolved to provide feedback")
        
    if action == "verify":
        grievance.status = "Closed" # Final locked state
    elif action == "reopen":
        grievance.status = "In-Progress" # Send it back to the department
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'verify' or 'reopen'.")
        
    db.commit()
    db.refresh(grievance)
    
    return {"message": f"Issue {action}ed successfully", "status": grievance.status}
