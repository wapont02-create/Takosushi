import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client';

export async function GET() {
  try {
    const result = await runQuery(async (db) => {
      return await db.sql(`
        SELECT
          id,
          user_id,
          opening_date,
          closing_date,
          opening_usd,
          opening_ves,
          closing_usd,
          closing_ves,
          status
        FROM cash_registers
        ORDER BY id DESC
        LIMIT 10;
      `);
    });

    const rows = Array.isArray(result)
      ? result
      : result?.rows || [];

    const openRegister = rows.find(
      (row: any) =>
        String(row.status).toLowerCase() === 'open'
    );

    return NextResponse.json({
      success: true,
      isOpen: !!openRegister,
      register: openRegister || null,
      rows,
    });

  } catch (error: any) {
    console.error('ERROR GET /api/cash:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error consultando las cajas',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      action,
      openingUSD,
      openingBs,
      countedUSD,
      countedBs,
      userId,
    } = body;

    // ==========================================
    // ABRIR CAJA
    // ==========================================

    if (action === 'open') {
      const usd = Number(openingUSD) || 0;
      const ves = Number(openingBs) || 0;
      // Blindaje: Si no viene userId o es inválido, usar 1 por defecto para evitar errores de base de datos
      const cleanUserId = Number(userId) || 1;

      // Buscar caja abierta
      const existing = await runQuery(async (db) => {
        return await db.sql(`
          SELECT id
          FROM cash_registers
          WHERE status = 'open'
          ORDER BY id DESC
          LIMIT 1;
        `);
      });

      const existingRows = Array.isArray(existing)
        ? existing
        : existing?.rows || [];

      if (existingRows.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Ya existe una caja abierta.',
          registerId: existingRows[0].id,
        });
      }

      // INSERTAR CAJA (Con usuario por defecto seguro)
      await runQuery(async (db) => {
        return await db.sql(
          `
          INSERT INTO cash_registers
          (
            user_id,
            opening_usd,
            opening_ves,
            status
          )
          VALUES (?, ?, ?, 'open');
          `,
          cleanUserId,
          usd,
          ves
        );
      });

      // VERIFICAR INMEDIATAMENTE
      const verification = await runQuery(async (db) => {
        return await db.sql(`
          SELECT
            id,
            user_id,
            opening_usd,
            opening_ves,
            status
          FROM cash_registers
          WHERE status = 'open'
          ORDER BY id DESC
          LIMIT 1;
        `);
      });

      const rows = Array.isArray(verification)
        ? verification
        : verification?.rows || [];

      if (rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'El INSERT se ejecutó pero la caja no aparece en la base de datos.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Caja abierta exitosamente.',
        register: rows[0],
      });
    }

    // ==========================================
    // CERRAR CAJA
    // ==========================================

    if (action === 'close') {
      const { registerId } = body;
      const id = Number(registerId);

      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error: 'ID de caja inválido.',
          },
          { status: 400 }
        );
      }

      // ACTUALIZAR CAJA
      await runQuery(async (db) => {
        return await db.sql(
          `
          UPDATE cash_registers
          SET
            closing_usd = ?,
            closing_ves = ?,
            closing_date = CURRENT_TIMESTAMP,
            status = 'closed'
          WHERE id = ?
            AND status = 'open';
          `,
          Number(countedUSD) || 0,
          Number(countedBs) || 0,
          id
        );
      });

      return NextResponse.json({
        success: true,
        message: 'Caja cerrada exitosamente.',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Acción no válida.',
      },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('========== ERROR /api/cash ==========');
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error procesando la caja.',
      },
      { status: 500 }
    );
  }
}
