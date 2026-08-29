import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client'; // Ajusta la ruta si es necesario según tu ubicación exacta

export async function GET() {
  try {
    const products = await runQuery(async (db) => {
      return await db.sql(`SELECT id, name, barcode, price_usd, stock, taxable, category, cost_price, image_url FROM products`);
    });

    const formattedProducts = Array.isArray(products) ? products.map((p: any) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode || '',
      price: Number(p.price_usd || 0),
      stock: Number(p.stock || 0),
      taxable: p.taxable !== undefined ? Boolean(p.taxable) : true,
      category: p.category || 'General',
      costPrice: Number(p.cost_price || 0),
      image_url: p.image_url || '' // 👈 Campo de imagen integrado
    })) : [];

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error("Error en GET /api/products:", error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, stock, taxable, barcode, category, costPrice, image_url } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ success: false, error: 'Nombre y precio son obligatorios' }, { status: 400 });
    }

    const generatedBarcode = barcode || '759' + Math.floor(100000000 + Math.random() * 900000000);
    const finalStock = stock !== undefined ? Number(stock) : 0;
    const finalTaxable = taxable ? 1 : 0;
    const finalCategory = category || 'General';
    const finalCost = costPrice !== undefined ? Number(costPrice) : 0;
    const finalImageUrl = image_url || ''; // 👈 Valor por defecto si no se ingresa enlace

    await runQuery(async (db) => {
      return await db.sql(`
        INSERT INTO products (name, barcode, price_usd, stock, taxable, category, cost_price, image_url) 
        VALUES ('${name}', '${generatedBarcode}', ${price}, ${finalStock}, ${finalTaxable}, '${finalCategory}', ${finalCost}, '${finalImageUrl}')
      `);
    });

    return NextResponse.json({ success: true, message: 'Producto registrado con éxito' });
  } catch (error: any) {
    console.error("Error en POST /api/products:", error);
    return NextResponse.json({ success: false, error: error.message || 'Error al guardar el producto' }, { status: 500 });
  }
}
