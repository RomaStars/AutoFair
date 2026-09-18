// app/api/admin/mecanicos/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Instancia con privilegios de Administrador de Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { nombre, especialidad, telefono_whatsapp, email, password } = await request.json();

    // 1. Crear el usuario Auth en Supabase
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'MECANICO', nombre }
    });

    if (authError) throw authError;

    // 2. Insertar en la tabla relacional 'mecanicos'
    const { data: mecanico, error: dbError } = await supabaseAdmin
      .from('mecanicos')
      .insert([
        {
          id: authUser.user.id, // Enlaza con el ID de Auth
          nombre,
          especialidad,
          telefono_whatsapp,
          email
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, data: mecanico });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}