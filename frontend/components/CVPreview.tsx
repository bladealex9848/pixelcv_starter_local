"use client";
import { useState, useEffect } from 'react';
import * as yaml from 'js-yaml';

interface CVPreviewProps {
  yamlContent: string;
  design?: object;
}

export default function CVPreview({ yamlContent, design }: CVPreviewProps) {
  const [cvData, setCvData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parsed = yaml.load(yamlContent) as any;
      setCvData(parsed);
      setError(null);
    } catch (err) {
      setError('Error parsing YAML');
      console.error(err);
    }
  }, [yamlContent]);

  if (error || !cvData?.cv) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg">
        <p className="text-red-400">{error || 'Error loading CV'}</p>
        <p className="text-red-300 text-sm mt-2">Showing raw YAML instead:</p>
        <pre className="mt-4 text-xs overflow-auto bg-black/30 p-4 rounded text-gray-300">
          {yamlContent}
        </pre>
      </div>
    );
  }

  const cv = cvData.cv;

  return (
    <div className="cv-preview bg-white text-gray-900 rounded-lg shadow-2xl overflow-auto max-h-[800px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-8">
        <h1 className="text-4xl font-bold mb-2">{cv.name || 'Sin nombre'}</h1>
        {cv.location && <p className="text-teal-100 flex items-center gap-2">📍 {cv.location}</p>}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          {cv.email && <span className="flex items-center gap-1">📧 {cv.email}</span>}
          {cv.phone && <span className="flex items-center gap-1">📱 {cv.phone}</span>}
          {cv.social_networks && cv.social_networks.length > 0 && cv.social_networks.map((sn: any, idx: number) => (
            <span key={idx} className="flex items-center gap-1">💼 {sn.network}: {sn.username}</span>
          ))}
        </div>
        {cv.summary && (
          <p className="mt-4 text-teal-50 text-sm leading-relaxed">{cv.summary}</p>
        )}
      </div>

      {/* Content */}
      <div className="p-8 space-y-6">
        {cv.sections ? (
          Object.entries(cv.sections).map(([sectionTitle, sectionData]: [string, any]) => (
            <div key={sectionTitle} className="section">
              <h2 className="text-2xl font-bold text-teal-700 mb-4 pb-2 border-b-2 border-teal-200">
                {sectionTitle}
              </h2>
              {Array.isArray(sectionData) && sectionData.length > 0 ? (
                <div className="space-y-4">
                  {sectionData.map((entry: any, entryIdx: number) => (
                    <div key={entryIdx} className="entry pl-4 border-l-2 border-teal-200">
                      {entry.position && (
                        <h3 className="text-lg font-semibold text-gray-800">{entry.position}</h3>
                      )}
                      {entry.company && (
                        <p className="text-teal-600 font-medium">{entry.company}</p>
                      )}
                      {entry.institution && (
                        <h3 className="text-lg font-semibold text-gray-800">{entry.institution}</h3>
                      )}
                      {entry.area && (
                        <p className="text-teal-600">{entry.area}</p>
                      )}
                      {entry.degree && (
                        <p className="text-teal-600">{entry.degree}</p>
                      )}
                      {(entry.start_date || entry.end_date) && (
                        <p className="text-sm text-gray-500">
                          {entry.start_date || ''} {entry.end_date ? `- ${entry.end_date}` : ''}
                        </p>
                      )}
                      {entry.location && (
                        <p className="text-sm text-gray-500">📍 {entry.location}</p>
                      )}
                      {entry.highlights && entry.highlights.length > 0 && (
                        <ul className="mt-2 ml-4 list-disc text-sm text-gray-700 space-y-1">
                          {entry.highlights.map((highlight: string, hIdx: number) => (
                            <li key={hIdx}>{highlight}</li>
                          ))}
                        </ul>
                      )}
                      {entry.details && (
                        <p className="text-sm text-gray-700 mt-2">{entry.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No entries in this section</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">Este CV no tiene secciones definidas.</p>
            <p className="text-sm mt-2">Usa el modo YAML para ver el contenido completo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
