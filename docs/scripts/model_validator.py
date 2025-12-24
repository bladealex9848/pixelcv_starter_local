import time
import json
import requests
import re

OLLAMA_URL = "https://ollama.alexanderoviedofadul.dev/api/chat"
MODELS = ["phi4-mini:latest", "gemma3:1b", "gemma3:270m", "qwen3:4b", "qwen3:1.7b", "qwen3:0.6b", "granite3.3:2b", "phi3.5:latest"]

TEST_CASE = {
    "text": "Trabajé como Desarrollador Senior en Google durante el año 2022.",
    "expected": {"empresa": "Google", "cargo": "Desarrollador Senior", "año": "2022"}
}

def calculate_metrics(predicted, expected):
    # Cálculo simplificado de métricas basado en coincidencia de campos
    tp = 0
    for key, value in expected.items():
        if key in predicted and str(predicted[key]).lower() == str(value).lower():
            tp += 1
    
    precision = tp / len(predicted) if len(predicted) > 0 else 0
    recall = tp / len(expected)
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    return precision, recall, f1

def validate_model(model):
    print(f"Validando {model}...")
    prompt = (
        "Extrae la información de la siguiente frase en formato JSON estricto. "
        "Campos: empresa, cargo, año. Frase: " + TEST_CASE["text"])
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "format": "json"
    }
    
    start = time.time()
    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=60)
        resp.raise_for_status()
        duration = time.time() - start
        content = resp.json().get("message", {}).get("content", "{}")
        
        # Limpiar respuesta (algunos modelos devuelven markdown)
        json_str = re.search(r'\{.*\}', content, re.DOTALL).group(0)
        predicted = json.loads(json_str)
        
        p, r, f1 = calculate_metrics(predicted, TEST_CASE["expected"])
        return {"status": "ok", "time": duration, "precision": p, "recall": r, "f1": f1, "raw": content}
    except Exception as e:
        return {"status": "error", "error": str(e)}

results = {}
for m in MODELS:
    results[m] = validate_model(m)

# Generar reporte Markdown
report = "# Informe de Validación de Modelos (Benchmark)\n\n"
report += "| Modelo | Tiempo (s) | Precisión | Recall | F1-Score | Estado |\n"
report += "| --- | --- | --- | --- | --- | --- |\n"

for m, r in results.items():
    if r["status"] == "ok":
        report += f"| {m} | {r['time']:.2f} | {r['precision']:.2f} | {r['recall']:.2f} | {r['f1']:.2f} | ✅ |\n"
    else:
        report += f"| {m} | - | - | - | - | ❌ {r['error'][:20]} |\n"

with open("docs/development/model_validation_report.md", "w") as f:
    f.write(report)

print("Reporte generado en docs/development/model_validation_report.md")
