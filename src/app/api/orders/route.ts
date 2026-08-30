import { NextResponse } from 'next/server';
import { Client } from '@libsql/client';

const db = Client({
  url: process.env.DATABASE_URL || '',
  authToken: process.env.DATABASE_AUTH_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, orderType, items, total } = body;

    // Asegurar que la tabla existe con las columnas necesarias
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT,
        orderType TEXT,
        items TEXT,
        total REAL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertar el pedido en la base de datos
    await db.execute({
      sql: 'INSERT INTO sales (customerName, orderType, items, total) VALUES (?, ?, ?, ?)',
      args: [
        customerName || 'Cliente Web',
        orderType || 'Local',
        JSON.stringify(items || []),
        Number(total) || 0
      ]
    });

    return NextResponse.json({ success: true, message: 'Pedido registrado correctamente' });
  } catch (error) {
    console.error('Error al guardar el pedido:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
