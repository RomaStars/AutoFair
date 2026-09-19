'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, 
  Bot, 
  Zap, 
  Lock, 
  UserCheck, 
  Smartphone, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Eye, 
  EyeOff,
  Sparkles,
  Globe,
  Database,
  Workflow,
  Cpu,
  CheckCircle2
} from 'lucide-react';

export default function AutoFairLandingPage() {
  const router = useRouter();
  
  // Estados para Modal de Login
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'admin' | 'mecanico'>('mecanico');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Formulario de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const stackTecnologico = [
    {
      categoria: "Frontend & UI",
      icono: <Globe className="w-6 h-6 text-indigo-400" />,
      tecnologia: "Next.js 14+ / React & Tailwind CSS",
      descripcion: "Interfaz web moderna, responsiva y optimizada alojada en Vercel. Ofrece actualización en tiempo real para el Dashboard."
    },
    {
      categoria: "Backend & Base de Datos",
      icono: <Database className="w-6 h-6 text-emerald-400" />,
      tecnologia: "Supabase (PostgreSQL & Storage)",
      descripcion: "Persistencia de datos relacional para vehículos, presupuestos y mecánicos. Incluye Supabase Realtime y Storage para fotografías/videos."
    },
    {
      categoria: "Inteligencia Artificial",
      icono: <Bot className="w-6 h-6 text-purple-400" />,
      tecnologia: "Google Gemini API",
      descripcion: "Motor de IA encargado de procesar y sintetizar observaciones técnicas complejas en explicaciones claras para el cliente."
    },
    {
      categoria: "Automatización & Mensajería",
      icono: <Workflow className="w-6 h-6 text-amber-400" />,
      tecnologia: "n8n & Telegram Bot API",
      descripcion: "Orquestador de eventos que envía presupuestos con Inline Keyboards (botones) y enruta las respuestas de los clientes al taller."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* ==================== NAVBAR ==================== */}
      <header className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md fixed w-full z-40 top-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Auto<span className="text-indigo-500">Fair</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
          <a href="#como-funciona" className="hover:text-indigo-400 transition-colors">¿Cómo Funciona?</a>
          <a href="#caracteristicas" className="hover:text-indigo-400 transition-colors">Características</a>
          <a href="#arquitectura" className="hover:text-indigo-400 transition-colors">Tecnología</a>
        </div>

        <button 
  onClick={() => router.push('/login')}
  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95"
>
  <Lock className="w-4 h-4" /> Iniciar sesion
</button>
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="pt-36 pb-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8 shadow-inner">
          <Sparkles className="w-4 h-4" /> Diagnósticos Automotrices Optimizados con IA & Telegram
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
          Presupuestos mecánicos en segundos, <br/>
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            aprobaciones al instante en el móvil
          </span>
        </h1>
        
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Transforma las notas técnicas del taller en diagnósticos transparentes con Inteligencia Artificial. Envía evidencias fotográficas y recibe confirmaciones en tiempo real.
        </p>


        {/* METRICAS RÁPIDAS */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl pt-10 border-t border-slate-900">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-3xl font-extrabold text-white">100%</p>
            <p className="text-xs text-slate-400 mt-1">Responsivo (Mobile-First)</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-3xl font-extrabold text-indigo-400">&lt; 10s</p>
            <p className="text-xs text-slate-400 mt-1">Síntesis con IA (Gemini)</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-3xl font-extrabold text-white">Realtime</p>
            <p className="text-xs text-slate-400 mt-1">Suscripción WebSockets</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <p className="text-3xl font-extrabold text-indigo-400">Telegram</p>
            <p className="text-xs text-slate-400 mt-1">Mensajes de Aprobación</p>
          </div>
        </div>
      </section>

      {/* ==================== CARACTERÍSTICAS PRINCIPALES ==================== */}
      <section id="caracteristicas" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Diseñado para la máxima eficiencia</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto text-sm md:text-base">
              Una suite de herramientas optimizada tanto para la recepción en movimiento como para la gestión administrativa central.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Recepción Móvil en Taller</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Los mecánicos registran clientes, vehículos y capturan fotos o videos de fallas directamente desde la cámara de sus smartphones en movilidad.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                  <Bot className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Traducción de Fallas con IA</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Google Gemini Flash interpreta las notas técnicas dispersas del mecánico y las convierte en un presupuesto redactado amigablemente para el cliente.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Administración Centralizada</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Panel exclusivo para el Administrador que permite dar de alta, editar o revocar el acceso a los mecánicos de forma segura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== DIAGRAMA DE FLUJO ==================== */}
      <section id="como-funciona" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Flujo de Trabajo Automatizado</h2>
          <p className="text-slate-400 mt-2">Cómo se conectan los componentes desde la captura hasta la respuesta.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Paso 1</span>
            <h4 className="text-lg font-bold text-white mt-1 mb-2">Captura Móvil</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              El mecánico asignado llena los datos del vehículo y sube evidencias a Supabase Storage.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Paso 2</span>
            <h4 className="text-lg font-bold text-white mt-1 mb-2">Síntesis con IA</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              La API de Gemini resume la falla en un mensaje comprensible y amigable.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Paso 3</span>
            <h4 className="text-lg font-bold text-white mt-1 mb-2">Orquestación n8n</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              El webhook activa el bot interactivo enviando el presupuesto detallado al cliente.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 text-left">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Paso 4</span>
            <h4 className="text-lg font-bold text-white mt-1 mb-2">Realtime Sync</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              La aprobación actualiza la base de datos y refresca la pantalla del mecánico al instante.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== SECCIÓN DE TECNOLOGÍA (#arquitectura) ==================== */}
      <section id="arquitectura" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-3">
              <Cpu className="w-4 h-4" /> Stack Tecnológico
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Arquitectura e Integración</h2>
            <p className="text-slate-400 mt-2 max-w-xl mx-auto text-sm md:text-base">
              Tecnologías de vanguardia desacopladas mediante eventos e integraciones seguras.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {stackTecnologico.map((item, index) => (
              <div 
                key={index} 
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      {item.icono}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{item.categoria}</span>
                      <h3 className="text-lg font-bold text-white">{item.tecnologia}</h3>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Beneficios Clave de la Arquitectura
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-xs md:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Despliegue contínuo en Vercel desacoplado del backend.
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Transmisión cifrada de datos e imágenes vía HTTPS/Webhooks.
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Suscripciones WebSockets mediante Supabase Realtime.
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Respuestas estructuradas en JSON con Gemini para optimizar consumo.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-10 text-center text-slate-500 text-xs border-t border-slate-900 bg-slate-950">
        <div className="flex justify-center items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-white text-sm">AutoFair</span>
        </div>
        <p>© 2026 AutoFair — Plataforma de Gestión y Diagnóstico Automotriz en Tiempo Real.</p>
      </footer>

    </div>
  );
}