# -*- coding: utf-8 -*-
"""Invoca el CLI de RenderCV para generar artefactos (PDF/PNG/HTML/MD)."""
import os, subprocess, pathlib

ART_DIR = os.getenv("PIXELCV_STORAGE", "./backend/app/static/artefactos")

def render_cv(yaml_text: str, cv_id: str, formats=("pdf", "png")) -> dict:
    base_dir = pathlib.Path(ART_DIR) / cv_id
    base_dir.mkdir(parents=True, exist_ok=True)
    yaml_path = base_dir / "CV.yaml"
    yaml_path.write_text(yaml_text, encoding="utf-8")

    args = ["rendercv", "render", str(yaml_path)]
    if "pdf" in formats:
        args += ["--pdf-path", str(base_dir / "CV.pdf")]
    if "png" in formats:
        args += ["--png-path", str(base_dir / "png")]
    if "html" in formats:
        args += ["--html-path", str(base_dir / "CV.html")]
    if "md" in formats:
        args += ["--markdown-path", str(base_dir / "CV.md")]

    # Ejecutar CLI de RenderCV (requiere rendercv[full] instalado en el entorno)
    proc = subprocess.run(args, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Error al renderizar: {proc.stderr}")

    return {
        "pdf": str(base_dir / "CV.pdf") if "pdf" in formats else None,
        "png": str(base_dir / "png") if "png" in formats else None,
        "html": str(base_dir / "CV.html") if "html" in formats else None,
        "md": str(base_dir / "CV.md") if "md" in formats else None,
    }
