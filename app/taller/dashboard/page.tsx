//app/taller/dashboard/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  FilePlus, 
  Clock, 
  LogOut, 
  Loader2, 
  Camera, 
  Send, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Car, 
  Phone, 
  User as UserIcon,
  Wrench,
  Search,
  DollarSign
} from 'lucide-react';

export default function MecanicoDashboardPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// -------------------------------------------------------------
  // ESTADOS DE CONTROL DE ACCESO
  // -------------------------------------------------------------
  const [verificandoAcceso, setVerificandoAcceso] = useState(true);
  const [estadoMecanico, setEstadoMecanico] = useState<'PENDIENTE' | 'APROBADO' | null>(null);

  // NUEVOS ESTADOS AGREGADOS:
  const [nombreMecanico, setNombreMecanico] = useState<string>('');
  const [mecanicoId, setMecanicoId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // NAVEGACIÓN Y DASHBOARD
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'espera' | 'presupuesto' | 'clientes'>('espera');

  // -------------------------------------------------------------
  // ESTADOS PARA DATOS (CLIENTES Y PRESUPUESTOS)
  // -------------------------------------------------------------
  const [presupuestosEspera, setPresupuestosEspera] = useState<any[]>([]);
  const [clientesLista, setClientesLista] = useState<any[]>([]);
  const [loadingTabla, setLoadingTabla] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Formulario Agregar Cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono_telegram: '',
    email: '',
    telegram_chat_id: ''
  });
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  // Formulario Presupuesto
  const [loadingPresupuesto, setLoadingPresupuesto] = useState(false);
  const [statusText, setStatusText] = useState('');
const [formData, setFormData] = useState({
  clienteNombre: '',
  clienteTelefono: '',
  vehiculoPlaca: '',
  vehiculoMarca: '',  // Nuevo
  vehiculoModelo: '', // Nuevo
  vehiculoAnio: '',   // Nuevo
  montoRepuestos: '', // Nuevo
  montoManoObra: '',  // Nuevo
  notasTecnicas: '',
});
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // -------------------------------------------------------------
  // VALIDACIÓN DE ACCESO
  // -------------------------------------------------------------
  useEffect(() => {
    const verificarEstadoAcceso = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Obtener datos del perfil (nombre, rol, estado)
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre, rol, estado')
        .eq('id', session.user.id)
        .single();

      if (perfil) {
        setNombreMecanico(perfil.nombre || 'Mecánico');
      }

      if (perfil?.rol === 'ADMIN') {
        router.push('/admin/dashboard');
        return;
      }

      // Obtener id en la tabla 'mecanicos' asociado al usuario
      const { data: mecanicoData } = await supabase
        .from('mecanicos')
        .select('id')
        .eq('usuario_id', session.user.id)
        .maybeSingle();

      if (mecanicoData) {
        setMecanicoId(mecanicoData.id);
      }

      if (perfil?.estado === 'ACTIVO') {
        setEstadoMecanico('APROBADO');
      } else {
        setEstadoMecanico('PENDIENTE');
      }

      setVerificandoAcceso(false);
    };

    verificarEstadoAcceso();
  }, [router, supabase]);

  // -------------------------------------------------------------
  // CARGA DE DATOS (ESPERA Y CLIENTES) Y SUSCRIPCIÓN EN TIEMPO REAL
  // -------------------------------------------------------------
  const cargarPresupuestosEspera = async () => {
    if (!mecanicoId) return; // Validación para evitar consultas sin el ID del mecánico
    setLoadingTabla(true);

    const { data } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('mecanico_id', mecanicoId) // <--- Filtro para traer solo sus presupuestos
      .order('creado_en', { ascending: false });
    
    if (data) setPresupuestosEspera(data);
    setLoadingTabla(false);
  };

  const cargarClientes = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('creado_en', { ascending: false });
    
    if (data) setClientesLista(data);
  };

  useEffect(() => {
    if (estadoMecanico === 'APROBADO' && mecanicoId) {
      cargarPresupuestosEspera();
      cargarClientes();

      // Suscripción en tiempo real a la tabla presupuestos
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'presupuestos' },
          () => {
            cargarPresupuestosEspera();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [estadoMecanico, mecanicoId]);

  // -------------------------------------------------------------
  // MANEJADORES DE FORMULARIOS
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoCliente(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .insert([
          {
            nombre: nuevoCliente.nombre,
            telefono_telegram: nuevoCliente.telefono_telegram,
            email: nuevoCliente.email || null,
            telegram_chat_id: nuevoCliente.telegram_chat_id || null
          }
        ]);

      if (error) throw new Error(error.message);

      alert('Cliente guardado exitosamente.');
      setNuevoCliente({ nombre: '', telefono_telegram: '', email: '', telegram_chat_id: '' });
      cargarClientes();
    } catch (err: any) {
      alert('Error al registrar cliente: ' + err.message);
    } finally {
      setGuardandoCliente(false);
    }
  };

  const handleSubmitPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPresupuesto(true);
    setStatusText('1/4 Subiendo evidencia multimedia...');

    try {
      let mediaPublicUrl = '';

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `evidencias/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('evidencias-multimedia')
          .upload(filePath, file);

        if (uploadError) throw new Error('Error al subir la imagen: ' + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from('evidencias-multimedia')
          .getPublicUrl(filePath);

        mediaPublicUrl = publicUrlData.publicUrl;
      }

      setStatusText('2/4 Gemini Flash generando resumen explicativo...');
      let resumenIA = formData.notasTecnicas;

      if (formData.notasTecnicas.trim()) {
        const resGemini = await fetch('/api/sintesis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notasTecnicas: formData.notasTecnicas })
        });
        const dataGemini = await resGemini.json();
        if (dataGemini.resumen) {
          resumenIA = dataGemini.resumen;
        }
      }

setStatusText('3/4 Registrando datos en la BD...');

      // 0. Obtener el id del mecánico actual logueado
      const { data: { user } } = await supabase.auth.getUser();
      let mecanicoId: string | null = null;

      if (user) {
        const { data: mecanicoData } = await supabase
          .from('mecanicos')
          .select('id')
          .eq('usuario_id', user.id)
          .maybeSingle();

        if (mecanicoData) {
          mecanicoId = mecanicoData.id;
        }
      }

      // 1. Insertar o recuperar Cliente por su teléfono
      let clienteId: string;
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefono_telegram', formData.clienteTelefono)
        .maybeSingle();

      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        const { data: nuevoCliente, error: errCliente } = await supabase
          .from('clientes')
          .insert([
            {
              nombre: formData.clienteNombre,
              telefono: formData.clienteTelefono
            }
          ])
          .select()
          .single();

        if (errCliente) throw new Error('Error al registrar cliente: ' + errCliente.message);
        clienteId = nuevoCliente.id;
      }

     // 2. Insertar o recuperar Vehículo por su placa
     let vehiculoId: string;
     const { data: vehiculoExistente } = await supabase
       .from('vehiculos')
       .select('id')
       .eq('placa', formData.vehiculoPlaca)
       .maybeSingle();

     if (vehiculoExistente) {
       vehiculoId = vehiculoExistente.id;
     } else {
       const { data: nuevoVehiculo, error: errVehiculo } = await supabase
         .from('vehiculos')
         .insert([
           {
             cliente_id: clienteId,
             placa: formData.vehiculoPlaca,
             marca: formData.vehiculoMarca, // Guardar marca explícita
             modelo: formData.vehiculoModelo, // Guardar modelo
             anio: formData.vehiculoAnio ? parseInt(formData.vehiculoAnio) : null // Guardar año como int4
           }
         ])
         .select()
         .single();

       if (errVehiculo) throw new Error('Error al registrar vehículo: ' + errVehiculo.message);
       vehiculoId = nuevoVehiculo.id;
}

      // 3. Crear el Presupuesto
const repuestosNum = parseFloat(formData.montoRepuestos) || 0;
const manoObraNum = parseFloat(formData.montoManoObra) || 0;

const { data: dbData, error: dbError } = await supabase
  .from('presupuestos')
  .insert([
    {
      vehiculo_id: vehiculoId,
      mecanico_id: mecanicoId,
      monto_repuestos: repuestosNum, // Mapeado a numeric
      monto_mano_obra: manoObraNum,   // Mapeado a numeric
      resumen_ia: resumenIA,
      estado: 'Pendiente'
    }
  ])
  .select()
  .single();

      if (dbError) throw new Error('Error en BD al guardar presupuesto: ' + dbError.message);

      // 4. Guardar evidencia multimedia si existe
      if (mediaPublicUrl && dbData) {
        await supabase
          .from('evidencias')
          .insert([
            {
              presupuesto_id: dbData.id,
              tipo: 'imagen',
              url_archivo: mediaPublicUrl,
              descripcion: formData.notasTecnicas
            }
          ]);
      }

setStatusText('4/4 Consultando Telegram ID y enviando notificación...');

// Llamada a la API interna que busca el telegram_chat_id en Supabase y notifica a n8n
const resApi = await fetch('/api/enviar-presupuesto', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    presupuestoId: dbData.id,
    clienteNombre: formData.clienteNombre,
    clienteTelefono: formData.clienteTelefono, // Se envía el teléfono para que la API busque el chat_id
    vehiculo: `${formData.vehiculoMarca} ${formData.vehiculoModelo} (${formData.vehiculoAnio}) - Placa: ${formData.vehiculoPlaca}`,
    montoRepuestos: repuestosNum,
    montoManoObra: manoObraNum,
    resumenExplicativo: resumenIA,
    evidenciaUrl: mediaPublicUrl
  })
});

if (!resApi.ok) {
  console.warn('Advertencia: El presupuesto se guardó pero falló la notificación por Telegram.');
}

// Resetear el formulario al finalizar
alert('Presupuesto enviado y notificación en proceso.');
setFormData({
  clienteNombre: '',
  clienteTelefono: '',
  vehiculoPlaca: '',
  vehiculoMarca: '',
  vehiculoModelo: '',
  vehiculoAnio: '',
  montoRepuestos: '',
  montoManoObra: '',
  notasTecnicas: ''
});


      setFile(null);
      setPreviewUrl(null);
      setActiveTab('espera');
      cargarPresupuestosEspera();
    } catch (err: any) {
      alert(err.message || 'Error durante el proceso');
    } finally {
      setLoadingPresupuesto(false);
      setStatusText('');
    }
  };

  const seleccionarClienteParaPresupuesto = (cliente: any) => {
    setFormData((prev) => ({
      ...prev,
      clienteNombre: cliente.nombre || '',
      clienteTelefono: cliente.telefono_telegram || ''
    }));
    setActiveTab('presupuesto');
  };

  // -------------------------------------------------------------
  // VISTAS DE ESTADO DE AUTENTICACIÓN
  // -------------------------------------------------------------
  if (verificandoAcceso) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Verificando permisos...
        </p>
      </div>
    );
  }

  if (estadoMecanico === 'PENDIENTE') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-amber-500/20">
            ⏳
          </div>
          <h2 className="text-lg font-bold">Cuenta en Revisión</h2>
          <blockquote className="text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800/80 italic text-left leading-relaxed">
            "Tu cuenta ha sido registrada con éxito. Un administrador debe aprobar tu acceso antes de que puedas comenzar a subir presupuestos."
          </blockquote>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DASHBOARD DE ESCRITORIO
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER DE ESCRITORIO */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-white">
              {nombreMecanico ? `Panel de ${nombreMecanico}` : 'Panel del Mecánico'}
            </h1>
            <p className="text-xs text-slate-400">Gestión de diagnósticos y presupuestos</p>
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL (PESTAÑAS) */}
        <nav className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('espera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'espera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Clientes en Espera
          </button>

          <button
            onClick={() => setActiveTab('presupuesto')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'presupuesto'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            Enviar Presupuesto
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'clientes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Agregar / Lista Clientes
          </button>
        </nav>

        {/* BOTÓN SALIR */}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL DE ESCRITORIO */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
        
        {/* ------------------------------------------------------------- */}
        {/* PESTAÑA 1: CLIENTES EN ESPERA */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'espera' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" /> Presupuestos en Espera y Estado
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Listado de clientes con respuesta pendiente o estado de orden en tiempo real.
                </p>
              </div>

              <button
                onClick={cargarPresupuestosEspera}
                className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl transition-colors"
              >
                Refrescar Datos
              </button>
            </div>

            {loadingTabla ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                Cargando estado de presupuestos...
              </div>
            ) : presupuestosEspera.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl">
                <p className="text-sm text-slate-400">No hay presupuestos registrados actualmente.</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Vehículo</th>
                      <th className="p-4">Monto ($USD)</th>
                      <th className="p-4">Resumen IA</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {presupuestosEspera.map((p) => {
                      const estado = p.estado || 'Pendiente';
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-medium text-white">
                            <div className="flex flex-col">
                              <span>{p.cliente_nombre || p.cliente}</span>
                              <span className="text-[10px] text-slate-500">{p.cliente_telefono || p.telefono}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Car className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{p.vehiculo_modelo || p.vehiculo}</span>
                              <span className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                {p.vehiculo_placa}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-emerald-400">
                            ${parseFloat(p.monto_total || p.monto || 0).toFixed(2)}
                          </td>
                          <td className="p-4 max-w-xs truncate text-slate-400" title={p.resumen_ia}>
                            {p.resumen_ia || p.notas_tecnicas || 'Sin detalle'}
                          </td>
                          <td className="p-4">
                            {estado === 'Aprobado' || estado === 'APROBADO' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado
                              </span>
                            ) : estado === 'Rechazado' || estado === 'RECHAZADO' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                                <XCircle className="w-3.5 h-3.5" /> Rechazado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                                <Clock className="w-3.5 h-3.5" /> Esperando Cliente
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-[10px] text-slate-500">
                            {p.creado_en ? new Date(p.creado_en).toLocaleString() : 'Reciente'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PESTAÑA 2: ENVIAR PRESUPUESTO */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'presupuesto' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-indigo-400" /> Crear y Enviar Presupuesto
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Registra los detalles del diagnóstico, agrega la foto/evidencia y genera la notificación con IA.
              </p>
            </div>

            <form onSubmit={handleSubmitPresupuesto} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Cliente</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={formData.clienteNombre}
                      onChange={(e) => setFormData({...formData, clienteNombre: e.target.value})}
                      placeholder="Ej. Carlos Mendoza" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / Telegram ID</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                    <input 
                      type="tel" 
                      required
                      value={formData.clienteTelefono}
                      onChange={(e) => setFormData({...formData, clienteTelefono: e.target.value})}
                      placeholder="Ej. +584120000000" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 2: Datos del Vehículo */}
<div className="grid grid-cols-3 gap-4">
  <div>
    <label className="block text-xs font-semibold text-slate-300 mb-1">Placa Vehículo</label>
    <input 
      type="text" 
      required
      value={formData.vehiculoPlaca}
      onChange={(e) => setFormData({...formData, vehiculoPlaca: e.target.value.toUpperCase()})}
      placeholder="AB123CD" 
      className="w-full uppercase bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
    />
  </div>

  <div>
    <label className="block text-xs font-semibold text-slate-300 mb-1">Marca</label>
    <input 
      type="text" 
      required
      value={formData.vehiculoMarca}
      onChange={(e) => setFormData({...formData, vehiculoMarca: e.target.value})}
      placeholder="Ej. Toyota" 
      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
    />
  </div>

  <div>
    <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo / Año</label>
    <div className="flex gap-2">
      <input 
        type="text" 
        required
        value={formData.vehiculoModelo}
        onChange={(e) => setFormData({...formData, vehiculoModelo: e.target.value})}
        placeholder="Corolla" 
        className="w-2/3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500"
      />
      <input 
        type="number" 
        required
        value={formData.vehiculoAnio}
        onChange={(e) => setFormData({...formData, vehiculoAnio: e.target.value})}
        placeholder="2018" 
        className="w-1/3 bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-sm focus:outline-none focus:border-indigo-500"
      />
    </div>
  </div>
</div>

{/* Fila 3: Evidencia y Desglose de Montos */}
<div className="grid grid-cols-2 gap-6">
  {/* Subir archivo */}
  <div>
    <label className="block text-xs font-semibold text-slate-300 mb-1">Evidencia Multimedia (Foto/Video)</label>
    <div className="relative">
      <input 
        type="file" 
        accept="image/*,video/*" 
        onChange={handleFileChange}
        id="cameraInputDesk"
        className="hidden"
      />
      <label 
        htmlFor="cameraInputDesk" 
        className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950 rounded-xl cursor-pointer transition-all p-4 text-center"
      >
        {previewUrl ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={previewUrl} alt="Vista previa" className="h-full object-contain rounded-lg" />
            <span className="absolute bottom-1 right-1 bg-black/80 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
              Cargado ✓
            </span>
          </div>
        ) : (
          <>
            <div className="p-2.5 bg-indigo-600/10 text-indigo-400 rounded-full mb-2">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-300">Seleccionar o tomar archivo</span>
            <span className="text-[10px] text-slate-500 mt-1">Fotos JPG/PNG o Video corto</span>
          </>
        )}
      </label>
    </div>
  </div>

  {/* Montos y Notas */}
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Monto Repuestos ($)</label>
        <div className="relative">
          <DollarSign className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input 
            type="number" 
            step="0.01"
            required
            value={formData.montoRepuestos}
            onChange={(e) => setFormData({...formData, montoRepuestos: e.target.value})}
            placeholder="0.00" 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Monto Mano de Obra ($)</label>
        <div className="relative">
          <DollarSign className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input 
            type="number" 
            step="0.01"
            required
            value={formData.montoManoObra}
            onChange={(e) => setFormData({...formData, montoManoObra: e.target.value})}
            placeholder="0.00" 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </div>

    {/* Visualizador de Total Sumado */}
    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
      <span className="text-xs font-medium text-slate-400">Total Calculado:</span>
      <span className="text-base font-bold text-emerald-400">
        ${((parseFloat(formData.montoRepuestos) || 0) + (parseFloat(formData.montoManoObra) || 0)).toFixed(2)} USD
      </span>
    </div>

    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
        <span>Notas Técnicas para Sintetizar</span>
        <span className="text-[10px] text-indigo-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Gemini Flash
        </span>
      </label>
      <textarea 
        rows={2}
        value={formData.notasTecnicas}
        onChange={(e) => setFormData({...formData, notasTecnicas: e.target.value})}
        placeholder="Ej. Pastillas desgastadas al 90%, rectificación de discos urgente..." 
        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
      />
    </div>
  </div>
</div>

              {loadingPresupuesto && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-xs text-indigo-300 font-medium">{statusText}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={
  loadingPresupuesto || 
  (!formData.montoRepuestos && !formData.montoManoObra)
}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {loadingPresupuesto ? 'Procesando Envio...' : 'Enviar Presupuesto al Cliente'} <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PESTAÑA 3: AGREGAR Y LISTA DE CLIENTES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'clientes' && (
          <div className="grid grid-cols-3 gap-8 animate-in fade-in duration-300">
            {/* FORMULARIO AGREGAR CLIENTE */}
            <div className="col-span-1 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" /> Registrar Nuevo Cliente
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Añade los datos para luego generar un presupuesto rápido</p>
              </div>

              <form onSubmit={handleCrearCliente} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
  <div>
    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
    <input 
      type="text" 
      required
      value={nuevoCliente.nombre}
      onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
      placeholder="Ej. María Pérez" 
      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
    />
  </div>

  <div>
    <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / Telegram</label>
    <input 
      type="text" 
      required
      value={nuevoCliente.telefono_telegram}
      onChange={(e) => setNuevoCliente({...nuevoCliente, telefono_telegram: e.target.value})}
      placeholder="Ej. +584140000000" 
      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
    />
  </div>

  <div>
    <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Chat ID</label>
    <input 
      type="text" 
      value={nuevoCliente.telegram_chat_id}
      onChange={(e) => setNuevoCliente({...nuevoCliente, telegram_chat_id: e.target.value})}
      placeholder="Ej. 123456789" 
      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
    />
  </div>

  <div>
    <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico (Opcional)</label>
    <input 
      type="email" 
      value={nuevoCliente.email}
      onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})}
      placeholder="cliente@correo.com" 
      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
    />
  </div>

  <button
    type="submit"
    disabled={guardandoCliente}
    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
  >
    {guardandoCliente ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Guardar Cliente
  </button>
</form>
            </div>

            {/* TABLA / LISTA DE CLIENTES REGISTRADOS */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" /> Clientes Registrados
                </h2>
                
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input 
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Nombre</th>
                      <th className="p-3.5">Teléfono / Telegram</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {clientesLista
                      .filter(c => c.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
                      .map((c) => (
                        <tr key={c.id || c.telefono_telegram} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-medium text-white">{c.nombre}</td>
                          <td className="p-3.5 text-slate-400">{c.telefono_telegram}</td>
                          <td className="p-3.5 text-slate-500">{c.email || 'N/A'}</td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => seleccionarClienteParaPresupuesto(c)}
                              className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                            >
                              Presupuestar
                            </button>
                          </td>
                        </tr>
                      ))}
                    {clientesLista.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-500">
                          No hay clientes registrados aún.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}