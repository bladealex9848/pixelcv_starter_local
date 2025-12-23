"use client";
import { useState } from 'react'

export default function Editor() {
  const [form, setForm] = useState<any>({
    name: '', headline: '', location: '', email: '', phone: '', website: '',
    social_networks: [],
    sections: {
      experiencia: [
        { company: '', position: '', start_date: '2024-01', end_date: 'present', location: '', highlights: ["Lideré..."] },
      ],
      educacion: [
        { institution: '', degree: '', area: '', start_date: '2019-01', end_date: '2023-12', location: '', highlights: ["Tesis..."] },
      ]
    },
    theme: 'classic', locale: 'spanish', current_date: new Date().toISOString().slice(0,10),
    improve: true, model: 'llama3.2', formats: ['pdf','png']
  })
  const [result, setResult] = useState<any>(null)
  const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

  async function handleRender() {
    const resp = await fetch(`${API}/cv`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    const data = await resp.json(); setResult(data)
  }

  return (
    <main className="p-10 space-y-6">
      <h2 className="text-3xl font-semibold">Editor YAML (GUI)</h2>
      <p>Completa tus datos y pulsa START. IA (Ollama) puede mejorar tus bullets si está activado.</p>
      <button onClick={handleRender} className="btn-start">START: Generar CV</button>
      {result && (
        <div className="space-y-4">
          <a className="btn" href={`${API}/cv/${result.cvId}/pdf`} target="_blank">Descargar PDF</a>
          <details className="bg-black/20 p-4 rounded">
            <summary className="cursor-pointer">YAML generado</summary>
            <pre className="whitespace-pre-wrap">{result.yaml}</pre>
          </details>
        </div>
      )}
    </main>
  )
}
