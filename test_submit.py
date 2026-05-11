import requests

url = "http://127.0.0.1:8000/submit-grievance"

image_path = "static/uploads/1ab3796c-7110-4092-b3c3-87288202c850_AdobeStock_201419293.webp"

with open(image_path, "rb") as f:
    files = {
        'file': ('test.webp', f, 'image/webp')
    }
    data = {
        'text': 'There is a pothole here',
        'lat': 12.34,
        'lng': 56.78
    }

    try:
        response = requests.post(url, files=files, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
