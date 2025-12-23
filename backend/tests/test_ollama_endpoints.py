# -*- coding: utf-8 -*-
"""Tests para endpoints de Ollama"""
import pytest
import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_models():
    """Test para listar modelos disponibles"""
    response = client.get("/ollama/models")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data or "error" in data
    
    if "models" in data:
        assert isinstance(data["models"], list)

def test_improve_bullets_success():
    """Test para mejorar bullets correctamente"""
    payload = {
        "model": "phi3.5:latest",
        "bullets": ["Trabajé en un proyecto"]
    }
    
    response = client.post("/ollama/improve-bullets", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "improved_bullets" in data
    assert len(data["improved_bullets"]) == 1
    assert data["improved_bullets"][0] != payload["bullets"][0]

def test_improve_bullets_empty():
    """Test con lista vacía de bullets"""
    payload = {
        "model": "phi3.5:latest",
        "bullets": []
    }
    
    response = client.post("/ollama/improve-bullets", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "improved_bullets" in data
    assert len(data["improved_bullets"]) == 0

def test_improve_bullets_multiple():
    """Test mejorando múltiples bullets"""
    payload = {
        "model": "phi3.5:latest",
        "bullets": [
            "Lideré un equipo",
            "Desarrollé software",
            "Optimicé procesos"
        ]
    }
    
    response = client.post("/ollama/improve-bullets", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "improved_bullets" in data
    assert len(data["improved_bullets"]) == 3

def test_improve_bullets_invalid_payload():
    """Test con payload inválido"""
    payload = {
        "model": "phi3.5:latest"
        # Falta bullets
    }
    
    response = client.post("/ollama/improve-bullets", json=payload)
    assert response.status_code == 422

def test_test_endpoint():
    """Test del endpoint de prueba de Ollama"""
    response = client.get("/ollama/test")
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data or "error" in data

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
