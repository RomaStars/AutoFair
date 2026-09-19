// app/api/aprobar-mecanico/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { solicitudId, email, password, nombre, telefono, experiencia } = await req.json();

    let userId: string;

    // 1. Intentar crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre }
    });

    if (authError) {
      // Si el usuario ya existe en Auth, obtenemos su ID mediante consulta de administración
      if (authError.message.includes('already been registered')) {
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData?.users.find((u) => u.email === email);

        if (!existingUser || listError) {
          return NextResponse.json({ error: 'El usuario ya existe pero no se pudo obtener su información.' }, { status: 400 });
        }

        userId = existingUser.id;
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    } else {
      userId = authData.user.id;
    }

    // 2. Insertar o actualizar perfil con rol MECANICO y estado ACTIVO
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .upsert(
        {
          id: userId,
          nombre,
          rol: 'MECANICO',
          estado: 'ACTIVO',
        },
        { onConflict: 'id' }
      );

    if (perfilError) throw perfilError;

    // 3. Insertar o actualizar registro en la tabla 'mecanicos'
    const { error: mecanicoError } = await supabaseAdmin
      .from('mecanicos')
      .upsert(
        {
          nombre,
          telefono_whatsapp: telefono,
          especialidad: experiencia,
          usuario_id: userId
        },
        { onConflict: 'usuario_id' }
      );

    if (mecanicoError) throw mecanicoError;

    // 4. Actualizar estado de la solicitud a APROBADO
    const { error: updateError } = await supabaseAdmin
      .from('solicitudes_mecanicos')
      .update({ estado: 'APROBADO' })
      .eq('id', solicitudId);

    if (updateError) throw updateError;

    return NextResponse.json({ message: 'Mecánico aprobado y registrado exitosamente' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}