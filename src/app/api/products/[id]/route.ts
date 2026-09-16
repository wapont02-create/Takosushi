import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client'; // Ajusta la ruta si es necesario

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || !/^\d+$/.test(String(id))) {
      return NextResponse.json(
        { success: false, error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

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

    // Mantener compatibilidad con el reabastecimiento existente:
    // si solo llega stock, actualizamos únicamente el stock.
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

      await runQuery(async (db) => {
        return await db.sql(
          `UPDATE products SET stock = ${finalStock} WHERE id = ${Number(id)};`
        );
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

    if (!finalName || !Number.isFinite(finalPrice) || !Number.isFinite(finalStock)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nombre, precio o stock inválido',
        },
        { status: 400 }
      );
    }

    const cleanName = finalName.replace(/'/g, "''");
    const cleanCategory = finalCategory.replace(/'/g, "''");
    const cleanDescription = finalDescription.replace(/'/g, "''");
    const cleanImageUrl = finalImageUrl.replace(/'/g, "''");
    const cleanBarcode = finalBarcode.replace(/'/g, "''");

    await runQuery(async (db) => {
      return await db.sql(`
        UPDATE products SET
          name = '${cleanName}',
          price_usd = ${finalPrice},
          stock = ${finalStock},
          taxable = ${finalTaxable},
          category = '${cleanCategory}',
          cost_price = ${Number.isFinite(finalCost) ? finalCost : 0},
          image_url = '${cleanImageUrl}',
          description = '${cleanDescription}'
          ${finalBarcode ? `, barcode = '${cleanBarcode}'` : ''}
        WHERE id = ${Number(id)};
      `);
    });

    return NextResponse.json({
      success: true,
      message: 'Producto actualizado correctamente',
      description: finalDescription,
    });
  } catch (error: any) {
    console.error('Error al actualizar el producto:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno al actualizar',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta el ID del producto' }, { status: 400 });
    }

    await runQuery(async (db) => {
      return await db.sql(`DELETE FROM products WHERE id = ${id};`);
    });

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado correctamente de la base de datos'
    });

  } catch (error: any) {
    console.error("Error al eliminar el producto:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al eliminar' },
      { status: 500 }
    );
  }
}
