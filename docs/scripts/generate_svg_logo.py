# Script para generar el logo vectorial PixelCV en formato SVG con estilo retrofuturista
import os

svg_content = """<svg width="400" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="retroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#a855f7;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#ec4899;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
    </defs>
    
    <style>
        .pixel { shape-rendering: crispEdges; }
        .text-pixel { fill: url(#retroGradient); filter: url(#glow); }
    </style>

    <!-- Fondo sutil para resaltar -->
    <rect width="400" height="120" fill="#0f172a" rx="10" ry="10" opacity="0.5"/>

    <!-- Representación de "PixelCV" en bloques tipo píxel -->
    <g class="text-pixel">
        <!-- P -->
        <rect x="20" y="30" width="10" height="50" />
        <rect x="30" y="30" width="20" height="10" />
        <rect x="50" y="40" width="10" height="20" />
        <rect x="30" y="50" width="20" height="10" />
        
        <!-- i -->
        <rect x="70" y="30" width="10" height="10" />
        <rect x="70" y="50" width="10" height="30" />
        
        <!-- x -->
        <rect x="90" y="50" width="10" height="10" />
        <rect x="110" y="50" width="10" height="10" />
        <rect x="100" y="60" width="10" height="10" />
        <rect x="90" y="70" width="10" height="10" />
        <rect x="110" y="70" width="10" height="10" />
        
        <!-- e -->
        <rect x="130" y="50" width="20" height="10" />
        <rect x="130" y="60" width="10" height="10" />
        <rect x="130" y="70" width="20" height="10" />
        <rect x="150" y="50" width="10" height="20" />
        <rect x="140" y="60" width="10" height="10" />
        
        <!-- l -->
        <rect x="170" y="30" width="10" height="50" />
        
        <!-- C -->
        <rect x="200" y="30" width="30" height="10" />
        <rect x="200" y="40" width="10" height="30" />
        <rect x="200" y="70" width="30" height="10" />
        
        <!-- V -->
        <rect x="240" y="30" width="10" height="40" />
        <rect x="270" y="30" width="10" height="40" />
        <rect x="250" y="70" width="20" height="10" />
    </g>
    
    <!-- Decoración Retrofuturista -->
    <rect x="300" y="20" width="5" height="5" fill="#06b6d4" />
    <rect x="320" y="40" width="8" height="8" fill="#ec4899" />
    <rect x="20" y="90" width="360" height="2" fill="url(#retroGradient)" opacity="0.3"/>
</svg>
"""

output_path = os.path.join(os.path.dirname(__file__), "../../assets/pixelcv-logo.svg")
with open(output_path, "w") as f:
    f.write(svg_content)
print(f"Logo SVG generado en: {output_path}")
