'use client';

import { useEffect, useState } from 'react';

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

  const loadOrders = async () => {
    try {
      const response = await fetch(
        '/api/admin/orders?status=aprobado',
        {
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Error HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (data?.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error(
        'Error cargando pedidos web aprobados:',
        error
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const interval = window.setInterval(() => {
      loadOrders();
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          borderRadius: '12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            color: '#64748b',
          }}
        >
          Cargando pedidos web aprobados...
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            Pedidos Web aprobados
          </h2>

          <p
            style={{
              margin: '4px 0 0',
              fontSize: '13px',
              color: '#64748b',
            }}
          >
            Pedidos listos para cargar al POS y
            facturar.
          </p>
        </div>

        <div
          style={{
            padding: '6px 10px',
            borderRadius: '999px',
            background: '#dcfce7',
            color: '#166534',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {orders.length}{' '}
          {orders.length === 1
            ? 'pedido'
            : 'pedidos'}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        {orders.map((order) => {
          const isLoaded =
            loadedOrderId === order.id;

          return (
            <article
              key={order.id}
              style={{
                border: isLoaded
                  ? '2px solid #16a34a'
                  : '1px solid #e2e8f0',
                borderRadius: '14px',
                background: '#ffffff',
                padding: '16px',
                boxShadow:
                  '0 4px 16px rgba(15, 23, 42, 0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                    }}
                  >
                    Pedido #{order.id}
                  </div>

                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#64748b',
                    }}
                  >
                    {order.created_at
                      ? new Date(
                          order.created_at
                        ).toLocaleString(
                          'es-VE'
                        )
                      : 'Fecha no disponible'}
                  </div>
                </div>

                <span
                  style={{
                    padding: '5px 9px',
                    borderRadius: '999px',
                    background:
                      '#dcfce7',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace:
                      'nowrap',
                  }}
                >
                  APROBADO
                </span>
              </div>

              <div
                style={{
                  marginBottom: '14px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                >
                  {order.customer_name ||
                    'Cliente sin nombre'}
                </div>

                {order.customer_phone && (
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                    }}
                  >
                    Tel: {order.customer_phone}
                  </div>
                )}

                {order.customer_document && (
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                    }}
                  >
                    CI/RIF:{' '}
                    {order.customer_document}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '6px',
                  }}
                >
                  Productos
                </div>

                {order.items.map(
                  (item, index) => (
                    <div
                      key={`${order.id}-${item.product_id}-${index}`}
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        gap: '10px',
                        padding:
                          '6px 0',
                        borderBottom:
                          index <
                          order.items
                            .length -
                            1
                            ? '1px solid #e2e8f0'
                            : 'none',
                        fontSize: '13px',
                      }}
                    >
                      <span>
                        {item.quantity} ×{' '}
                        {item.name}
                      </span>

                      <span
                        style={{
                          whiteSpace:
                            'nowrap',
                          fontWeight: 600,
                        }}
                      >
                        $
                        {(
                          item.price_at_sale *
                          item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                  }}
                >
                  Tipo de pedido
                </div>

                <div
                  style={{
                    fontWeight: 600,
                    marginTop: '2px',
                  }}
                >
                  {order.order_type ||
                    'No especificado'}
                </div>

                {order.delivery_zone && (
                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#475569',
                    }}
                  >
                    Zona:{' '}
                    {order.delivery_zone}
                  </div>
                )}

                {order.delivery_address && (
                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '13px',
                      color: '#475569',
                    }}
                  >
                    Dirección:{' '}
                    {order.delivery_address}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '14px',
                  paddingTop: '12px',
                  borderTop:
                    '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#64748b',
                    }}
                  >
                    Total
                  </div>

                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 800,
                    }}
                  >
                    $
                    {Number(
                      order.total_usd
                    ).toFixed(2)}
                  </div>
                </div>

                <div
                  style={{
                    textAlign: 'right',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#64748b',
                    }}
                  >
                    Total Bs
                  </div>

                  <div
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    Bs.{' '}
                    {Number(
                      order.total_ves
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onLoadOrder(order)
                }
                disabled={isLoaded}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: 'none',
                  borderRadius: '10px',
                  background: isLoaded
                    ? '#16a34a'
                    : '#0f172a',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: isLoaded
                    ? 'default'
                    : 'pointer',
                  opacity: isLoaded
                    ? 0.9
                    : 1,
                }}
              >
                {isLoaded
                  ? '✓ Cargado en POS'
                  : 'Cargar al POS →'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
