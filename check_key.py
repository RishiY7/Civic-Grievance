import os
from dotenv import load_dotenv

load_dotenv(override=True)
key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')

if not key:
    print("No key found in .env")
else:
    print(f"Key length: {len(key)}")
    print(f"Starts with AIza: {key.startswith('AIza')}")
    
    # Check for quotes
    has_quotes = chr(34) in key or chr(39) in key
    print(f"Has quotes: {has_quotes}")
    
    # Try an API call to verify it works
    try:
        from google import genai
        # Clean the key to test if cleaning fixes it
        clean_key = key.replace(chr(34), '').replace(chr(39), '').strip()
        client = genai.Client(api_key=clean_key)
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents='Hi'
        )
        print("API Call Successful!")
    except Exception as e:
        print(f"API Call Failed: {e}")
