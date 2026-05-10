# Civic Grievance Triage System

## Overview

The **Civic Grievance Triage System** is an AI-powered platform designed to streamline the reporting and routing of civic issues (e.g., potholes, broken streetlights, water leaks). Citizens can seamlessly report issues by uploading an image and providing an optional text or voice description in multiple languages (such as English, Hindi, or Kannada).

The system leverages the multimodal capabilities of the **Google Gemini 2.5 Flash API** to:
1. Translate and transcribe regional audio/text descriptions into English.
2. Visually identify the core issue from the uploaded image.
3. Assess the severity of the problem (Low, Medium, High, Critical).
4. Automatically route the grievance to the appropriate civic department (Roads, Water, Sanitation, Electricity).

The reported grievances are then displayed on an interactive, color-coded map for easy tracking and resolution.

## Technologies Built With

- **Backend Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: PostgreSQL (via SQLAlchemy ORM)
- **AI Integration**: Google Gemini 2.5 Flash API (Multimodal Image & Audio Analysis)
- **Frontend & Mapping**: HTML5, Tailwind CSS, [Leaflet.js](https://leafletjs.com/)
- **ASGI Server**: Uvicorn

## Setup and Installation Instructions

Follow these step-by-step instructions to get the application running locally.

### 1. Prerequisites
- Python 3.8 or higher installed on your machine.
- A running PostgreSQL database instance.
- A Google Gemini API Key.

### 2. Configure Environment Variables
Create a new file named `.env` in the root of the project directory and configure your database and API credentials:

```env
# PostgreSQL Database Connection String
# Format: postgresql://username:password@host:port/database_name
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/civic_db

# Google Gemini API Key
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies
It is highly recommended to use a Python virtual environment to manage your dependencies.

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install the required Python packages
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-multipart google-genai python-dotenv
```

### 4. Run the Uvicorn Server
Once your environment variables are set and dependencies are installed, you can launch the FastAPI server using Uvicorn:

```bash
uvicorn main:app --reload
```
*(The `--reload` flag is used for development purposes so the server automatically restarts when code changes are detected.)*

### 5. Access the Application
Open your web browser (like Google Chrome) and navigate to:
**http://127.0.0.1:8000**

You will see the interactive Leaflet map and the grievance reporting form. You can now start testing the multimodal AI triage system!
