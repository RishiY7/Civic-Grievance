# Civic Grievance Triage System - Complete Project Information

This document contains a comprehensive breakdown of the "Civic Grievance Triage System" to aid AI systems and researchers in understanding its architecture, methodology, implementation details, and workflow. It is specifically structured to provide all relevant responses and information for an IEEE implementation paper.

## 1. Project Overview
The **Civic Grievance Triage System** is an AI-powered platform designed to streamline the reporting, translation, severity assessment, and departmental routing of civic issues (e.g., potholes, broken streetlights, water leaks, garbage accumulation). It empowers citizens to report issues via an intuitive web interface by uploading images and providing text or voice descriptions in multiple languages.

## 2. Problem Statement
Traditional civic issue reporting mechanisms are often manual, slow, language-restricted, and lack automated prioritization. Citizens face language barriers when describing issues, and civic authorities spend significant time manually routing complaints to the correct departments and assessing their severity. Furthermore, duplicate reports of the same issue waste resources. This system solves these problems by utilizing a multi-model AI pipeline to automate the triage process.

## 3. Technology Stack & Architecture
The system adopts a client-server architecture with a clear separation of concerns, heavily integrated with external AI APIs and local machine learning models.

### 3.1 Backend (Server-Side)
- **Framework:** FastAPI (Python) - Chosen for its high performance, asynchronous capabilities, and automatic API documentation.
- **Database:** PostgreSQL with SQLAlchemy ORM - For robust relational data storage.
- **Server:** Uvicorn (ASGI server).

### 3.2 Frontend (Client-Side)
- **Framework:** React.js (Bootstrapped with Vite for fast builds).
- **Styling:** Tailwind CSS - For responsive and modern UI design.
- **Mapping:** React Leaflet - To plot grievances geographically on an interactive map.

### 3.3 AI Models & Integration
- **Computer Vision (Object Detection):** Custom YOLOv8 model (`civic_model.pt`) trained specifically to detect civic issues from images (e.g., garbage, potholes, streetlights, water leaks, water logs, wires).
- **Natural Language Processing (Translation):** Sarvam AI via NVIDIA API (`sarvamai/sarvam-m`). It accurately translates regional text and voice descriptions into English to standardize the input for downstream processing.
- **Multimodal Analysis & Reasoning:** Google Gemini API (supporting `gemini-2.5-flash`, `gemini-1.5-flash`, etc.). It acts as the core decision engine, analyzing the image, YOLO findings, and translated text to assess severity, generate image descriptions, and route the issue to the correct department.

## 4. Methodology & Workflow
The core implementation workflow involves several sequential and parallel steps:

1. **Data Acquisition:** The citizen uploads an image and provides an optional text or audio description, along with their current GPS coordinates (latitude, longitude).
2. **Visual Processing (YOLOv8):** The uploaded image is passed through the local YOLOv8 model. The model identifies bounding boxes and classes of civic issues present in the image.
3. **Linguistic Processing (Sarvam AI):** If text or audio is provided in a regional language, it is routed to the Sarvam AI model which translates the content into English.
4. **Multimodal Synthesis (Google Gemini):** A carefully crafted prompt is sent to Google Gemini. The prompt includes:
   - The original image.
   - The classes detected by the YOLO model.
   - The translated text description (or audio transcription).
   Gemini is tasked with determining the severity (Low, Medium, High, Critical) and mapping the issue to exactly one department (Roads, Water, Sanitation, Electricity).
5. **Duplicate Detection Algorithm:** Before saving, the backend queries the database for existing unresolved tickets assigned to the same department. It calculates the Haversine distance between the new report and existing reports. If an issue is within a 50-meter radius of an existing issue, it is automatically flagged as a duplicate and linked to a `parent_id`.
6. **Data Persistence:** The processed grievance, along with its metadata and AI analysis, is stored in the PostgreSQL database.
7. **Visualization:** The React frontend fetches the updated list of grievances and renders them as interactive pins on the Leaflet map.

## 5. Key Modules
- **Authentication Module (`auth.py`):** Handles user registration, login, role management (citizen, department_official, admin), and JWT token generation.
- **Grievance Module (`grievances.py`):** The core router that handles the `/submit-grievance` endpoint, orchestrating the entire AI pipeline and duplicate detection logic.
- **AI Utility Module (`ai_utils.py`):** Manages API connections with fallback mechanisms for Google Gemini and handles the Sarvam AI translation API requests.
- **Chatbot Module (`chat.py`):** (Inferred from routing) Likely provides an interactive AI assistant for users to query ticket status or get help.

## 6. Real-World Applications & IEEE Paper Relevance
For an IEEE implementation paper, this project demonstrates:
- **Smart City Infrastructure:** Applying AI to improve urban management and civic responsiveness.
- **Multimodal AI Integration:** Successfully combining specialized local models (YOLO) with generalized LLMs (Gemini) and NLP models (Sarvam) to solve a complex real-world problem.
- **Geospatial Data Processing:** Utilizing GPS coordinates and Haversine algorithms for automated deduplication of physical world events.
- **Accessibility:** Breaking down language barriers in civic reporting through automated regional language translation.

## 7. Setup & Execution Summary
The system can be launched locally using the `start.py` script, which concurrently starts the Uvicorn backend server on port 8000 and the Vite frontend server on port 5173. Environment variables (API keys, DB credentials) must be configured in a `.env` file prior to execution.
