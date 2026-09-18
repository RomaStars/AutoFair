'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'ADMIN' | 'MECANICO'>('ADMIN');
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

    // Mapear el tab seleccionado hacia el valor exacto en la BD
    const rolEsperado = tab === 'ADMIN' ? 'Administrador' : 'Mecánico';

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

    // 3. Validar que el rol de la BD coincida con la pestaña seleccionada
    if (perfil.rol !== rolEsperado && perfil.rol !== tab) {
      setErrorMsg(`Acceso denegado: Esta cuenta no tiene permisos de ${rolEsperado}.`);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // 4. Redireccionar según el rol
    if (perfil.rol === 'Administrador' || perfil.rol === 'ADMIN') {
      router.push('/admin/dashboard');
    } else {
      router.push('/taller/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Ingresar a AutoFair</h2>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setTab('MECANICO')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
              tab === 'MECANICO' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Mecánico
          </button>
          <button
            type="button"
            onClick={() => setTab('ADMIN')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
              tab === 'ADMIN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Administrador
          </button>
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