import { NextResponse } from 'next/server';
import { runQuery } from '../../../db/client';

/**
 * Normaliza el resultado de SQLite Cloud.
 */
function getRows(result: any): any[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (result?.rows && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
}

/**
 * GET
 *
 * Consulta la caja abierta.
 *
 * Puede recibir:
 *
 * /api/cash?userId=2
 *
 * Si no recibe userId, busca la última caja abierta.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get('userId');

    const userId = userIdParam
      ? Number(userIdParam)
      : null;

    if (userIdParam && (!Number.isInteger(userId) || userId <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId inválido.',
        },
        { status: 400 }
      );
    }

    const result = await runQuery(async (db) => {
      if (userId) {
        return await db.sql(
          `
          SELECT
            cr.id,
            cr.user_id,
            cr.opening_date,
            cr.closing_date,
            cr.opening_usd,
            cr.opening_ves,
            cr.closing_usd,
            cr.closing_ves,
            cr.status,
            u.name AS user_name,
            u.email AS user_email
          FROM cash_registers cr
          LEFT JOIN users u
            ON u.id = cr.user_id
          WHERE cr.user_id = ?
            AND cr.status = 'open'
            AND cr.closing_date IS NULL
          ORDER BY cr.id DESC
          LIMIT 1;
          `,
          userId
        );
      }

      return await db.sql(`
        SELECT
          cr.id,
          cr.user_id,
          cr.opening_date,
          cr.closing_date,
          cr.opening_usd,
          cr.opening_ves,
          cr.closing_usd,
          cr.closing_ves,
          cr.status,
          u.name AS user_name,
          u.email AS user_email
        FROM cash_registers cr
        LEFT JOIN users u
          ON u.id = cr.user_id
        WHERE cr.status = 'open'
          AND cr.closing_date IS NULL
        ORDER BY cr.id DESC
        LIMIT 1;
      `);
    });

    const rows = getRows(result);

    const openRegister = rows.length > 0
      ? rows[0]
      : null;

    return NextResponse.json({
      success: true,
      isOpen: !!openRegister,
      register: openRegister,
      rows,
    });

  } catch (error: any) {
    console.error('ERROR GET /api/cash:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error consultando las cajas.',
      },
      { status: 500 }
    );
  }
}


/**
 * POST
 *
 * action:
 *   open  -> abrir caja
 *   close -> cerrar caja
 */
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
      registerId,
    } = body;

    // =========================================================
    // VALIDAR USUARIO
    // =========================================================

    const cleanUserId = Number(userId);

    if (!Number.isInteger(cleanUserId) || cleanUserId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId es obligatorio y debe ser válido.',
        },
        { status: 400 }
      );
    }

    // =========================================================
    // VERIFICAR QUE EL USUARIO EXISTE
    // =========================================================

    const userResult = await runQuery(async (db) => {
      return await db.sql(
        `
        SELECT
          id,
          name,
          email
        FROM users
        WHERE id = ?
        LIMIT 1;
        `,
        cleanUserId
      );
    });

    const userRows = getRows(userResult);

    if (userRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El usuario indicado no existe.',
        },
        { status: 404 }
      );
    }

    // =========================================================
    // ABRIR CAJA
    // =========================================================

    if (action === 'open') {

      const usd = Number(openingUSD) || 0;
      const ves = Number(openingBs) || 0;

      if (usd < 0 || ves < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Los montos de apertura no pueden ser negativos.',
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------------
      // BUSCAR CAJA ABIERTA DEL USUARIO
      // -------------------------------------------------------

      const existingResult = await runQuery(async (db) => {
        return await db.sql(
          `
          SELECT
            id,
            user_id,
            opening_date,
            opening_usd,
            opening_ves,
            status
          FROM cash_registers
          WHERE user_id = ?
            AND status = 'open'
            AND closing_date IS NULL
          ORDER BY id DESC
          LIMIT 1;
          `,
          cleanUserId
        );
      });

      const existingRows = getRows(existingResult);

      if (existingRows.length > 0) {
        return NextResponse.json({
          success: true,
          alreadyOpen: true,
          message: 'Este usuario ya tiene una caja abierta.',
          registerId: existingRows[0].id,
          register: existingRows[0],
        });
      }

      // -------------------------------------------------------
      // CREAR CAJA
      // -------------------------------------------------------

      await runQuery(async (db) => {
        return await db.sql(
          `
          INSERT INTO cash_registers
          (
            user_id,
            opening_date,
            opening_usd,
            opening_ves,
            status
          )
          VALUES
          (
            ?,
            CURRENT_TIMESTAMP,
            ?,
            ?,
            'open'
          );
          `,
          cleanUserId,
          usd,
          ves
        );
      });

      // -------------------------------------------------------
      // RECUPERAR CAJA RECIÉN CREADA
      // -------------------------------------------------------

      const newRegisterResult = await runQuery(async (db) => {
        return await db.sql(
          `
          SELECT
            cr.id,
            cr.user_id,
            cr.opening_date,
            cr.closing_date,
            cr.opening_usd,
            cr.opening_ves,
            cr.closing_usd,
            cr.closing_ves,
            cr.status,
            u.name AS user_name,
            u.email AS user_email
          FROM cash_registers cr
          LEFT JOIN users u
            ON u.id = cr.user_id
          WHERE cr.user_id = ?
            AND cr.status = 'open'
            AND cr.closing_date IS NULL
          ORDER BY cr.id DESC
          LIMIT 1;
          `,
          cleanUserId
        );
      });

      const newRows = getRows(newRegisterResult);

      if (newRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              'La caja fue insertada, pero no pudo ser recuperada.',
          },
          { status: 500 }
        );
      }

      const register = newRows[0];

      return NextResponse.json({
        success: true,
        alreadyOpen: false,
        message: 'Caja abierta exitosamente.',
        registerId: register.id,
        register,
      });
    }

    // =========================================================
    // CERRAR CAJA
    // =========================================================

    if (action === 'close') {

      const cleanRegisterId = Number(registerId);

      if (
        !Number.isInteger(cleanRegisterId) ||
        cleanRegisterId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'ID de caja inválido.',
          },
          { status: 400 }
        );
      }

      const finalUSD = Number(countedUSD) || 0;
      const finalVES = Number(countedBs) || 0;

      if (finalUSD < 0 || finalVES < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Los montos de cierre no pueden ser negativos.',
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------------
      // VERIFICAR QUE LA CAJA PERTENECE AL USUARIO
      // -------------------------------------------------------

      const registerResult = await runQuery(async (db) => {
        return await db.sql(
          `
          SELECT
            id,
            user_id,
            opening_date,
            opening_usd,
            opening_ves,
            status
          FROM cash_registers
          WHERE id = ?
            AND user_id = ?
            AND status = 'open'
            AND closing_date IS NULL
          LIMIT 1;
          `,
          cleanRegisterId,
          cleanUserId
        );
      });

      const registerRows = getRows(registerResult);

      if (registerRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              'La caja no existe, ya está cerrada o no pertenece al usuario.',
          },
          { status: 404 }
        );
      }

      // -------------------------------------------------------
      // CERRAR CAJA
      // -------------------------------------------------------

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
            AND user_id = ?
            AND status = 'open'
            AND closing_date IS NULL;
          `,
          finalUSD,
          finalVES,
          cleanRegisterId,
          cleanUserId
        );
      });

      // -------------------------------------------------------
      // VERIFICAR CIERRE
      // -------------------------------------------------------

      const closedResult = await runQuery(async (db) => {
        return await db.sql(
          `
          SELECT
            cr.id,
            cr.user_id,
            cr.opening_date,
            cr.closing_date,
            cr.opening_usd,
            cr.opening_ves,
            cr.closing_usd,
            cr.closing_ves,
            cr.status,
            u.name AS user_name,
            u.email AS user_email
          FROM cash_registers cr
          LEFT JOIN users u
            ON u.id = cr.user_id
          WHERE cr.id = ?
          LIMIT 1;
          `,
          cleanRegisterId
        );
      });

      const closedRows = getRows(closedResult);

      return NextResponse.json({
        success: true,
        message: 'Caja cerrada exitosamente.',
        register:
          closedRows.length > 0
            ? closedRows[0]
            : null,
      });
    }

    // =========================================================
    // ACCIÓN NO VÁLIDA
    // =========================================================

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
        error:
          error?.message ||
          'Error procesando la caja.',
      },
      { status: 500 }
    );
  }
}
