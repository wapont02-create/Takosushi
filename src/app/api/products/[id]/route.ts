
import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

function isValidId(id: string) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

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
    const updatedColumns = await db.sql(`PRAGMA table_info(products)`);
    const created =
      Array.isArray(updatedColumns) &&
      updatedColumns.some(
        (column: any) => String(column.name).toLowerCase() === 'active'
      );

    if (!created) throw error;
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    const productId = Number(id);
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
      active,
    } = body;

    const hasOnlyActive =
      active !== undefined &&
      name === undefined &&
      price === undefined &&
      stock === undefined &&
      taxable === undefined &&
      barcode === undefined &&
      category === undefined &&
      costPrice === undefined &&
      description === undefined &&
      image === undefined &&
      image_url === undefined;

    if (hasOnlyActive) {
      let activeValue: number;

      if (active === true || active === 1 || active === '1') {
        activeValue = 1;
      } else if (active === false || active === 0 || active === '0') {
        activeValue = 0;
      } else {
        return NextResponse.json(
          { success: false, error: 'Estado del producto inválido' },
          { status: 400 }
        );
      }

      await runQuery(async (db) => {
        await ensureActiveColumn(db);
        return db.sql(`
          UPDATE products
          SET active = ${activeValue}
          WHERE id = ${productId}
        `);
      });

      return NextResponse.json({
        success: true,
        active: activeValue === 1,
        message:
          activeValue === 1
            ? 'Producto activado correctamente'
            : 'Producto desactivado correctamente',
      });
    }

    const hasOnlyStock =
      stock !== undefined &&
      name === undefined &&
      price === undefined &&
      taxable === undefined &&
      barcode === undefined &&
      category === undefined &&
      costPrice === undefined &&
      description === undefined &&
      image === undefined &&
      image_url === undefined &&
      active === undefined;

    if (hasOnlyStock) {
      const finalStock = Number(stock);

      if (!Number.isFinite(finalStock) || finalStock < 0) {
        return NextResponse.json(
          { success: false, error: 'Stock inválido' },
          { status: 400 }
        );
      }

      await runQuery(async (db) => {
        await ensureActiveColumn(db);
        return db.sql(`
          UPDATE products
          SET stock = ${finalStock}
          WHERE id = ${productId}
        `);
      });

      return NextResponse.json({
        success: true,
        message: 'Stock actualizado correctamente',
      });
    }

    if (name === undefined || price === undefined || stock === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos obligatorios del producto',
        },
        { status: 400 }
      );
    }

    const finalName = String(name).trim();
    const finalPrice = Number(price);
    const finalStock = Number(stock);
    const finalTaxable = taxable ? 1 : 0;
    const finalCategory = String(category || 'General').trim();
    const finalCost = costPrice !== undefined ? Number(costPrice) : 0;
    const finalDescription = String(description || '').trim();
    const finalImageUrl = String(image_url || image || '').trim();
    const finalBarcode = String(barcode || '').trim();

    if (
      !finalName ||
      !Number.isFinite(finalPrice) ||
      finalPrice < 0 ||
      !Number.isFinite(finalStock) ||
      finalStock < 0 ||
      !Number.isFinite(finalCost) ||
      finalCost < 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Nombre, precio, costo o stock inválido' },
        { status: 400 }
      );
    }

    const escapeSql = (value: string) => value.replace(/'/g, "''");

    const cleanName = escapeSql(finalName);
    const cleanCategory = escapeSql(finalCategory);
    const cleanDescription = escapeSql(finalDescription);
    const cleanImageUrl = escapeSql(finalImageUrl);
    const cleanBarcode = escapeSql(finalBarcode);

    await runQuery(async (db) => {
      await ensureActiveColumn(db);

      return db.sql(`
        UPDATE products SET
          name = '${cleanName}',
          price_usd = ${finalPrice},
          stock = ${finalStock},
          taxable = ${finalTaxable},
          category = '${cleanCategory}',
          cost_price = ${finalCost},
          image_url = '${cleanImageUrl}',
          description = '${cleanDescription}'
          ${finalBarcode ? `, barcode = '${cleanBarcode}'` : ''}
        WHERE id = ${productId}
      `);
    });

    return NextResponse.json({
      success: true,
      message: 'Producto actualizado correctamente',
      description: finalDescription,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error interno al actualizar';

    console.error('Error al actualizar el producto:', error);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    const productId = Number(id);

    const result = await runQuery(async (db) => {
      await ensureActiveColumn(db);

      const existing = await db.sql(`
        SELECT id
        FROM products
        WHERE id = ${productId}
        LIMIT 1
      `);

      if (!Array.isArray(existing) || existing.length === 0) {
        return { action: 'not_found' };
      }

      const sales = await db.sql(`
        SELECT id
        FROM sale_items
        WHERE product_id = ${productId}
        LIMIT 1
      `);

      if (Array.isArray(sales) && sales.length > 0) {
        await db.sql(`
          UPDATE products
          SET active = 0
          WHERE id = ${productId}
        `);

        return { action: 'deactivated' };
      }

      try {
        await db.sql(`
          DELETE FROM products
          WHERE id = ${productId}
        `);

        return { action: 'deleted' };
      } catch (deleteError: any) {
        const message = String(deleteError?.message || deleteError);

        if (/foreign key constraint failed/i.test(message)) {
          await db.sql(`
            UPDATE products
            SET active = 0
            WHERE id = ${productId}
          `);

          return { action: 'deactivated' };
        }

        throw deleteError;
      }
    });

    if (result.action === 'not_found') {
      return NextResponse.json(
        { success: false, error: 'El producto no existe' },
        { status: 404 }
      );
    }

    if (result.action === 'deactivated') {
      return NextResponse.json({
        success: true,
        action: 'deactivated',
        active: false,
        message:
          'El producto tiene ventas u otras referencias. Se desactivó para conservar el historial.',
      });
    }

    return NextResponse.json({
      success: true,
      action: 'deleted',
      message: 'Producto eliminado definitivamente',
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error interno al eliminar';

    console.error('Error al eliminar el producto:', error);

    return NextResponse.json(
      { success: false, error: message || 'Error interno al eliminar' },
      { status: 500 }
    );
  }
}
