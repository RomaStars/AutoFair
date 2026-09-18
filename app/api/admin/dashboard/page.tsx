// app/admin/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

export default function AdminDashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [mecanicos, setMecanicos] = useState<any[]>([]);
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario Nuevo Mecánico
  const [form, setForm] = useState({
    nombre: '',
    especialidad: '',
    telefono_whatsapp: '',
    email: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Cargar Datos Iniciales
  const fetchData = async () => {
    setLoading(true);
    
    // Obtener mecánicos
    const { data: mecData } = await supabase.from('mecanicos').select('*').order('created_at', { ascending: false });
    if (mecData) setMecanicos(mecData);

    // Obtener presupuestos globales
    const { data: presData } = await supabase.from('presupuestos').select('*, mecanicos(nombre)').order('created_at', { ascending: false });
    if (presData) setPresupuestos(presData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Suscripción Realtime a presupuestos
    const channel = supabase
      .channel('admin_presupuestos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presupuestos' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Crear Mecánico
  const handleCreateMecanico = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/mecanicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await res.json();
      if (result.success) {
        setForm({ nombre: '', especialidad: '', telefono_whatsapp: '', email: '', password: '' });
        fetchData();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      alert('Error en la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar / Revocar Mecánico
  const handleDeleteMecanico = async (id: string) => {
    if (!confirm('¿Seguro que deseas revocar el acceso a este mecánico?')) return;
    await supabase.from('mecanicos').delete().eq('id', id);
    fetchData();
  };

  // Métricas
  const totalPresupuestos = presupuestos.length;
  const aprobados = presupuestos.filter(p => p.estado?.toLowerCase() === 'aprobado').length;
  const pendientes = presupuestos.filter(p => p.estado?.toLowerCase() === 'pendiente').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-500" /> Dashboard del Administrador
          </h1>
          <p className="text-slate-400 text-sm mt-1">Supervisión en tiempo real y gestión del personal técnico</p>
        </div>
        <button 
          onClick={fetchData} 
          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 p-2.5 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* METRICAS DE CONTROL GENERAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Emitidos</p>
            <p className="text-3xl font-extrabold text-white mt-1">{totalPresupuestos}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Aprobados</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{aprobados}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pendientes</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">{pendientes}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECCIÓN CRUD Y TABLAS */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO DE ALTA */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" /> Alta de Nuevo Mecánico
          </h2>
          <form onSubmit={handleCreateMecanico} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nombre Completo</label>
              <input 
                type="text" required value={form.nombre} 
                onChange={e => setForm({...form, nombre: e.target.value})}
                placeholder="Juan Pérez" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Especialidad</label>
              <input 
                type="text" required value={form.especialidad} 
                onChange={e => setForm({...form, especialidad: e.target.value})}
                placeholder="Frenos / Motor" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Telegram Chat ID / Teléfono</label>
              <input 
                type="text" required value={form.telefono_whatsapp} 
                onChange={e => setForm({...form, telefono_whatsapp: e.target.value})}
                placeholder="123456789" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Correo Electrónico</label>
              <input 
                type="email" required value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="mecanico@autofair.com" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contraseña Inicial</label>
              <input 
                type="password" required value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button 
              type="submit" disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm mt-2"
            >
              {submitting ? 'Guardando...' : 'Registrar Mecánico'}
            </button>
          </form>
        </div>

        {/* TABLA GESTIÓN MECÁNICOS */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Personal Mecánico Activo
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-300 text-xs uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Especialidad</th>
                    <th className="p-3">Correo / ID</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mecanicos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-semibold text-white">{m.nombre}</td>
                      <td className="p-3">{m.especialidad}</td>
                      <td className="p-3 text-xs">{m.email || m.telefono_whatsapp}</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDeleteMecanico(m.id)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MONITOR DE PRESUPUESTOS GLOBAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Supervisión de Presupuestos en Tiempo Real</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-300 text-xs uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">ID / Vehículo</th>
                    <th className="p-3">Mecánico</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {presupuestos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-950/40">
                      <td className="p-3 text-white font-mono text-xs">{p.id.substring(0, 8)}...</td>
                      <td className="p-3">{p.mecanicos?.nombre || 'Sin asignar'}</td>
                      <td className="p-3 font-semibold text-white">${p.monto_total}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.estado?.toLowerCase() === 'aprobado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          p.estado?.toLowerCase() === 'rechazado' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}