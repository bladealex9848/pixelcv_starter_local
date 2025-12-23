# -*- coding: utf-8 -*-
"""Construcción y validación de YAML para RenderCV.
Usa JSON Schema de RenderCV si está disponible.
"""
import os, json, yaml
from jsonschema import validate

SCHEMA_PATH = os.getenv("PIXELCV_SCHEMA_PATH", "backend/assets/schema.json")

def _load_schema():
    if os.path.exists(SCHEMA_PATH):
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            try:
                # schema.json es JSON, no YAML
                return json.load(f)
            except Exception:
                return None
    return None

RENDERCV_SCHEMA = _load_schema()

def build_yaml(payload: dict) -> str:
    cv_yaml = {
        "cv": {
            "name": payload.get("name", ""),
            "headline": payload.get("headline", ""),
            "location": payload.get("location", ""),
            "email": payload.get("email", ""),
            "phone": payload.get("phone", ""),
            "website": payload.get("website", ""),
            "social_networks": payload.get("social_networks", []),
            "sections": payload.get("sections", {}),
        },
        "design": {"theme": payload.get("theme", "classic")},
        "locale": {"language": payload.get("locale", "spanish")},
        "settings": {"current_date": payload.get("current_date")},
    }
    # Validación si el schema está disponible
    if RENDERCV_SCHEMA:
        validate(instance=cv_yaml, schema=RENDERCV_SCHEMA)
    return yaml.safe_dump(cv_yaml, sort_keys=False, allow_unicode=True)
