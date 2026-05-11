from main import engine, SessionLocal, Grievance

def clean_database():
    db = SessionLocal()
    grievances = db.query(Grievance).all()
    count = 0
    for g in grievances:
        if g.translated_text and "</think>" in g.translated_text:
            cleaned_text = g.translated_text.split("</think>")[-1].strip()
            g.translated_text = cleaned_text
            count += 1
            
        # also clean up if the thought block is there but missing closing tag
        elif g.translated_text and "<think>" in g.translated_text:
             cleaned_text = g.translated_text.split("<think>")[0].strip()
             if not cleaned_text: # if think was at the beginning, we might need what's after if there's no closing tag, which is hard. Usually there is a closing tag.
                 pass # skip for now, but usually </think> is present.
                 
    db.commit()
    db.close()
    print(f"Cleaned {count} grievances.")

if __name__ == "__main__":
    clean_database()
