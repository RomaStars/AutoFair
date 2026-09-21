'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface Solicitud {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  telegram_chat_id?: string;
  password_provisoria: string;
  experiencia: string;
  estado: string;
  creado_en: string;
}

interface Perfil {
  id: string;
  nombre: string;
  rol: string;
  estado: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [activos, setActivos] = useState<Perfil[]>([]);
  const [inactivos, setInactivos] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [tab, setTab] = useState<'pendientes' | 'activos' | 'inactivos'>('pendientes');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Cargar solicitudes pendientes desde 'solicitudes_mecanicos'
  const cargarSolicitudes = async () => {
    const { data } = await supabase
      .from('solicitudes_mecanicos')
      .select('*')
      .eq('estado', 'PENDIENTE')
      .order('creado_en', { ascending: false });

    if (data) setSolicitudes(data);
  };

  // Cargar mecánicos aprobados/activos desde 'perfiles'
  const cargarActivos = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'MECANICO')
      .eq('estado', 'ACTIVO');

    if (data) setActivos(data);
  };

  // Cargar mecánicos inactivos desde 'perfiles'
  const cargarInactivos = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'MECANICO')
      .eq('estado', 'INACTIVO');

    if (data) setInactivos(data);
  };

  const cargarDatos = async () => {
    setLoading(true);
    await Promise.all([cargarSolicitudes(), cargarActivos(), cargarInactivos()]);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();

    // Suscripción en tiempo real a la tabla 'solicitudes_mecanicos'
    const channel = supabase
      .channel('realtime_solicitudes_admin')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'solicitudes_mecanicos' },
        (payload) => {
          if (payload.new.estado === 'PENDIENTE') {
            setSolicitudes((prev) => [payload.new as Solicitud, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Función para cerrar sesión
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      alert('Error al cerrar sesión');
      setLoggingOut(false);
    }
  };

  // Aprobar solicitud llamando al endpoint del servidor
  const handleAprobar = async (solicitud: Solicitud) => {
    setLoadingId(solicitud.id);

    try {
      const res = await fetch('/api/aprobar-mecanico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitudId: solicitud.id,
          email: solicitud.email,
          password: solicitud.password_provisoria,
          nombre: solicitud.nombre_completo,
          telefono: solicitud.telefono,
          experiencia: solicitud.experiencia,
          telegram_chat_id: solicitud.telegram_chat_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert('Error al aprobar: ' + data.error);
      } else {
        alert('Mecánico aprobado correctamente');
        cargarDatos();
      }
    } catch (err) {
      alert('Ocurrió un error inesperado al procesar la aprobación');
    } finally {
      setLoadingId(null);
    }
  };

  // Rechazar solicitud de mecánico
  const handleRechazar = async (id: string) => {
    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) return;

    const { error } = await supabase
      .from('solicitudes_mecanicos')
      .update({ estado: 'RECHAZADO' })
      .eq('id', id);

    if (!error) cargarSolicitudes();
  };

  // Desactivar usuario activo (Cambia el estado a INACTIVO)
  const handleDesactivar = async (id: string) => {
    if (!confirm('¿Estás seguro de dar de baja a este mecánico?')) return;

    const { error } = await supabase
      .from('perfiles')
      .update({ estado: 'INACTIVO' })
      .eq('id', id);

    if (error) {
      alert('Error al dar de baja: ' + error.message);
    } else {
      await Promise.all([cargarActivos(), cargarInactivos()]);
    }
  };

  // Reactivar usuario inactivo (Cambia el estado a ACTIVO)
  const handleReactivar = async (id: string) => {
    const { error } = await supabase
      .from('perfiles')
      .update({ estado: 'ACTIVO' })
      .eq('id', id);

    if (error) {
      alert('Error al reactivar: ' + error.message);
    } else {
      await Promise.all([cargarActivos(), cargarInactivos()]);
    }
  };

// Eliminar usuario permanentemente de la base de datos
const handleEliminar = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar permanentemente a este mecánico? Esta acción no se puede deshacer.')) return;

  try {
    // 1. Obtener el email del perfil antes de eliminarlo
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('email')
      .eq('id', id)
      .single();

    // 2. Si se encuentra el correo, eliminar las solicitudes previas
    if (perfil?.email) {
      await supabase
        .from('solicitudes_mecanicos')
        .delete()
        .eq('email', perfil.email);
    }

    // 3. Eliminar de la tabla mecanicos
    await supabase
      .from('mecanicos')
      .delete()
      .eq('usuario_id', id);

    // 4. Eliminar el perfil principal
    const { error } = await supabase
      .from('perfiles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await Promise.all([cargarActivos(), cargarInactivos()]);
  } catch (error: any) {
    alert('Error al eliminar el registro: ' + error.message);
  }
};

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ENCABEZADO CON BOTÓN DE CERRAR SESIÓN */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Mecánicos</h1>
            <p className="text-xs text-slate-400">Panel de administración general</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
          >
            {loggingOut ? (
              <span>Cerrando sesión...</span>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
                <span>Cerrar Sesión</span>
              </>
            )}
          </button>
        </div>

        {/* NOTIFICACIÓN EN TIEMPO REAL DE SOLICITUDES */}
        {solicitudes.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <p className="text-sm font-medium text-amber-300">
                Tienes <strong>{solicitudes.length}</strong> solicitud(es) pendiente(s) de aprobación.
              </p>
            </div>
          </div>
        )}

        {/* PESTAÑAS */}
        <div className="flex space-x-4 border-b border-slate-800 pb-2">
          <button
            onClick={() => setTab('pendientes')}
            className={`pb-2 px-2 text-sm font-semibold border-b-2 transition ${
              tab === 'pendientes'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Solicitudes Pendientes ({solicitudes.length})
          </button>
          <button
            onClick={() => setTab('activos')}
            className={`pb-2 px-2 text-sm font-semibold border-b-2 transition ${
              tab === 'activos'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Mecánicos Activos ({activos.length})
          </button>
          <button
            onClick={() => setTab('inactivos')}
            className={`pb-2 px-2 text-sm font-semibold border-b-2 transition ${
              tab === 'inactivos'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Mecánicos Inactivos ({inactivos.length})
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">Cargando datos...</p>
        ) : tab === 'pendientes' ? (
          /* TAB: SOLICITUDES PENDIENTES */
          <div className="space-y-3">
            {solicitudes.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay solicitudes pendientes.</p>
            ) : (
              solicitudes.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{s.nombre_completo}</p>
                      <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                        Pendiente
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{s.email} • {s.telefono}</p>
                    <p className="text-xs text-slate-300"><strong>Especialidad:</strong> {s.experiencia}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAprobar(s)}
                      disabled={loadingId === s.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {loadingId === s.id ? 'Aprobando...' : 'Aprobar e Inscribir'}
                    </button>
                    <button
                      onClick={() => handleRechazar(s.id)}
                      disabled={loadingId === s.id}
                      className="bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-rose-600/30"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : tab === 'activos' ? (
          /* TAB: MECÁNICOS ACTIVOS */
          <div className="space-y-3">
            {activos.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay mecánicos activos.</p>
            ) : (
              activos.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-white">{m.nombre}</p>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      Activo
                    </span>
                  </div>
                  {/* SOLO EL BOTÓN DE DAR DE BAJA */}
                  <button
                    onClick={() => handleDesactivar(m.id)}
                    className="bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-amber-600/30"
                  >
                    Dar de baja
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* TAB: MECÁNICOS INACTIVOS */
          <div className="space-y-3">
            {inactivos.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay mecánicos inactivos.</p>
            ) : (
              inactivos.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-white">{m.nombre}</p>
                    <span className="text-xs bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded border border-slate-500/20">
                      Inactivo
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReactivar(m.id)}
                      className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-emerald-600/30"
                    >
                      Reactivar
                    </button>
                    <button
                      onClick={() => handleEliminar(m.id)}
                      className="bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-rose-600/30"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}