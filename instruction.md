
# Objective: Implement Geospatial Duplicate Detection & Module 4 Preparations

Please update my Civic Grievance project files to implement a Haversine-based duplicate detection system, unify the database schema for the citizen feedback loop (email tracking), and update the frontend UI.

Apply the following exact changes:

## 1. Update `main.py` Imports
At the top of `main.py`, add the `math` library functions for the Haversine calculation, and ensure `Boolean` is imported from `sqlalchemy`.

**Find this:**
```python
import os
import json
import shutil
import uuid
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
Change to:

Python
import os
import json
import shutil
import uuid
from math import radians, cos, sin, asin, sqrt
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
Find this:

Python
from sqlalchemy import create_engine, Column, Integer, String, Float
Change to:

Python
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean
2. Unify the Database Model (main.py)
Replace the existing Grievance SQLAlchemy class with this updated version that includes the duplicate tracking columns, citizen email, status, and image description fields.

Python
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
    
    # Module additions
    image_description = Column(String, nullable=True) 
    citizen_email = Column(String, nullable=True) 
    status = Column(String, default="Open")
    
    # Duplicate Detection
    is_duplicate = Column(Boolean, default=False)
    parent_id = Column(Integer, nullable=True)
3. Add the Haversine Math Function (main.py)
Place this helper function immediately above the app = FastAPI(title="Civic Grievance API") initialization:

Python
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
4. Update the POST Route Signature (main.py)
Update the /submit-grievance function signature to accept the optional email field.

Replace the signature with this:

Python
@app.post("/submit-grievance")
async def submit_grievance(
    file: UploadFile = File(...),
    text: str = Form(default=""),
    email: Optional[str] = Form(default=None),
    audio: Optional[UploadFile] = File(default=None),
    lat: float = Form(...),
    lng: float = Form(...)
):
5. Implement Duplicate Detection and Save Logic (main.py)
Inside /submit-grievance, replace the section where the database connection is opened (db = SessionLocal()) down to the final return block with this:

Python
        # --- 6. DUPLICATE DETECTION & SAVE TO DATABASE ---
        db = SessionLocal()
        try:
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
                        break 
            
            # Step C: Save the new grievance
            new_grievance = Grievance(
                original_text=text,
                translated_text=ai_analysis.get("translated_text"),
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

        finally:
            db.close()
        
        return {
            "ai_analysis": ai_analysis,
            "coordinates": {
                "lat": lat,
                "lng": lng
            }
        }
6. Update Frontend UI for Email Input (static/index.html)
Inside static/index.html, locate the block for the text description (<label for="text"...).
Right ABOVE that block, inject the following HTML to collect the citizen's email address:

HTML
            <div class="mb-4">
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1" data-i18n="emailLabel">Email Address (For Status Updates)</label>
                <input type="email" id="email" name="email" class="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="name@example.com">
            </div>
Then, update the uiTranslations JavaScript object at the top of the <script> tag to include the new emailLabel key for each language:

JavaScript
        const uiTranslations = {
            'en': {
                // ... existing keys ...
                emailLabel: "Email Address (For Status Updates)"
            },
            'kn': {
                // ... existing keys ...
                emailLabel: "ಇಮೇಲ್ ವಿಳಾಸ (ಸ್ಥಿತಿ ನವೀಕರಣಗಳಿಗಾಗಿ)"
            },
            'hi': {
                // ... existing keys ...
                emailLabel: "ईमेल पता (स्थिति अपडेट के लिए)"
            }
        };