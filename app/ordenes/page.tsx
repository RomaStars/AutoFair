'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function OrdenesPage() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [notas, setNotas] = useState('');
  const [resumen, setResumen] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      let mediaUrl = '';

      // A. Subir imagen/video a Supabase Bucket 'evidencias-multimedia'
      if (archivo) {
        const fileExt = archivo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('evidencias-multimedia')
          .upload(fileName, archivo);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('evidencias-multimedia')
          .getPublicUrl(fileName);

        mediaUrl = publicUrlData.publicUrl;
      }

      // B. Generar resumen técnico mediante la API Route de Gemini
      const resGemini = await fetch('/api/sintesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notasTecnicas: notas }),
      });
      const dataGemini = await resGemini.json();
      setResumen(dataGemini.resumen);

      // C. Disparar el Webhook hacia n8n
      await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notasOriginales: notas,
          resumenTecnico: dataGemini.resumen,
          multimediaUrl: mediaUrl,
        }),
      });

      alert('Orden procesada y enviada con éxito');
    } catch (err) {
      console.error(err);
      alert('Error al procesar la orden');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Nueva Orden de Trabajo</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Notas Técnicas</label>
          <textarea
            className="w-full border p-2 rounded text-black"
            rows={4}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Evidencia (Imagen/Video)</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {cargando ? 'Procesando...' : 'Generar y Enviar'}
        </button>
      </form>

      {resumen && (
        <div className="mt-6 p-4 bg-gray-800 rounded">
          <h2 className="font-bold mb-2">Resumen Generado:</h2>
          <p>{resumen}</p>
        </div>
      )}
    </div>
  );
}