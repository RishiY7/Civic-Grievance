import json
import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from gtts import gTTS
from google.genai import types

from ..schemas import ChatRequest, TranslateRequest, TTSRequest
from ..ai_utils import call_gemini_with_fallback

router = APIRouter(prefix="/api", tags=["chat"])

translation_cache = {}

@router.post("/tts")
async def generate_tts(request: TTSRequest):
    try:
        text_to_speak = request.text
        if " / " in text_to_speak:
            parts = text_to_speak.split(" / ")
            text_to_speak = parts[0].strip()

        tts = gTTS(text=text_to_speak, lang=request.lang)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        return StreamingResponse(mp3_fp, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate")
async def translate_texts(request: TranslateRequest):
    if not request.texts:
        return {"translated_texts": []}

    uncached_texts = []
    results_map = {}
    
    for text in request.texts:
        cache_key = f"{text}_{request.target_language}"
        if cache_key in translation_cache:
            results_map[text] = translation_cache[cache_key]
        else:
            uncached_texts.append(text)
    
    if not uncached_texts:
        return {"translated_texts": [results_map[t] for t in request.texts]}

    prompt = f"""For each of the following strings (extracted from a form), provide:
1. The English translation.
2. The Hindi translation (common, everyday spoken language).
3. The Kannada translation (common, everyday spoken language).

Input JSON array: {json.dumps(uncached_texts)}

Respond ONLY with a valid JSON array of objects, where each object has keys "english", "hindi", and "kannada". Do not include any explanations or markdown tags."""

    try:
        config = types.GenerateContentConfig(
            system_instruction="You are a professional multilingual translator. You MUST output ONLY a valid JSON array of objects. Never include any conversational text.",
            temperature=0.0
        )
        response = call_gemini_with_fallback([prompt], config)
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        translated_data = json.loads(response_text)
        
        for i, item in enumerate(translated_data):
            orig_composite = uncached_texts[i]
            eng = item.get("english", "")
            hi = item.get("hindi", "")
            kn = item.get("kannada", "")
            
            final_parts = []
            
            if request.target_language == "Hindi":
                final_parts.append(hi)
                if orig_composite.lower() != hi.lower():
                    final_parts.append(orig_composite)
            elif request.target_language == "Kannada":
                final_parts.append(kn)
                if orig_composite.lower() != kn.lower():
                    final_parts.append(orig_composite)
            else:
                final_parts.append(orig_composite)
            
            translated_str = " / ".join(final_parts)
            results_map[orig_composite] = translated_str
            translation_cache[f"{orig_composite}_{request.target_language}"] = translated_str

        return {"translated_texts": [results_map[t] for t in request.texts]}
    except Exception as e:
        print(f"Translation parsing error: {e}")
        return {"translated_texts": [results_map.get(t, t) for t in request.texts]}

@router.post("/chat")
async def chat_with_form(request: ChatRequest):
    system_prompt = f"""You are a helpful civic and municipal assistant for the Civic Grievance system.
Your goal is to guide the user on how to report issues, explain municipal policies, and provide civic guidance.

Platform Knowledge:
- This platform allows citizens to report issues like potholes, garbage, streetlights, and water leaks.
- To report an issue, tell the user to scroll up to the map on this dashboard, click "Get My Location", and submit a grievance form. They CANNOT submit a grievance directly through this chat.
- Our system automatically uses computer vision AI to analyze their uploaded grievance image, classify the severity (Low, Medium, High, Critical), and route it to the right department.
- The 4 active departments are: Roads, Water, Sanitation, and Electricity.

CRITICAL: You MUST respond ENTIRELY and EXCLUSIVELY in {request.language}. 
Do not use a single word of English if the language is Hindi or Kannada.
Use common, everyday spoken language that is easy for the general public to understand.
All your explanations, guidance, and answers must be written in {request.language}.
"""

    try:
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.5
        )
        response = call_gemini_with_fallback([request.question], config)

        answer_text = response.text.strip()
        return {"answer": answer_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}")
