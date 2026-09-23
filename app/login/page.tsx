//app/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'ADMIN' | 'MECANICO'>('MECANICO');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMsg('');
  setLoading(true);

  // 1. Iniciar sesión con Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
    setLoading(false);
    return;
  }

  // 2. Consultar el perfil utilizando la sesión obtenida
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (perfilError || !perfil) {
    setErrorMsg('No se pudo verificar el perfil de usuario. Revisa los permisos RLS en Supabase.');
    setLoading(false);
    return;
  }

  // Estandarizamos tanto el rol de la BD como la opción del select a minúsculas
  const rolBD = perfil.rol ? perfil.rol.toLowerCase().trim() : '';
  const rolSeleccionado = tab.toLowerCase().trim();

  // 3. Validar que el rol coincida sin importar mayúsculas/minúsculas
  if (rolBD !== rolSeleccionado) {
    setErrorMsg(`Acceso denegado: Tu cuenta no tiene rol de ${tab}.`);
    await supabase.auth.signOut();
    setLoading(false);
    return;
  }

  // 4. Redireccionar evaluando en minúsculas
  if (rolBD === 'admin') {
    router.push('/admin/dashboard');
  } else if (rolBD === 'mecanico') {
    router.push('/taller/dashboard');
  } else {
    setErrorMsg('Rol de usuario no reconocido.');
    await supabase.auth.signOut();
  }

  setLoading(false);
};

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Ingresar a AutoFair</h2>

<div className="mb-4">
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Tipo de Usuario
  </label>
  <select
  value={tab}
  onChange={(e) => setTab(e.target.value as 'ADMIN' | 'MECANICO')}
  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 bg-white"
>
  <option value="MECANICO">Mecánico</option>
  <option value="ADMIN">Administrador</option>
</select>
</div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tab === 'ADMIN' ? 'admin@taller.com' : 'mecanico@taller.com'}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Validando...' : `Entrar como ${tab === 'ADMIN' ? 'Administrador' : 'Mecánico'}`}
          </button>
        </form>

        {tab === 'MECANICO' && (
          <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600 mb-1">¿Eres nuevo en el taller?</p>
            <Link 
              href="/solicitud-mecanico" 
              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
            >
              Ingresar por primera vez
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}