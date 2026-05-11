import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(override=True)
url = os.getenv("DATABASE_URL")

if not url:
    print("DATABASE_URL is not set in .env")
else:
    # Mask password for safe printing
    import urllib.parse
    parsed = urllib.parse.urlparse(url)
    masked_url = url.replace(parsed.password, "***") if parsed.password else url
    print(f"DATABASE_URL found: {masked_url}")
    
    print("Testing connection...")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"Connection SUCCESS!")
            print(f"PostgreSQL Version: {version}")
            
            # Check if grievances table exists
            table_check = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'grievances');"))
            has_table = table_check.scalar()
            print(f"Grievances table exists: {has_table}")
            
    except Exception as e:
        print(f"Connection FAILED! Error: {e}")
