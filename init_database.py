#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script para inicializar/actualizar la base de datos de PixelCV

Este script crea todas las tablas necesarias, incluyendo las nuevas para el sistema de juegos.

Uso:
    python3 init_database.py
"""

import os
import sys

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.models.database import init_db

def main():
    """Inicializa la base de datos"""
    print("🔄 Inicializando base de datos de PixelCV...")
    print("=" * 60)

    try:
        # Inicializar todas las tablas
        init_db()
        print("✅ Base de datos inicializada correctamente")
        print("=" * 60)
        print("\n📋 Tablas creadas/actualizadas:")
        print("  - users")
        print("  - user_profiles")
        print("  - cvs")
        print("  - point_history")
        print("  - visits")
        print("  - comments")
        print("  - likes")
        print("  - game_sessions ⭐ (NUEVA)")
        print("  - game_ai_parameters ⭐ (NUEVA)")
        print("  - game_training_data ⭐ (NUEVA)")
        print("  - ai_parameter_history ⭐ (NUEVA)")
        print("\n🎮 Sistema de juegos listo!")
        print("\n💡 Tip: Reinicia el servidor backend para aplicar los cambios")
        return 0

    except Exception as e:
        print(f"\n❌ Error inicializando la base de datos:")
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
