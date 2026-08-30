import { NextResponse } from 'next/server';
import { Database } from '@sqlitecloud/drivers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, orderType, items, total, totalBs, exchangeRate, paymentMethod } = body;

    // Acepta cualquiera de las dos variables de entorno configuradas en Vercel
    const connectionString = process.env.DATABASE_URL || process.env.SQLITECLOUD_CONNECTION_STRING;
    
    if (!connectionString) {
      console.error('Falta configurar la cadena de conexión en Vercel');
      return NextResponse.json({ error: 'Falta configurar la conexión a SQLite Cloud' }, { status: 500 });
    }

    const db = new Database(connectionString);

    // Inserción limpia adaptada a tu tabla sales
    const query = `
      INSERT INTO sales (total_usd, total_ves, exchange_rate, payment_method, created_at) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
    `;
    
    await db.sql(query, [
      Number(total) || 0,
      Number(totalBs) || 0,
      Number(exchangeRate) || 65.50,
      paymentMethod || 'Efectivo / Divisas'
    ]);

    return NextResponse.json({ success: true, message: 'Venta registrada correctamente en el sistema' });
  } catch (error: any) {
    console.error('Error al guardar el pedido en la BD:', error);
    return NextResponse.json({ error: error.message || 'Error interno al procesar el pedido' }, { status: 500 });
  }
}
