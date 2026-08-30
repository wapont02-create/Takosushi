import { NextResponse } from 'next/server';
import { Database } from '@sqlitecloud/drivers';

// Fuerza a que la API sea dinámica y nunca guarde caché en Vercel
export const dynamic = 'force-dynamic';

// GET: Listar todos los pedidos pendientes
export async function GET() {
  try {
    const connectionString = process.env.DATABASE_URL || process.env.SQLITECLOUD_CONNECTION_STRING;
    
    if (!connectionString) {
      return NextResponse.json({ error: 'Falta configurar la conexión' }, { status: 500 });
    }

    const db = new Database(connectionString);
    const result = await db.sql("SELECT * FROM sales WHERE status = 'pendiente' OR status IS NULL OR status = '' ORDER BY id DESC;");
    
    return NextResponse.json({ success: true, orders: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Cambiar estatus a 'aprobado' o 'cancelado'
export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();
    const connectionString = process.env.DATABASE_URL || process.env.SQLITECLOUD_CONNECTION_STRING;
    
    if (!connectionString) {
      return NextResponse.json({ error: 'Falta configurar la conexión' }, { status: 500 });
    }

    const db = new Database(connectionString);
    await db.sql(`UPDATE sales SET status = '${status}' WHERE id = ${id};`);

    return NextResponse.json({ success: true, message: `Pedido actualizado a ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
