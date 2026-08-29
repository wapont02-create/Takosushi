import { NextResponse } from 'next/server';
import { Database } from '@sqlitecloud/drivers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, orderType, items, total } = body;

    const connectionString = process.env.SQLITECLOUD_CONNECTION_STRING;
    if (!connectionString) {
      return NextResponse.json({ error: 'Falta configurar la conexión a SQLite Cloud' }, { status: 500 });
    }

    const db = new Database(connectionString);

    // Guardar la venta en la base de datos (con estado pendiente de aprobación)
    const query = `
      INSERT INTO sales (customer_name, order_type, total, status, created_at) 
      VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP);
    `;
    
    // Ejecutamos la inserción principal del pedido
    await db.sql(query, [customerName, orderType, total]);

    return NextResponse.json({ success: true, message: 'Pedido registrado correctamente' });
  } catch (error: any) {
    console.error('Error al guardar el pedido:', error);
    return NextResponse.json({ error: error.message || 'Error interno al procesar el pedido' }, { status: 500 });
  }
}
