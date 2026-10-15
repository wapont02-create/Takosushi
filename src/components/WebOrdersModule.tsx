'use client';

import { useCallback, useEffect, useState } from 'react';

interface WebOrderItem {
  product_id: number;
  name: string;
  quantity: number;
  price_at_sale: number;
  taxable: boolean;
  current_stock: number;
}

interface WebOrder {
  id: number;
  customer_id: number | null;
  customer_name: string;
  customer_document: string;
  customer_phone: string;
  total_usd: number;
  total_ves: number;
  payment_method: string;
  created_at: string | null;
  cash_register_id: number | null;
  exchange_rate: number;
  status: string;
  source: string;
  order_type: string;
  delivery_zone: string;
  delivery_address: string;
  items: WebOrderItem[];
}

interface WebOrdersModuleProps {
  onLoadOrder: (order: WebOrder) => void;
  loadedOrderId?: number | null;
}

export default function WebOrdersModule({
  onLoadOrder,
  loadedOrderId = null,
}: WebOrdersModuleProps) {
  const [orders, setOrders] = useState<WebOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadOrders = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    }

    try {
      const responses = await Promise.all([
        fetch('/api/admin/orders?status=pendiente', {
          cache: 'no-store',
        }),
        fetch('/api/admin/orders?status=aprobado', {
          cache: 'no-store',
        }),
      ]);

      const pendingResponse = responses[0];
      const approvedResponse = responses[1];

      const pendingData = await pendingResponse.json();
      const approvedData = await approvedResponse.json();

      if (!pendingResponse.ok || !pendingData.success) {
        throw new Error(
          pendingData.message ||
            'No se pudieron consultar los pedidos pendientes.'
        );
      }

      if (!approvedResponse.ok || !approvedData.success) {
        throw new Error(
          approvedData.message ||
            'No se pudieron consultar los pedidos aprobados.'
        );
      }

      const pendingOrders: WebOrder[] = Array.isArray(
        pendingData.orders
      )
        ? pendingData.orders
        : [];

      const approvedOrders: WebOrder[] = Array.isArray(
        approvedData.orders
      )
        ? approvedData.orders
        : [];

      const ordersMap = new Map<number, WebOrder>();

      pendingOrders.forEach((order) => {
        ordersMap.set(Number(order.id), order);
      });

      approvedOrders.forEach((order) => {
        ordersMap.set(Number(order.id), order);
      });

      const sortedOrders = Array.from(ordersMap.values()).sort(
        (a, b) => {
          const aPending = a.status === 'pendiente' ? 0 : 1;
          const bPending = b.status === 'pendiente' ? 0 : 1;

          if (aPending !== bPending) {
            return aPending - bPending;
          }

          return Number(b.id) - Number(a.id);
        }
      );

      setOrders(sortedOrders);
      setError('');
    } catch (err) {
      console.error('Error cargando pedidos web:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los pedidos web.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();

    const interval = setInterval(() => {
      void loadOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadOrders]);

  const updateOrderStatus = async (
    order: WebOrder,
    status: 'aprobado' | 'cancelado'
  ) => {
    if (processingId !== null) {
      return;
    }

    if (status === 'cancelado') {
      const customerName =
        order.customer_name || 'este cliente';

      const confirmationMessage =
        '¿Deseas rechazar el pedido web #' +
        order.id +
        ' de ' +
        customerName +
        '?';

      const confirmed = window.confirm(confirmationMessage);

      if (!confirmed) {
        return;
      }
    }

    setProcessingId(order.id);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: order.id,
          status: status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'No se pudo actualizar el pedido.'
        );
      }

      if (status === 'aprobado') {
        setMessage(
          'Pedido #' +
            order.id +
            ' aceptado. Ya puedes cargarlo al POS.'
        );
      } else {
        setMessage(
          'Pedido #' +
            order.id +
            ' rechazado correctamente.'
        );
      }

      await loadOrders();
    } catch (err) {
      console.error('Error actualizando pedido:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el pedido.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const pendingOrders = orders.filter(
    (order) => order.status === 'pendiente'
  );

  const approvedOrders = orders.filter(
    (order) => order.status === 'aprobado'
  );

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(value) || 0);
  };

  const formatVES = (value: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
    }).format(Number(value) || 0);
  };

  const formatDate = (value: string | null) => {
    if (!value) {
      return 'Fecha no disponible';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('es-VE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <section className="mb-6 rounded-xl border border-gray-700 bg-gray-900 p-5 text-gray-300">
        <p>Consultando pedidos web...</p>
      </section>
    );
  }

  return (
    <section className="mb-6 space-y-4 rounded-xl border border-gray-700 bg-gray-900 p-4 text-white sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            Pedidos de la web
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Acepta o rechaza los pedidos directamente desde la caja.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders(true)}
          disabled={refreshing || processingId !== null}
          className="rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? 'Actualizando...' : '↻ Actualizar'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-lg border border-green-800 bg-green-950/40 p-3 text-sm text-green-300"
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3">
          <p className="text-sm text-amber-300">
            Por revisar
          </p>

          <p className="mt-1 text-2xl font-bold">
            {pendingOrders.length}
          </p>
        </div>

        <div className="rounded-lg border border-green-700/50 bg-green-950/30 p-3">
          <p className="text-sm text-green-300">
            Aprobados
          </p>

          <p className="mt-1 text-2xl font-bold">
            {approvedOrders.length}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 p-6 text-center">
          <p className="font-medium text-gray-300">
            No hay pedidos web pendientes ni aprobados.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Los pedidos nuevos aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPending = order.status === 'pendiente';
            const isApproved = order.status === 'aprobado';
            const isProcessing = processingId === order.id;
            const isLoaded =
              Number(loadedOrderId) === Number(order.id);

            const statusClass =
              'rounded-full px-2.5 py-1 text-xs font-semibold ' +
              (isPending
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-green-500/15 text-green-300');

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-xl border border-gray-700 bg-gray-950/70"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-800 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">
                        Pedido #{order.id}
                      </h3>

                      <span className={statusClass}>
                        {isPending
                          ? 'Pendiente de decisión'
                          : 'Aprobado'}
                      </span>
                    </div>

                    <p className="mt-2 font-medium">
                      {order.customer_name || 'Cliente sin nombre'}
                    </p>

                    <p className="text-sm text-gray-400">
                      {order.customer_phone || 'Sin teléfono'}
                      {order.customer_document
                        ? ' · CI/RIF: ' + order.customer_document
                        : ''}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-green-300">
                      {formatUSD(order.total_usd)}
                    </p>

                    <p className="text-sm text-gray-400">
                      {formatVES(order.total_ves)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-gray-500">
                        Tipo:
                      </span>{' '}
                      {order.order_type || 'No especificado'}
                    </p>

                    <p>
                      <span className="text-gray-500">
                        Pago indicado:
                      </span>{' '}
                      {order.payment_method || 'No indicado'}
                    </p>

                    {order.delivery_zone && (
                      <p>
                        <span className="text-gray-500">
                          Zona:
                        </span>{' '}
                        {order.delivery_zone}
                      </p>
                    )}

                    {order.delivery_address && (
                      <p className="sm:col-span-2">
                        <span className="text-gray-500">
                          Dirección:
                        </span>{' '}
                        {order.delivery_address}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-300">
                      Productos ({order.items.length})
                    </p>

                    {order.items.length === 0 ? (
                      <p className="text-sm text-amber-300">
                        Este pedido no tiene productos registrados.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {order.items.map((item, index) => {
                          const itemKey =
                            String(order.id) +
                            '-' +
                            String(item.product_id) +
                            '-' +
                            String(index);

                          return (
                            <div
                              key={itemKey}
                              className="flex items-start justify-between gap-3 rounded-lg bg-gray-900 px-3 py-2 text-sm"
                            >
                              <div>
                                <p className="font-medium">
                                  {item.name}
                                </p>

                                <p className="text-gray-400">
                                  Cantidad: {item.quantity}
                                </p>
                              </div>

                              <p className="whitespace-nowrap text-gray-300">
                                {formatUSD(
                                  item.quantity * item.price_at_sale
                                )}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="grid gap-2 border-t border-gray-800 pt-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          void updateOrderStatus(order, 'aprobado')
                        }
                        disabled={
                          processingId !== null ||
                          order.items.length === 0
                        }
                        className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isProcessing
                          ? 'Procesando...'
                          : '✓ Aceptar pedido'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void updateOrderStatus(order, 'cancelado')
                        }
                        disabled={processingId !== null}
                        className="rounded-lg border border-red-700 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isProcessing
                          ? 'Procesando...'
                          : '✕ Rechazar pedido'}
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <div className="border-t border-gray-800 pt-3">
                      <button
                        type="button"
                        onClick={() => onLoadOrder(order)}
                        disabled={
                          isLoaded ||
                          processingId !== null ||
                          order.items.length === 0
                        }
                        className="w-full rounded-lg bg-fuchsia-600 px-4 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoaded
                          ? '✓ Pedido cargado en el POS'
                          : 'Cargar al POS y facturar →'}
                      </button>

                      <p className="mt-2 text-xs text-gray-500">
                        La facturación se completa al confirmar el pago
                        con una caja abierta.
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-500">
        Actualización automática cada 10 segundos.
      </p>
    </section>
  );
}
