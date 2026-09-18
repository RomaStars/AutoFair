'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Presupuesto {
  id: string;
  monto_total: number;
  estado: string;
  creado_en: string;
}

export default function DashboardPage() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);

  useEffect(() => {
    // A. Cargar los presupuestos iniciales
    const fetchPresupuestos = async () => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Detalle del error:', error.message, error.details, error.hint);
      } else {
        setPresupuestos(data || []);
      }
    };

    fetchPresupuestos();

    // B. Suscribirse a cambios en tiempo real vía WebSockets
    const canal = supabase
      .channel('cambios-presupuestos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presupuestos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPresupuestos((prev) => [payload.new as Presupuesto, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPresupuestos((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as Presupuesto) : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPresupuestos((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // C. Limpiar la suscripción al desmontar el componente
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard de Presupuestos (Realtime)</h1>
      
      <div className="bg-gray-900 text-white rounded-lg p-4">
        {presupuestos.length === 0 ? (
          <p className="text-gray-400">No hay presupuestos registrados aún.</p>
        ) : (
          <ul className="divide-y divide-gray-700">
            {presupuestos.map((item) => (
              <li key={item.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-xs text-gray-300">ID: {item.id}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(item.creado_en).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-green-400 font-bold">${item.monto_total}</span>
                  <span className="ml-3 px-2 py-1 text-xs bg-gray-700 rounded">
                    {item.estado}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}