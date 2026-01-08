# -*- coding: utf-8 -*-
"""Servicio para generar imágenes Open Graph dinámicas de PixelArt."""
import io
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont

from sqlalchemy.orm import Session
from app.models.database import PixelArt


class PixelArtOGService:
    """Servicio para generar imágenes OG (1200x630px) de pixelart."""

    # Configuración de dimensiones OG
    OG_WIDTH = 1200
    OG_HEIGHT = 630

    # Paleta de colores para branding
    COLOR_TOP = "#14b8a6"  # Teal
    COLOR_BOTTOM = "#059669"  # Emerald
    COLOR_TEXT = "#ffffff"  # Blanco
    COLOR_TEXT_DIM = "rgba(255, 255, 255, 0.8)"  # Blanco con transparencia

    # Rutas de fuentes (Linux)
    FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
    FONT_BOLD = "DejaVuSans-Bold.ttf"
    FONT_REGULAR = "DejaVuSans.ttf"

    @staticmethod
    def _create_gradient_image(width: int, height: int) -> Image.Image:
        """
        Crea una imagen con gradiente vertical.

        Args:
            width: Ancho de la imagen
            height: Alto de la imagen

        Returns:
            Imagen PIL con gradiente
        """
        img = Image.new('RGB', (width, height), color=PixelArtOGService.COLOR_TOP)
        draw = ImageDraw.Draw(img)

        # Gradiente manual de COLOR_TOP a COLOR_BOTTOM
        r1, g1, b1 = Image.new('RGB', (1, 1), color=PixelArtOGService.COLOR_TOP).getpixel((0, 0))
        r2, g2, b2 = Image.new('RGB', (1, 1), color=PixelArtOGService.COLOR_BOTTOM).getpixel((0, 0))

        for y in range(height):
            ratio = y / height
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        return img

    @staticmethod
    def _get_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
        """
        Obtiene una fuente del sistema con el tamaño especificado.

        Args:
            size: Tamaño de la fuente
            bold: True para negrita, False para regular

        Returns:
            Objeto ImageFont
        """
        try:
            font_name = PixelArtOGService.FONT_BOLD if bold else PixelArtOGService.FONT_REGULAR
            font_path = f"{PixelArtOGService.FONT_DIR}{font_name}"
            return ImageFont.truetype(font_path, size)
        except Exception:
            # Fallback a fuente por defecto
            try:
                return ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", size)
            except Exception:
                return ImageFont.load_default()

    @staticmethod
    def _draw_pixelart_from_pixels(
        img: Image.Image,
        pixels: list[str],
        canvas_size: int = 400,
        grid_size: int = 32
    ) -> None:
        """
        Dibuja un pixelart en la imagen desde un array de píxeles.

        Args:
            img: Imagen PIL donde dibujar
            pixels: Array de 1024 colores hex (32x32)
            canvas_size: Tamaño del canvas para el pixelart (cuadrado)
            grid_size: Tamaño de la grilla (32x32)
        """
        draw = ImageDraw.Draw(img)

        # Calcular posición centrada
        x_offset = (PixelArtOGService.OG_WIDTH - canvas_size) // 2
        y_offset = 60  # Margen superior

        # Tamaño de cada píxel
        pixel_size = canvas_size // grid_size

        # Dibujar cada píxel
        for i, color in enumerate(pixels):
            if i >= len(pixels):
                break

            # Calcular posición en la grilla 32x32
            row = i // grid_size
            col = i % grid_size

            # Calcular posición en el canvas
            x = x_offset + (col * pixel_size)
            y = y_offset + (row * pixel_size)

            # Dibujar píxel (con efecto pixelado: sin suavizado)
            draw.rectangle(
                [x, y, x + pixel_size, y + pixel_size],
                fill=color,
                outline=color
            )

    @staticmethod
    def _create_pixelart_from_base64(base64_data: str, size: int = 400) -> Image.Image:
        """
        Crea una imagen PIL desde datos base64 (avatar).

        Args:
            base64_data: Datos base64 de la imagen
            size: Tamaño deseado

        Returns:
            Imagen PIL
        """
        import base64

        # Remover header data:image si existe
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]

        # Decodificar base64
        img_data = base64.b64decode(base64_data)
        img = Image.open(io.BytesIO(img_data))

        # Escalar sin suavizado (efecto pixelado)
        img = img.resize((size, size), resample=Image.NEAREST)

        return img

    @staticmethod
    def generate_og_image_from_pixelart(
        pixelart: PixelArt,
        base_url: str = "https://pixelcv.alexanderoviedofadul.dev"
    ) -> bytes:
        """
        Genera una imagen OG dinámica desde un objeto PixelArt.

        Args:
            pixelart: Objeto PixelArt de la base de datos
            base_url: URL base del sitio para referencias

        Returns:
            bytes: Imagen PNG en memoria
        """
        # Crear canvas base con gradiente
        img = PixelArtOGService._create_gradient_image(
            PixelArtOGService.OG_WIDTH,
            PixelArtOGService.OG_HEIGHT
        )
        draw = ImageDraw.Draw(img)

        # Extraer píxeles del pixelart
        pixels_dict = pixelart.pixels_json
        pixels = pixels_dict.get("pixels", [])

        if not pixels:
            # Fallback: pixelart sin datos
            pixels = ["#000000"] * 1024

        # Dibujar pixelart centrado
        PixelArtOGService._draw_pixelart_from_pixels(img, pixels, canvas_size=400, grid_size=32)

        # Añadir título
        title_font = PixelArtOGService._get_font(50, bold=True)
        title = pixelart.title or "PixelArt"

        # Centrar título horizontalmente
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (PixelArtOGService.OG_WIDTH - title_width) // 2
        title_y = 500  # Debajo del pixelart

        draw.text((title_x, title_y), title, fill=PixelArtOGService.COLOR_TEXT, font=title_font)

        # Añadir autor
        if pixelart.user:
            author_font = PixelArtOGService._get_font(35, bold=False)
            author_text = f"por {pixelart.user.username}"

            author_bbox = draw.textbbox((0, 0), author_text, font=author_font)
            author_width = author_bbox[2] - author_bbox[0]
            author_x = (PixelArtOGService.OG_WIDTH - author_width) // 2
            author_y = title_y + 60

            # Color con transparencia usando tupla RGBA
            draw.text((author_x, author_y), author_text, fill=(255, 255, 255, 180), font=author_font)

        # Añadir branding (PixelCV logo pequeño)
        branding_font = PixelArtOGService._get_font(25, bold=True)
        branding_text = "PixelCV"
        draw.text((20, PixelArtOGService.OG_HEIGHT - 40), branding_text, fill=(255, 255, 255, 150), font=branding_font)

        # Convertir a bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG', optimize=True)
        img_bytes.seek(0)

        return img_bytes.read()

    @staticmethod
    def generate_og_image_from_dict(
        pixelart_data: Dict[str, Any],
        base_url: str = "https://pixelcv.alexanderoviedofadul.dev"
    ) -> bytes:
        """
        Genera una imagen OG dinámica desde un diccionario de datos.

        Args:
            pixelart_data: Diccionario con datos del pixelart
                - id: str
                - title: str
                - author: str
                - pixels: { pixels: list[str] }
            base_url: URL base del sitio

        Returns:
            bytes: Imagen PNG en memoria
        """
        # Crear canvas base con gradiente
        img = PixelArtOGService._create_gradient_image(
            PixelArtOGService.OG_WIDTH,
            PixelArtOGService.OG_HEIGHT
        )
        draw = ImageDraw.Draw(img)

        # Extraer píxeles
        pixels_dict = pixelart_data.get("pixels", {})
        pixels = pixels_dict.get("pixels", [])

        if not pixels:
            # Fallback: crear un pixelart genérico
            pixels = ["#000000"] * 1024

        # Dibujar pixelart centrado
        PixelArtOGService._draw_pixelart_from_pixels(img, pixels, canvas_size=400, grid_size=32)

        # Añadir título
        title_font = PixelArtOGService._get_font(50, bold=True)
        title = pixelart_data.get("title", "PixelArt")

        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (PixelArtOGService.OG_WIDTH - title_width) // 2
        title_y = 500

        draw.text((title_x, title_y), title, fill=PixelArtOGService.COLOR_TEXT, font=title_font)

        # Añadir autor
        author = pixelart_data.get("author", "")
        if author:
            author_font = PixelArtOGService._get_font(35, bold=False)
            author_text = f"por {author}"

            author_bbox = draw.textbbox((0, 0), author_text, font=author_font)
            author_width = author_bbox[2] - author_bbox[0]
            author_x = (PixelArtOGService.OG_WIDTH - author_width) // 2
            author_y = title_y + 60

            draw.text((author_x, author_y), author_text, fill=(255, 255, 255, 180), font=author_font)

        # Añadir branding
        branding_font = PixelArtOGService._get_font(25, bold=True)
        draw.text((20, PixelArtOGService.OG_HEIGHT - 40), "PixelCV", fill=(255, 255, 255, 150), font=branding_font)

        # Convertir a bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG', optimize=True)
        img_bytes.seek(0)

        return img_bytes.read()

    @staticmethod
    def get_pixelart_og_from_db(db: Session, pixelart_id: str) -> Optional[bytes]:
        """
        Obtiene la imagen OG de un pixelart desde la base de datos.

        Args:
            db: Sesión de base de datos
            pixelart_id: ID del pixelart

        Returns:
            bytes: Imagen PNG o None si no existe
        """
        pixelart = db.query(PixelArt).filter_by(id=pixelart_id).first()

        if not pixelart:
            return None

        return PixelArtOGService.generate_og_image_from_pixelart(pixelart)
