import { NextResponse } from 'next/server';
import { runQuery } from '../../../../db/client'; // Ajusta la ruta si es necesario

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const body = await request.json();
    const { stock } = body;

    if (stock === undefined) {
      return NextResponse.json({ success: false, error: 'Falta el campo stock' }, { status: 400 });
    }

    await runQuery(async (db) => {
      return await db.sql(`UPDATE products SET stock = ${stock} WHERE id = ${id};`);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Stock actualizado correctamente' 
    });

  } catch (error: any) {
    console.error("Error al actualizar stock:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al actualizar' }, 
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
