// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Solicitud {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
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
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [activos, setActivos] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pendientes' | 'activos'>('pendientes');

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

  const cargarDatos = async () => {
    setLoading(true);
    await Promise.all([cargarSolicitudes(), cargarActivos()]);
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

  // Desactivar usuario activo
  const handleDesactivar = async (id: string) => {
    if (!confirm('¿Estás seguro de dar de baja a este mecánico?')) return;

    const { error } = await supabase
      .from('perfiles')
      .update({ estado: 'INACTIVO' })
      .eq('id', id);

    if (!error) cargarActivos();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Gestión de Mecánicos</h1>

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
                : 'border-transparent text-slate-400'
            }`}
          >
            Solicitudes Pendientes ({solicitudes.length})
          </button>
          <button
            onClick={() => setTab('activos')}
            className={`pb-2 px-2 text-sm font-semibold border-b-2 transition ${
              tab === 'activos'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400'
            }`}
          >
            Mecánicos Activos ({activos.length})
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
        ) : (
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
        )}
      </div>
    </div>
  );
}