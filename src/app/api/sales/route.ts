import { NextResponse } from 'next/server';
import { runQuery } from '@/db/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      date,
      created_at,
      totalUSD,
      totalBs,
      exchangeRate,
      paymentMethod,
      items,
      cashRegisterId,
      cash_register_id,
      userId
    } = body;

    // ============================================================
    // 1. VALIDAR CAJA
    // ============================================================

    const registerIdRaw = cashRegisterId ?? cash_register_id;
    const registerId = Number(registerIdRaw);

    if (!Number.isInteger(registerId) || registerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se recibió una caja válida para registrar la venta.'
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 2. VALIDAR USUARIO
    // ============================================================

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se recibió un usuario válido para registrar la venta.'
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 3. VERIFICAR CAJA ABIERTA Y DEL USUARIO
    // ============================================================

    const registerResult: any = await runQuery(async (db) => {
      return await db.sql(
        `
        SELECT
          cr.id,
          cr.user_id,
          cr.status,
          cr.opening_date,
          cr.closing_date
        FROM cash_registers cr
        WHERE cr.id = ?
          AND cr.user_id = ?
          AND cr.status = 'open'
          AND cr.closing_date IS NULL
        LIMIT 1
        `,
        registerId,
        parsedUserId
      );
    });

    const registerRows = Array.isArray(registerResult)
      ? registerResult
      : registerResult?.rows || [];

    if (registerRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'La caja seleccionada no está abierta, fue cerrada o no pertenece al usuario actual.'
        },
        { status: 400 }
      );
    }

    const activeRegister = registerRows[0];
    const activeRegisterId = Number(activeRegister.id);

    if (!Number.isInteger(activeRegisterId) || activeRegisterId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'La caja abierta no tiene un ID válido.'
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 4. VALORES SEGUROS
    // ============================================================

    const safeTotalUSD = Number(totalUSD) || 0;
    const safeTotalBs = Number(totalBs) || 0;
    const safeExchangeRate = Number(exchangeRate) || 1;
    const safePaymentMethod = paymentMethod || 'Efectivo USD';
    const safeDate =
      date || created_at || new Date().toISOString();

    if (safeTotalUSD <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El total de la venta debe ser mayor que cero.'
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'La venta debe contener al menos un producto.'
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 5. INSERTAR VENTA Y OBTENER ID REAL
    // ============================================================

    const saleResult: any = await runQuery(async (db) => {
      return await db.sql(
        `
        INSERT INTO sales (
          total_usd,
          payment_method,
          cash_register_id,
          total_ves,
          exchange_rate,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id
        `,
        safeTotalUSD,
        safePaymentMethod,
        activeRegisterId,
        safeTotalBs,
        safeExchangeRate,
        safeDate
      );
    });

    const saleRows = Array.isArray(saleResult)
      ? saleResult
      : saleResult?.rows || [];

    const saleId = Number(saleRows[0]?.id);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      console.error(
        'Respuesta inesperada al crear venta:',
        saleResult
      );

      throw new Error(
        'La venta fue creada, pero no se pudo obtener su ID.'
      );
    }

    // ============================================================
    // 6. INSERTAR PRODUCTOS DE LA VENTA
    //    Y DESCONTAR STOCK UNA SOLA VEZ
    // ============================================================

    for (const item of items) {
      const productId = Number(item.id || item.product_id);
      const quantity = Number(item.quantity);
      const price = Number(item.price || item.price_usd);

      if (!Number.isInteger(productId) || productId <= 0) {
        throw new Error(
          'La venta contiene un producto inválido.'
        );
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(
          `Cantidad inválida para el producto ${productId}.`
        );
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error(
          `Precio inválido para el producto ${productId}.`
        );
      }

      // ----------------------------------------------------------
      // Verificar stock antes de descontar
      // ----------------------------------------------------------

      const productResult: any = await runQuery(async (db) => {
        return await db.sql(
          `
          SELECT
            id,
            name,
            stock
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          productId
        );
      });

      const productRows = Array.isArray(productResult)
        ? productResult
        : productResult?.rows || [];

      if (productRows.length === 0) {
        throw new Error(
          `El producto con ID ${productId} no existe.`
        );
      }

      const product = productRows[0];
      const currentStock = Number(product.stock) || 0;

      if (currentStock < quantity) {
        throw new Error(
          `Stock insuficiente para "${product.name}". Disponible: ${currentStock}.`
        );
      }

      // ----------------------------------------------------------
      // Registrar detalle de venta
      // ----------------------------------------------------------

      await runQuery(async (db) => {
        return await db.sql(
          `
          INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            price_at_sale
          )
          VALUES (?, ?, ?, ?)
          `,
          saleId,
          productId,
          quantity,
          price
        );
      });

      // ----------------------------------------------------------
      // Descontar stock
      // ----------------------------------------------------------

      await runQuery(async (db) => {
        return await db.sql(
          `
          UPDATE products
          SET stock = stock - ?
          WHERE id = ?
          `,
          quantity,
          productId
        );
      });
    }

    // ============================================================
    // 7. RESPUESTA FINAL
    // ============================================================

    return NextResponse.json({
      success: true,
      saleId,
      cashRegisterId: activeRegisterId,
      userId: parsedUserId,
      message: 'Venta registrada con éxito'
    });

  } catch (error: any) {
    console.error('Error al registrar venta:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Error al procesar la venta en la base de datos'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result: any = await runQuery(async (db) => {
      return await db.sql(
        `
        SELECT *
        FROM sales
        ORDER BY id DESC
        `
      );
    });

    const rows = Array.isArray(result)
      ? result
      : result?.rows || [];

    return NextResponse.json(rows);

  } catch (error) {
    console.error('Error obteniendo ventas:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener el historial de ventas'
      },
      { status: 500 }
    );
  }
}
