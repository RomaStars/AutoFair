// app/taller/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  Send, 
  CheckCircle, 
  User, 
  Car, 
  Wrench, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';

export default function MecanicoDashboardPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Estados de Control de Acceso
  const [verificandoAcceso, setVerificandoAcceso] = useState(true);
  const [estadoMecanico, setEstadoMecanico] = useState<'PENDIENTE' | 'APROBADO' | null>(null);

  // Control del Wizard en pasos
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Estados del Formulario
  const [formData, setFormData] = useState({
    clienteNombre: '',
    clienteTelefono: '',
    vehiculoPlaca: '',
    vehiculoModelo: '',
    montoTotal: '',
    notasTecnicas: '',
  });

  // Evidencias Multimedia
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

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, estado')
      .eq('id', session.user.id)
      .single();

    // 1. Redirigir si el rol en Supabase es 'ADMIN'
    if (perfil?.rol === 'ADMIN') {
      router.push('/admin/dashboard');
      return;
    }

    // 2. Aprobar acceso si el estado en Supabase es 'ACTIVO'
    if (perfil?.estado === 'ACTIVO') {
      setEstadoMecanico('APROBADO');
    } else {
      setEstadoMecanico('PENDIENTE');
    }

    setVerificandoAcceso(false);
  };

  verificarEstadoAcceso();
}, [router, supabase]);

  // Manejador de entrada de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // Envío del Presupuesto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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

      setStatusText('3/4 Registrando presupuesto en la BD...');
      const { data: dbData, error: dbError } = await supabase
        .from('presupuestos')
        .insert([
          {
            cliente_nombre: formData.clienteNombre,
            cliente_telefono: formData.clienteTelefono,
            vehiculo_placa: formData.vehiculoPlaca,
            vehiculo_modelo: formData.vehiculoModelo,
            monto_total: parseFloat(formData.montoTotal) || 0,
            notas_tecnicas: formData.notasTecnicas,
            resumen_ia: resumenIA,
            evidencia_url: mediaPublicUrl,
            estado: 'Pendiente'
          }
        ])
        .select()
        .single();

      if (dbError) throw new Error('Error en BD: ' + dbError.message);

      setStatusText('4/4 Enviando notificación con Webhook...');
      if (process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL) {
        await fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            presupuestoId: dbData.id,
            cliente: formData.clienteNombre,
            telefono: formData.clienteTelefono,
            vehiculo: `${formData.vehiculoModelo} (${formData.vehiculoPlaca})`,
            monto: formData.montoTotal,
            resumenExplicativo: resumenIA,
            evidenciaUrl: mediaPublicUrl
          })
        });
      }

      setStep(3);
    } catch (err: any) {
      alert(err.message || 'Error durante el proceso');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const resetForm = () => {
    setFormData({
      clienteNombre: '',
      clienteTelefono: '',
      vehiculoPlaca: '',
      vehiculoModelo: '',
      montoTotal: '',
      notasTecnicas: ''
    });
    setFile(null);
    setPreviewUrl(null);
    setStep(1);
  };

  // 1. Pantalla de Carga Inicial
  if (verificandoAcceso) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Verificando permisos...
        </p>
      </div>
    );
  }

  // 2. Pantalla de Cuenta Pendiente de Aprobación
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

  // 3. Formulario Completo (Mecánico Aprobado)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-md mx-auto border-x border-slate-800">
      
      {/* HEADER MÓVIL */}
      <header className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">Recepción Móvil</h1>
            <p className="text-xs text-slate-400">Módulo del Mecánico</p>
          </div>
        </div>
        <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-medium">
          Paso {step} de 3
        </span>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-5 flex flex-col justify-between">
        
        {/* PASO 1 */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" /> Datos del Cliente
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Ingresa la información básica de contacto</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.clienteNombre}
                  onChange={(e) => setFormData({...formData, clienteNombre: e.target.value})}
                  placeholder="Ej. Carlos Mendoza" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / Telegram ID</label>
                <input 
                  type="tel" 
                  value={formData.clienteTelefono}
                  onChange={(e) => setFormData({...formData, clienteTelefono: e.target.value})}
                  placeholder="Ej. +584120000000" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-400" /> Datos del Vehículo
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Placa y detalles del automóvil</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Placa</label>
                <input 
                  type="text" 
                  value={formData.vehiculoPlaca}
                  onChange={(e) => setFormData({...formData, vehiculoPlaca: e.target.value.toUpperCase()})}
                  placeholder="AB123CD" 
                  className="w-full uppercase bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo / Año</label>
                <input 
                  type="text" 
                  value={formData.vehiculoModelo}
                  onChange={(e) => setFormData({...formData, vehiculoModelo: e.target.value})}
                  placeholder="Toyota Corolla '18" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!formData.clienteNombre || !formData.vehiculoPlaca}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" /> Captura de Evidencias
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Toma la foto o video del daño en vivo desde la cámara</p>
            </div>

            <div className="relative">
              <input 
                type="file" 
                accept="image/*,video/*" 
                capture="environment"
                onChange={handleFileChange}
                id="cameraInput"
                className="hidden"
              />
              <label 
                htmlFor="cameraInput" 
                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900 rounded-2xl cursor-pointer transition-all p-4 text-center"
              >
                {previewUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img src={previewUrl} alt="Vista previa" className="h-full object-contain rounded-lg" />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full">
                      Capturado ✓
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-full mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">Presiona para abrir la cámara</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Formatos: Foto o Video del daño</span>
                  </>
                )}
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Monto Total Estimado ($USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.montoTotal}
                  onChange={(e) => setFormData({...formData, montoTotal: e.target.value})}
                  placeholder="0.00" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-lg font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Notas Técnicas para IA</span>
                  <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini 2.5 Flash
                  </span>
                </label>
                <textarea 
                  rows={3}
                  value={formData.notasTecnicas}
                  onChange={(e) => setFormData({...formData, notasTecnicas: e.target.value})}
                  placeholder="Ej. Pastillas de freno desgastadas al 90%, disco rayado requiere rectificación urgente." 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {loading && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-xs text-indigo-300 font-medium">{statusText}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-1/3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" /> Volver
              </button>
              <button 
                type="submit" 
                disabled={loading || !formData.montoTotal}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-emerald-600/20"
              >
                {loading ? 'Procesando...' : 'Generar y Enviar'} <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASO 3 */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center text-center my-auto space-y-4 animate-in zoom-in-95 duration-300">
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-white">¡Presupuesto Enviado!</h2>
            <p className="text-xs text-slate-400 max-w-xs">
              El diagnóstico procesado por la Inteligencia Artificial y las evidencias han sido transmitidas exitosamente por Telegram/WhatsApp.
            </p>
            <button 
              onClick={resetForm}
              className="mt-6 w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold py-3.5 rounded-xl transition-all text-sm"
            >
              Registrar Nuevo Vehículo
            </button>
          </div>
        )}

      </main>
    </div>
  );
}