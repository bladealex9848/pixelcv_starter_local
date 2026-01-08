'use client';

import React, { useState } from 'react';

interface PixelArtVariant {
  pixels: string[];
  provider: string;
  source?: string;
  index: number;
  prompt_used: string;
  validation?: {
    is_valid: boolean;
    confidence: number;
    metrics: {
      colored_pixels: number;
      colored_percentage: number;
      unique_colors: number;
      balance: number;
      complexity: number;
    };
  };
}

interface PixelartVariantSelectorProps {
  variants: PixelArtVariant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export default function PixelartVariantSelector({
  variants,
  selectedIndex,
  onSelect,
  onClose
}: PixelartVariantSelectorProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!variants || variants.length === 0) {
    return null;
  }

  const getColorClass = (provider: string) => {
    return provider === 'pixellab'
      ? 'bg-blue-100 border-blue-300 hover:bg-blue-200'
      : 'bg-gray-100 border-gray-300 hover:bg-gray-200';
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Selecciona una variante
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {variants.length} variantes generadas. Haz clic en una para seleccionarla.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Variantes Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {variants.map((variant, index) => {
              const isSelected = index === selectedIndex;
              const isHovered = hoveredIndex === index;

              return (
                <button
                  key={index}
                  onClick={() => onSelect(index)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`
                    relative border-2 rounded-lg p-4 transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : getColorClass(variant.provider)
                    }
                    ${isHovered && !isSelected ? 'scale-105' : ''}
                  `}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Seleccionada
                    </div>
                  )}

                  {/* Pixel Art Preview */}
                  <div className="mb-3 flex justify-center">
                    <div className="relative" style={{ width: 128, height: 128 }}>
                      <svg
                        width="128"
                        height="128"
                        viewBox="0 0 32 32"
                        className="w-full h-full"
                        style={{ imageRendering: 'pixelated' }}
                      >
                        {variant.pixels.map((color, i) => {
                          const x = i % 32;
                          const y = Math.floor(i / 32);
                          return (
                            <rect
                              key={i}
                              x={x}
                              y={y}
                              width="1"
                              height="1"
                              fill={color}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-left space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        Variante #{index + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white border">
                        {variant.provider}
                      </span>
                    </div>

                    {/* Validation Metrics */}
                    {variant.validation && (
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Confianza:</span>
                          <span className={`font-medium ${getConfidenceColor(variant.validation.confidence)}`}>
                            {(variant.validation.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Colores:</span>
                          <span className="font-medium text-gray-700">
                            {variant.validation.metrics.unique_colors}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Coloreado:</span>
                          <span className="font-medium text-gray-700">
                            {variant.validation.metrics.colored_percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Prompt Used */}
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 truncate" title={variant.prompt_used}>
                        "{variant.prompt_used}"
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Confirmar selección
          </button>
        </div>
      </div>
    </div>
  );
}
