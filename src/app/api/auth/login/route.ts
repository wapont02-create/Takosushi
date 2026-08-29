import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const cleanEmail = String(email || '')
      .trim()
      .toLowerCase();

    console.log('========== LOGIN ==========');
    console.log('EMAIL:', cleanEmail);

    const result = await runQuery(async (db) => {
      return await db.sql(`
        SELECT
          id,
          name,
          email,
          password_hash,
          role,
          is_active
        FROM users
        LIMIT 10
      `);
    });

    console.log('RESULTADO USERS:', result);

    let rows: any[] = [];

    if (Array.isArray(result)) {
      rows = result;
    } else if (result && Array.isArray(result.rows)) {
      rows = result.rows;
    } else if (result && Array.isArray(result.data)) {
      rows = result.data;
    }

    console.log('USUARIOS ENCONTRADOS:', rows.length);
    console.log('USUARIOS:', rows);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'La base de datos no contiene usuarios.',
        },
        { status: 401 }
      );
    }

    const user = rows.find(
      (u) =>
        String(u.email || '')
          .trim()
          .toLowerCase() === cleanEmail
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado en la base de datos.',
        },
        { status: 401 }
      );
    }

    console.log('USUARIO ENCONTRADO:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      hasHash: !!user.password_hash,
    });

    if (
      user.is_active === 0 ||
      user.is_active === false ||
      user.is_active === '0'
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Este usuario está desactivado.',
        },
        { status: 403 }
      );
    }

    const passwordHash = String(
      user.password_hash || ''
    ).trim();

    if (!passwordHash) {
      return NextResponse.json(
        {
          success: false,
          message: 'El usuario no tiene contraseña configurada.',
        },
        { status: 500 }
      );
    }

    const validPassword = await bcrypt.compare(
      String(password || ''),
      passwordHash
    );

    console.log('PASSWORD CORRECTA:', validPassword);

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Correo o contraseña incorrectos.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Acceso autorizado',
      user: {
        id: Number(user.id),
        name: String(user.name || ''),
        email: String(user.email || ''),
        role: String(user.role || 'cajero'),
      },
    });

  } catch (error: any) {
    console.error('ERROR LOGIN:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message || 'Error interno del servidor.',
      },
      { status: 500 }
    );
  }
}
