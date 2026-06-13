import os
from openai import OpenAI
from google import genai
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv(override=True)

nvidia_api_key = os.getenv("NVIDIA_API_KEY")
nvidia_client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=nvidia_api_key
) if nvidia_api_key else None

gemini_keys_str = os.getenv("GEMINI_API_KEYS", "")
gemini_keys = [k.strip() for k in gemini_keys_str.split(",") if k.strip()]

if not gemini_keys:
    print("Warning: GEMINI_API_KEYS environment variable is not set. API calls will fail.")

def call_gemini_with_fallback(parts, config=None):
    models_to_try = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview', 'gemini-1.5-flash']
    last_error = None
    for key in gemini_keys:
        for model_name in models_to_try:
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=parts,
                    config=config
                )
                return response
            except Exception as e:
                print(f"Warning: Model {model_name} with API Key ending in ...{key[-4:]} failed. Error: {e}")
                last_error = e
                continue
            
    raise HTTPException(status_code=500, detail=f"All Gemini API keys and models failed. Last error: {last_error}")

def translate_with_sarvam(text: str) -> str:
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
        content = completion.choices[0].message.content.strip()
        if "</think>" in content:
            content = content.split("</think>")[-1].strip()
        return content
    except Exception as e:
        print(f"Sarvam translation failed, falling back to original text. Error: {e}")
        return text
