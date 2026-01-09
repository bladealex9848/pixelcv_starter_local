"use client";

import { useMemo } from 'react';

interface PixelArtSpriteProps {
  sprite: {
    pixels: string[];
    width: number;
    height: number;
  };
  size?: number; // Tamaño en píxeles (por defecto 32)
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente para renderizar un sprite de pixel art (32x32 grid)
 * Similar al renderizado en el editor de pixel art
 */
export default function PixelArtSprite({
  sprite,
  size = 32,
  className = '',
  style = {}
}: PixelArtSpriteProps) {
  const { pixels, width, height } = sprite;

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${width}, 1fr)`,
    gridTemplateRows: `repeat(${height}, 1fr)`,
    width: `${size}px`,
    height: `${size}px`,
    gap: '0px',
    imageRendering: 'pixelated' as const, // Para que se vea nítido
    ...style
  }), [sprite, size, style]);

  return (
    <div className={className} style={gridStyle}>
      {pixels.map((color, index) => {
        // No renderizar píxeles transparentes
        if (color === '#00000000' || color === 'transparent') {
          return (
            <div
              key={index}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
              }}
            />
          );
        }

        return (
          <div
            key={index}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: color,
              border: '0.1px solid rgba(0, 0, 0, 0.1)',
            }}
          />
        );
      })}
    </div>
  );
}
