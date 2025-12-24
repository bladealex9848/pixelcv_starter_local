import os
import sys

# Agregar el directorio actual al path para poder importar módulos
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.app.services.ollama_service import improve_bullets

# La frase a probar
bullet = "Gane el primer concurso de la Rama Judicial - JusticiaLAB 2024"
bullets = [bullet]

print(f"--- Probando con: '{bullet}' ---")
print("Enviando a Ollama (backend/app/services/ollama_service.py)...")

# Llamada directa a la función
try:
    improved = improve_bullets(model="phi3.5:latest", bullets=bullets)
    
    print("\n--- Resultado ---")
    if improved:
        for i, res in enumerate(improved):
            print(f"Original: {bullet}")
            print(f"Mejorado: {res}")
            
        if improved[0] == bullet:
            print("\nCONCLUSIÓN: La IA devolvió exactamente lo mismo.")
        else:
            print("\nCONCLUSIÓN: La IA SÍ propuso cambios.")
    else:
        print("La función devolvió una lista vacía.")

except Exception as e:
    print(f"\nERROR: {e}")
