import { NextResponse } from 'next/server';
import { Database } from '@sqlitecloud/drivers';

export const dynamic = 'force-dynamic';

// GET: Listar pedidos cerrando la conexión al terminar
export async function GET() {
  let db: any = null;
  try {
    const connectionString = process.env.DATABASE_URL || process.env.SQLITECLOUD_CONNECTION_STRING;
    
    if (!connectionString) {
      return NextResponse.json({ error: 'Falta configurar la conexión' }, { status: 500 });
    }

    db = new Database(connectionString);
    const result = await db.sql("SELECT * FROM sales WHERE status = 'pendiente' OR status IS NULL OR status = '' ORDER BY id DESC;");
    
    // Cerramos la conexión explícitamente para no agotar el límite
    await db.close();

    return NextResponse.json({ success: true, orders: result });
  } catch (error: any) {
    if (db) {
      try { await db.close(); } catch (e) {}
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Cambiar estatus y cerrar la conexión al terminar
export async function PUT(request: Request) {
  let db: any = null;
  try {
    const { id, status } = await request.json();
    const connectionString = process.env.DATABASE_URL || process.env.SQLITECLOUD_CONNECTION_STRING;
    
    if (!connectionString) {
      return NextResponse.json({ error: 'Falta configurar la conexión' }, { status: 500 });
    }

    db = new Database(connectionString);
    await db.sql(`UPDATE sales SET status = '${status}' WHERE id = ${id};`);
    
    // Cerramos la conexión explícitamente
    await db.close();

    return NextResponse.json({ success: true, message: `Pedido actualizado a ${status}` });
  } catch (error: any) {
    if (db) {
      try { await db.close(); } catch (e) {}
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
