"use client";
import { useState, useEffect } from 'react';

interface CVPreviewProps {
  yamlContent: string;
  design?: object;
}

interface CVData {
  cv?: {
    name: string;
    location?: string;
    email?: string;
    phone?: string;
    website?: string;
    social_networks?: Array<{ network: string; username: string }>;
    sections?: Array<{
      title: string;
      entries?: Array<{
        title?: string;
        institution?: string;
        location?: string;
        degree?: string;
        start_date?: string;
        end_date?: string;
        highlights?: string[];
      }>;
    }>;
  };
}

export default function CVPreview({ yamlContent, design }: CVPreviewProps) {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Parse YAML (simple implementation)
      const lines = yamlContent.split('\n');
      const parsed: any = {};
      let currentSection: any = null;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('cv:') || trimmed.startsWith('- cv:')) {
          parsed.cv = {};
          currentSection = parsed.cv;
        } else if (currentSection && trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();
          if (value) {
            currentSection[key.trim()] = value;
          }
        }
      });

      setCvData(parsed);
    } catch (err) {
      setError('Error parsing YAML');
      console.error(err);
    }
  }, [yamlContent]);

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg">
        <p className="text-red-400">{error}</p>
        <p className="text-red-300 text-sm mt-2">Showing raw YAML instead:</p>
        <pre className="mt-4 text-xs overflow-auto bg-black/30 p-4 rounded">
          {yamlContent}
        </pre>
      </div>
    );
  }

  if (!cvData?.cv) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📄</div>
        <p className="text-gray-400">Cargando CV...</p>
      </div>
    );
  }

  const cv = cvData.cv;

  return (
    <div className="cv-preview bg-white text-gray-900 rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-8">
        <h1 className="text-4xl font-bold mb-2">{cv.name || 'Sin nombre'}</h1>
        {cv.location && <p className="text-teal-100">📍 {cv.location}</p>}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          {cv.email && <span>📧 {cv.email}</span>}
          {cv.phone && <span>📱 {cv.phone}</span>}
          {cv.website && <span>🌐 {cv.website}</span>}
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-6">
        {cv.sections?.map((section, idx) => (
          <div key={idx} className="section">
            <h2 className="text-2xl font-bold text-teal-700 mb-4 pb-2 border-b-2 border-teal-200">
              {section.title}
            </h2>
            {section.entries?.map((entry, entryIdx) => (
              <div key={entryIdx} className="entry mb-4">
                {entry.title && (
                  <h3 className="text-lg font-semibold text-gray-800">{entry.title}</h3>
                )}
                {(entry.institution || entry.location) && (
                  <p className="text-teal-600">
                    {entry.institution && <span>{entry.institution}</span>}
                    {entry.location && <span> • {entry.location}</span>}
                  </p>
                )}
                {(entry.degree || entry.start_date) && (
                  <p className="text-sm text-gray-500">
                    {entry.degree && <span>{entry.degree}</span>}
                    {entry.start_date && (
                      <span> • {entry.start_date}{entry.end_date ? ` - ${entry.end_date}` : ' - Present'}</span>
                    )}
                  </p>
                )}
                {entry.highlights && entry.highlights.length > 0 && (
                  <ul className="mt-2 ml-4 list-disc text-sm text-gray-700">
                    {entry.highlights.map((highlight, hIdx) => (
                      <li key={hIdx}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ))}

        {(!cv.sections || cv.sections.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>Este CV no tiene secciones definidas.</p>
            <p className="text-sm mt-2">Usa el modo YAML para ver el contenido completo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
