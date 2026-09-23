//app/api/enviar-presupuesto/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase con Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.json();

    // 1. Limpiar el teléfono recibido
    const telefonoLimpio = formData.clienteTelefono
      ? formData.clienteTelefono.replace("+", "").replace(/ /g, "").trim()
      : '';

    // 2. Consultar si el cliente existe en la tabla 'clientes'
    const { data: cliente, error: supabaseError } = await supabaseAdmin
      .from('clientes')
      .select('telegram_chat_id')
      .eq('telefono_telegram', telefonoLimpio)
      .maybeSingle();

    if (supabaseError) {
      console.warn('Advertencia en consulta Supabase:', supabaseError.message);
    }

    // 3. Determinar Chat ID
    const chatIdReal = cliente?.telegram_chat_id || telefonoLimpio;

    // 4. Armar el payload a enviar a n8n
    const payloadN8n = {
      ...formData,
      chat_id: chatIdReal,
    };

    // 5. Enviar los datos al Webhook de n8n
    // Reemplaza directamente la cadena entre comillas si no estás usando variables de entorno aún
    const WEBHOOK_N8N_URL = process.env.N8N_PRESUPUESTO_WEBHOOK_URL;

    const responseN8n = await fetch(WEBHOOK_N8N_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadN8n),
    });

    if (!responseN8n.ok) {
      const errorText = await responseN8n.text();
      throw new Error(`Error en Webhook n8n (${responseN8n.status}): ${errorText}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Presupuesto procesado y enviado a n8n correctamente',
      chatIdUsado: chatIdReal
    });

  } catch (error: any) {
    console.error('Error en /api/enviar-presupuesto:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}