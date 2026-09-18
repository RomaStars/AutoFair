import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { notasTecnicas } = await req.json();
    const prompt = `Actúa como un asesor de servicio automotriz profesional. Convierte estas notas técnicas breves tomadas por un mecánico en un texto explicativo claro, amable y comprensible para un cliente que no sabe de mecánica:\n\n${notasTecnicas}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ resumen: response.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}