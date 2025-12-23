# -*- coding: utf-8 -*-
"""Invoca el CLI de RenderCV para generar artefactos (PDF/PNG/HTML/MD)."""
import os, subprocess, pathlib, shutil

ART_DIR = os.getenv("PIXELCV_STORAGE", "./backend/app/static/artefactos")

def render_cv(yaml_text: str, cv_id: str, formats=("pdf",)) -> dict:
    # Usar path absoluto
    base_dir = pathlib.Path(ART_DIR).resolve() / cv_id
    base_dir.mkdir(parents=True, exist_ok=True)
    yaml_path = base_dir / "CV.yaml"
    yaml_path.write_text(yaml_text, encoding="utf-8")

    # Construir argumentos para RenderCV con path absoluto
    args = ["rendercv", "render", str(yaml_path.resolve()), "--quiet"]

    # Desactivar formatos no solicitados
    if "md" not in formats:
        args.append("--dont-generate-markdown")
    if "html" not in formats:
        args.append("--dont-generate-html")
    if "png" not in formats:
        args.append("--dont-generate-png")
    if "pdf" not in formats:
        args.append("--dont-generate-pdf")

    # Ejecutar CLI de RenderCV
    proc = subprocess.run(args, capture_output=True, text=True, cwd=str(base_dir))
    if proc.returncode != 0:
        error_msg = proc.stderr or proc.stdout or "Error desconocido"
        raise RuntimeError(f"Error al renderizar: {error_msg}")

    # RenderCV genera archivos en rendercv_output/, moverlos a base_dir
    output_dir = base_dir / "rendercv_output"
    result = {"pdf": None, "png": None, "html": None, "md": None}

    if output_dir.exists():
        # Buscar y mover archivos generados
        for f in output_dir.iterdir():
            if f.suffix == ".pdf" and "pdf" in formats:
                dest = base_dir / "CV.pdf"
                shutil.move(str(f), str(dest))
                result["pdf"] = str(dest)
            elif f.suffix == ".png" and "png" in formats:
                dest = base_dir / f.name
                shutil.move(str(f), str(dest))
                result["png"] = str(dest)
            elif f.suffix == ".html" and "html" in formats:
                dest = base_dir / "CV.html"
                shutil.move(str(f), str(dest))
                result["html"] = str(dest)
            elif f.suffix == ".md" and "md" in formats:
                dest = base_dir / "CV.md"
                shutil.move(str(f), str(dest))
                result["md"] = str(dest)

        # Limpiar directorio temporal
        shutil.rmtree(str(output_dir), ignore_errors=True)

    return result
