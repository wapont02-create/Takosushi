
import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

function isValidId(id: string) {
  return /^\d+$/.test(id) && Number(id) > 0;
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
    } = body;

    // Mantener compatibilidad con el reabastecimiento de inventario.
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
      image_url === undefined;

    if (hasOnlyStock) {
      const finalStock = Number(stock);

      if (!Number.isFinite(finalStock) || finalStock < 0) {
        return NextResponse.json(
          { success: false, error: 'Stock inválido' },
          { status: 400 }
        );
      }

      await runQuery(async (db) =>
        db.sql(`
          UPDATE products
          SET stock = ${finalStock}
          WHERE id = ${productId};
        `)
      );

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
        {
          success: false,
          error: 'Nombre, precio, costo o stock inválido',
        },
        { status: 400 }
      );
    }

    const escapeSql = (value: string) => value.replace(/'/g, "''");

    const cleanName = escapeSql(finalName);
    const cleanCategory = escapeSql(finalCategory);
    const cleanDescription = escapeSql(finalDescription);
    const cleanImageUrl = escapeSql(finalImageUrl);
    const cleanBarcode = escapeSql(finalBarcode);

    await runQuery(async (db) =>
      db.sql(`
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
        WHERE id = ${productId};
      `)
    );

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

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    const productId = Number(id);

    await runQuery(async (db) =>
      db.sql(`DELETE FROM products WHERE id = ${productId};`)
    );

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado correctamente de la base de datos',
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Error interno al eliminar';

    console.error('Error al eliminar el producto:', error);

    if (/foreign key constraint failed/i.test(message)) {
      return NextResponse.json(
        {
          success: false,
          code: 'PRODUCT_HAS_REFERENCES',
          error:
            'No se puede eliminar este producto porque está relacionado con ventas u otros registros. Conserva el producto para proteger el historial.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: message || 'Error interno al eliminar' },
      { status: 500 }
    );
  }
}
