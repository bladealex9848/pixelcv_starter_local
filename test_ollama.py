import requests
import json

url = "https://ollama.alexanderoviedofadul.dev/api/chat"
payload = {
    "model": "phi3.5:latest",
    "messages": [
        {
            "role": "user",
            "content": "Hola, responde en español brevemente."
        }
    ],
    "stream": False
}

try:
    response = requests.post(url, json=payload, timeout=30)
    print("Status:", response.status_code)
    if response.status_code == 200:
        print("Response:", json.dumps(response.json(), indent=2))
    else:
        print("Error:", response.text)
except Exception as e:
    print("Error:", e)
