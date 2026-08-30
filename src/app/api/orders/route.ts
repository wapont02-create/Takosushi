import { NextResponse } from 'next/server';
import { Database } from '@sqlitecloud/drivers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total, totalBs, exchangeRate, paymentMethod } = body;

    const connectionString = process.env.DATABASE_URL || process.env.SQLITECLOUD_CONNECTION_STRING;
    
    if (!connectionString) {
      return NextResponse.json({ error: 'Falta configurar la conexión a SQLite Cloud' }, { status: 500 });
    }

    const db = new Database(connectionString);

    // Limpieza y conversión segura de valores
    const numTotal = Number(total) || 0;
    const numTotalBs = Number(totalBs) || 0;
    const numExchange = Number(exchangeRate) || 65.50;
    const cleanPayment = String(paymentMethod || 'Efectivo / Divisas').replace(/'/g, "''");

    // Consulta directa sin parámetros (?, ?) para evitar cualquier error de binding en SQLite Cloud
    const query = `
      INSERT INTO sales (total_usd, total_ves, exchange_rate, payment_method) 
      VALUES (${numTotal}, ${numTotalBs}, ${numExchange}, '${cleanPayment}');
    `;
    
    await db.sql(query);

    return NextResponse.json({ success: true, message: 'Venta registrada correctamente' });
  } catch (error: any) {
    console.error('Error al guardar el pedido en la BD:', error);
    return NextResponse.json({ error: error.message || 'Error interno al procesar el pedido' }, { status: 500 });
  }
}
