# -*- coding: utf-8 -*-
"""Construccion y validacion de YAML para RenderCV."""
import yaml

def build_yaml(payload: dict) -> str:
    """Construye YAML compatible con RenderCV v2.5"""

    # Procesar secciones
    sections = {}
    raw_sections = payload.get("sections", {})

    # Mapear experiencia
    if "experiencia" in raw_sections:
        experience_list = []
        for exp in raw_sections["experiencia"]:
            entry = {
                "company": exp.get("company", ""),
                "position": exp.get("position", ""),
                "start_date": exp.get("start_date", ""),
                "end_date": exp.get("end_date", "present"),
            }
            if exp.get("location"):
                entry["location"] = exp["location"]
            if exp.get("highlights"):
                entry["highlights"] = [h for h in exp["highlights"] if h.strip()]
            experience_list.append(entry)
        if experience_list:
            sections["experience"] = experience_list

    # Mapear educacion
    if "educacion" in raw_sections:
        education_list = []
        for edu in raw_sections["educacion"]:
            entry = {
                "institution": edu.get("institution", ""),
                "area": edu.get("degree", ""),
                "start_date": edu.get("start_date", ""),
                "end_date": edu.get("end_date", "present"),
            }
            if edu.get("location"):
                entry["location"] = edu["location"]
            education_list.append(entry)
        if education_list:
            sections["education"] = education_list

    # Mapear habilidades
    if "skills" in raw_sections and raw_sections["skills"]:
        skills = raw_sections["skills"]
        if isinstance(skills, list):
            sections["skills"] = [{"label": "Technical Skills", "details": ", ".join(skills)}]

    # Construir estructura YAML
    cv_data = {
        "cv": {
            "name": payload.get("name", ""),
        }
    }

    # Agregar campos opcionales solo si tienen valor
    if payload.get("location"):
        cv_data["cv"]["location"] = payload["location"]
    if payload.get("email"):
        cv_data["cv"]["email"] = payload["email"]
    if payload.get("phone"):
        cv_data["cv"]["phone"] = payload["phone"]
    if payload.get("summary"):
        cv_data["cv"]["summary"] = payload["summary"]
    if payload.get("linkedin"):
        cv_data["cv"]["social_networks"] = [{"network": "LinkedIn", "username": payload["linkedin"].split("/")[-1] or payload["linkedin"]}]

    # Agregar secciones
    if sections:
        cv_data["cv"]["sections"] = sections

    # Configuracion de diseno
    cv_data["design"] = {"theme": payload.get("theme", "classic")}

    return yaml.safe_dump(cv_data, sort_keys=False, allow_unicode=True, default_flow_style=False)
