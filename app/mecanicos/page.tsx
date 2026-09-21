// app/mecanicos/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MecanicosPage() {
  const [mecanicos, setMecanicos] = useState<any[]>([]);
  const [form, setForm] = useState({ nombre: '', especialidad: '', telefono_whatsapp: '' });

  const fetchMecanicos = async () => {
    const { data } = await supabase.from('mecanicos').select('*');
    if (data) setMecanicos(data);
  };

  useEffect(() => { fetchMecanicos(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('mecanicos').insert([form]);
    setForm({ nombre: '', especialidad: '', telefono_whatsapp: '' });
    fetchMecanicos();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Mecánicos</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4 bg-gray-100 p-4 rounded-lg">
        <input 
          placeholder="Nombre" 
          value={form.nombre} 
          onChange={(e) => setForm({...form, nombre: e.target.value})} 
          className="p-2 border rounded" required 
        />
        <input 
          placeholder="Especialidad" 
          value={form.especialidad} 
          onChange={(e) => setForm({...form, especialidad: e.target.value})} 
          className="p-2 border rounded" required 
        />
        <input 
          placeholder="Telegram ID / WhatsApp" 
          value={form.telefono_whatsapp} 
          onChange={(e) => setForm({...form, telefono_whatsapp: e.target.value})} 
          className="p-2 border rounded" required 
        />
        <button type="submit" className="col-span-3 bg-blue-600 text-white p-2 rounded">Guardar Mecánico</button>
      </form>

      <ul className="divide-y border rounded">
        {mecanicos.map((m: any) => (
          <li key={m.id} className="p-3 flex justify-between">
            <span><strong>{m.nombre}</strong> - {m.especialidad}</span>
            <span className="text-gray-500">{m.telefono_whatsapp}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}