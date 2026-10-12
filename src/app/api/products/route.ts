
import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client';

async function ensureActiveColumn(db: any) {
  const columns = await db.sql(`PRAGMA table_info(products)`);
  const exists =
    Array.isArray(columns) &&
    columns.some((column: any) => String(column.name).toLowerCase() === 'active');

  if (exists) return;

  try {
    await db.sql(`
      ALTER TABLE products
      ADD COLUMN active INTEGER NOT NULL DEFAULT 1
    `);
  } catch (error) {
    // Si otra solicitud creó la columna al mismo tiempo, verificamos de nuevo.
    const updatedColumns = await db.sql(`PRAGMA table_info(products)`);
    const created =
      Array.isArray(updatedColumns) &&
      updatedColumns.some(
        (column: any) => String(column.name).toLowerCase() === 'active'
      );

    if (!created) throw error;
  }
}

export async function GET() {
  try {
    const products = await runQuery(async (db) => {
      await ensureActiveColumn(db);

      return await db.sql(`
        SELECT
          p.id,
          p.name,
          p.barcode,
          p.price_usd,
          p.stock,
          p.taxable,
          p.category,
          p.cost_price,
          p.image_url,
          p.description,
          COALESCE(p.active, 1) AS active,
          EXISTS (
            SELECT 1
            FROM sale_items si
            WHERE si.product_id = p.id
          ) AS has_sales
        FROM products p
        ORDER BY p.id DESC
      `);
    });

    const formattedProducts = Array.isArray(products)
      ? products.map((p: any) => ({
          id: Number(p.id),
          name: p.name,
          barcode: p.barcode || '',
          price: Number(p.price_usd || 0),
          stock: Number(p.stock || 0),
          taxable: p.taxable !== undefined ? Boolean(p.taxable) : true,
          category: p.category || 'General',
          costPrice: Number(p.cost_price || 0),
          description: p.description || '',
          image: p.image_url || '',
          active: Number(p.active ?? 1) === 1,
          hasSales: Number(p.has_sales || 0) === 1,
        }))
      : [];

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('Error en GET /api/products:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      price,
      stock,
      taxable,
      barcode,
      category,
      costPrice,
      description,
      image,
      image_url,
    } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nombre y precio son obligatorios',
        },
        { status: 400 }
      );
    }

    const generatedBarcode =
      barcode || '759' + Math.floor(100000000 + Math.random() * 900000000);
    const finalStock = stock !== undefined ? Number(stock) : 0;
    const finalTaxable = taxable ? 1 : 0;
    const finalCategory = category || 'General';
    const finalCost = costPrice !== undefined ? Number(costPrice) : 0;
    const finalDescription = String(description || '').trim();
    const finalImageUrl = String(image_url || image || '').trim();

    const escapeSql = (value: string) => value.replace(/'/g, "''");

    const cleanName = escapeSql(String(name).trim());
    const cleanBarcode = escapeSql(String(generatedBarcode).trim());
    const cleanCategory = escapeSql(String(finalCategory).trim());
    const cleanDescription = escapeSql(finalDescription);
    const cleanImageUrl = escapeSql(finalImageUrl);

    await runQuery(async (db) => {
      await ensureActiveColumn(db);

      return await db.sql(`
        INSERT INTO products (
          name,
          barcode,
          price_usd,
          stock,
          taxable,
          category,
          cost_price,
          image_url,
          description,
          active
        )
        VALUES (
          '${cleanName}',
          '${cleanBarcode}',
          ${Number(price) || 0},
          ${finalStock},
          ${finalTaxable},
          '${cleanCategory}',
          ${finalCost},
          '${cleanImageUrl}',
          '${cleanDescription}',
          1
        )
      `);
    });

    return NextResponse.json({
      success: true,
      message: 'Producto registrado con éxito',
      image: finalImageUrl,
      image_url: finalImageUrl,
      description: finalDescription,
      active: true,
    });
  } catch (error: any) {
    console.error('Error en POST /api/products:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al guardar el producto',
      },
      { status: 500 }
    );
  }
}
