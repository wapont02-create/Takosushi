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

    // Consulta adaptada con los 6 campos correspondientes a la estructura de tu tabla sales
    const query = `
      INSERT INTO sales (customer_id, total_usd, payment_method, cash_register_id, total_ves, exchange_rate) 
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    
    await db.sql(query, [
      null,                           // customer_id (opcional/nulo si es pedido web rápido)
      Number(total) || 0,             // total_usd
      paymentMethod || 'Efectivo / Divisas', // payment_method
      null,                           // cash_register_id (opcional/nulo)
      Number(totalBs) || 0,           // total_ves
      Number(exchangeRate) || 65.50   // exchange_rate
    ]);

    return NextResponse.json({ success: true, message: 'Venta registrada correctamente en SQLite Cloud' });
  } catch (error: any) {
    console.error('Error al guardar el pedido en la BD:', error);
    return NextResponse.json({ error: error.message || 'Error interno al procesar el pedido' }, { status: 500 });
  }
}
