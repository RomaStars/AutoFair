// app/registro/page.tsx
'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre,
          rol: 'MECANICO' // El trigger asignará el estado 'PENDIENTE' automáticamente
        }
      }
    });

    if (error) {
      setMensaje('Error: ' + error.message);
    } else {
      setMensaje('¡Registro exitoso! Tu cuenta está PENDIENTE de aprobación por el Administrador.');
      setTimeout(() => router.push('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <form onSubmit={handleRegister} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Registro de Mecánico</h1>
        {mensaje && <p className="text-xs bg-slate-800 p-3 rounded-lg text-amber-400">{mensaje}</p>}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nombre Completo</label>
          <input 
            type="text" required value={form.nombre}
            onChange={e => setForm({...form, nombre: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none" 
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Correo Electrónico</label>
          <input 
            type="email" required value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none" 
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Contraseña</label>
          <input 
            type="password" required value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none" 
          />
        </div>
        <button 
          type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-2 rounded-xl text-sm"
        >
          {loading ? 'Registrando...' : 'Crear Cuenta'}
        </button>
      </form>
    </div>
  );
}