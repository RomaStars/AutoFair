// app/solicitud-mecanico/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SolicitudMecanicoPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telegramChatId, setTelegramChatId] = useState(''); // <-- 1. NUEVO ESTADO
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    // 2. ENVÍO A SUPABASE INCLUYENDO telegram_chat_id
    const { error } = await supabase.from('solicitudes_mecanicos').insert([
      {
        nombre_completo: nombre,
        email,
        telefono,
        telegram_chat_id: telegramChatId, // <-- SE AGREGA AQUÍ
        password_provisoria: password,
        experiencia,
        estado: 'PENDIENTE',
      },
    ]);

    if (error) {
      setErrorMsg('Ocurrió un error al enviar la solicitud. Intenta nuevamente.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
          Solicitud de Registro de Mecánico
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Completa tus datos. Tu solicitud será enviada al administrador para aprobación.
        </p>

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
            <p className="text-green-800 font-semibold text-sm">
              ¡Solicitud enviada con éxito!
            </p>
            <p className="text-xs text-green-700">
              El administrador revisará tu solicitud. Una vez aprobada, recibirás acceso al sistema.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-2 text-sm bg-green-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Volver al Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mecanico@correo.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+58 412 1234567"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            {/* 3. NUEVO CAMPO EN EL FORMULARIO JSX */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telegram Chat ID</label>
              <input
                type="text"
                required
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Ej. 123456789"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Especialidad / Experiencia</label>
              <textarea
                required
                rows={3}
                value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)}
                placeholder="Ej. Mecánica general, diagnóstico electrónico, frenos..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-1/3 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}