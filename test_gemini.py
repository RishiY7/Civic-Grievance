import os
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

load_dotenv(override=True)

class GrievanceAnalysis(BaseModel):
    translated_text: str = Field(description="The English translation/transcription of the user's description, or visual description if none provided")
    visual_issue: str = Field(description="What you see in the image (e.g., 'pothole', 'broken pipe')")
    severity: str = Field(description="'Low', 'Medium', 'High', or 'Critical'")
    department: str = Field(description="'Roads', 'Water', 'Sanitation', or 'Electricity'")

gemini_keys_str = os.getenv("GEMINI_API_KEYS", "")
gemini_keys = [k.strip() for k in gemini_keys_str.split(",") if k.strip()]

if not gemini_keys:
    key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if key:
        gemini_keys = [key.replace(chr(34), '').replace(chr(39), '').strip()]

print(f"Loaded {len(gemini_keys)} keys")

def test_fallback():
    models_to_try = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview', 'gemini-1.5-flash']
    last_error = None
    for key in gemini_keys:
        for model_name in models_to_try:
            print(f"Trying model {model_name} with key ending in {key[-4:]}...")
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(
                    model=model_name,
                    contents="Hi",
                    config=genai.types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=GrievanceAnalysis,
                    )
                )
                print(f"Success with {model_name}!")
                return
            except Exception as e:
                print(f"Failed: {e}")
                last_error = e
    print(f"All failed. Last error: {last_error}")

test_fallback()
