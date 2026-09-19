// app/api/sintesis/route.ts

import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  let bodyNotas = '';

  try {
    const { notasTecnicas } = await req.json();
    bodyNotas = notasTecnicas || '';

    const prompt = `Actúa como un asesor de servicio automotriz profesional. Convierte estas notas técnicas breves tomadas por un mecánico en un texto explicativo claro, amable y comprensible para un cliente que no sabe de mecánica:\n\n${bodyNotas}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return NextResponse.json({ resumen: response.text });
  } catch (error: any) {
    console.error('Error al generar síntesis con Gemini:', error);

    // Fallback: Si Gemini falla (p. ej. error 503 por alta demanda),
    // devolvemos las notas originales para que el usuario no se quede bloqueado.
    return NextResponse.json({ 
      resumen: bodyNotas || 'No se pudo generar la síntesis automática.' 
    });
  }
}