'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export default function ClientMenu({
  initialCategories,
}: {
  initialCategories: MenuCategory[];
}) {
  const [cart, setCart] = useState<
    {
      id: number;
      name: string;
      price: number;
      quantity: number;
    }[]
  >([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [orderType, setOrderType] =
    useState('Local / Mesa');

  const [deliveryZone, setDeliveryZone] =
    useState('Guarenas');

  const [deliveryAddress, setDeliveryAddress] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState('Efectivo / Divisas');

  // Tasa de respaldo por si todavía no existe una tasa registrada.
  const [exchangeRate, setExchangeRate] =
    useState(778.33);

  const [
    isLoadingExchangeRate,
    setIsLoadingExchangeRate,
  ] = useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // ============================================================
  // CARGAR TASA ACTUAL DESDE LA BASE DE DATOS
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const loadExchangeRate = async () => {
      try {
        setIsLoadingExchangeRate(true);

        const response = await fetch(
          '/api/exchange-rate',
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (
          isMounted &&
          response.ok &&
          data?.success &&
          Number(data.rate) > 0
        ) {
          setExchangeRate(
            Number(data.rate)
          );
        }
      } catch (error) {
        console.error(
          'Error obteniendo la tasa de cambio:',
          error
        );
      } finally {
        if (isMounted) {
          setIsLoadingExchangeRate(false);
        }
      }
    };

    loadExchangeRate();

    // Actualizar la tasa automáticamente cada 60 segundos.
    const interval = setInterval(
      loadExchangeRate,
      60000
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // CARRITO
  // ============================================================

  const addToCart = (product: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === product.id
      );

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (
    id: number,
    delta: number
  ) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty =
              item.quantity + delta;

            return newQty > 0
              ? {
                  ...item,
                  quantity: newQty,
                }
              : null;
          }

          return item;
        })
        .filter(Boolean) as typeof cart
    );
  };

  const totalItems = cart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  const subtotalPrice = cart.reduce(
    (sum, item) =>
      sum +
      item.price * item.quantity,
    0
  );

  const deliveryCost =
    orderType === 'Delivery'
      ? deliveryZone === 'Guarenas'
        ? 2
        : 3
      : 0;

  const totalPrice = (
    subtotalPrice +
    deliveryCost
  ).toFixed(2);

  const totalBs = (
    parseFloat(totalPrice) *
    exchangeRate
  ).toFixed(2);

  // ============================================================
  // ENVIAR PEDIDO
  // ============================================================

  const checkoutWhatsApp = async () => {
    if (cart.length === 0) {
      alert(
        'Agrega al menos un producto al carrito.'
      );
      return;
    }

    if (
      !customerName.trim() ||
      !customerPhone.trim()
    ) {
      alert(
        'Por favor ingresa tu Nombre y Teléfono de contacto.'
      );
      return;
    }

    if (
      orderType === 'Delivery' &&
      !deliveryAddress.trim()
    ) {
      alert(
        'Por favor ingresa la dirección exacta para el delivery.'
      );
      return;
    }

    // Evitar registrar un pedido mientras todavía se actualiza la tasa.
    if (isLoadingExchangeRate) {
      alert(
        'Estamos actualizando la tasa de cambio. Intenta nuevamente en unos segundos.'
      );
      return;
    }

    if (
      !Number.isFinite(exchangeRate) ||
      exchangeRate <= 0
    ) {
      alert(
        'No se pudo obtener una tasa de cambio válida.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        '/api/orders',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            customerName:
              customerName.trim(),

            customerPhone:
              customerPhone.trim(),

            customerDocument: '',

            orderType,

            deliveryZone:
              orderType === 'Delivery'
                ? deliveryZone
                : '',

            deliveryAddress:
              orderType === 'Delivery'
                ? deliveryAddress.trim()
                : '',

            items: cart,

            total:
              parseFloat(totalPrice),

            totalBs:
              parseFloat(totalBs),

            exchangeRate,

            paymentMethod,

            created_at:
              new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            'Error al registrar el pedido.'
        );
      }

      console.log(
        'Pedido web registrado:',
        data
      );
    } catch (error: any) {
      console.error(
        'Error al registrar pedido:',
        error
      );

      alert(
        'Hubo un problema al registrar el pedido: ' +
          (error?.message ||
            'Error desconocido.')
      );

      setIsSubmitting(false);
      return;
    } finally {
      setIsSubmitting(false);
    }

    // ========================================================
    // WHATSAPP
    // ========================================================

    const phone =
      '584143065287';

    let message =
      `🍣 *NUEVO PEDIDO - TAKOSUSHI* 🍣\n\n`;

    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📞 *Teléfono:* ${customerPhone}\n`;

    message += `📍 *Servicio:* ${orderType}${
      orderType === 'Delivery'
        ? ` (${deliveryZone})`
        : ''
    }\n`;

    if (orderType === 'Delivery') {
      message += `🏠 *Dirección:* ${deliveryAddress}\n`;
    }

    message += `💳 *Pago:* ${paymentMethod}\n`;
    message +=
      `-----------------------------------\n`;

    cart.forEach((item) => {
      message += `• ${item.quantity}x ${
        item.name
      } ($${(
        item.price *
        item.quantity
      ).toFixed(2)})\n`;
    });

    message +=
      `-----------------------------------\n`;

    if (orderType === 'Delivery') {
      message += `🛵 *Delivery:* $${deliveryCost.toFixed(
        2
      )}\n`;
    }

    message += `💵 *TOTAL USD:* $${totalPrice}\n`;

    message += `🇻🇪 *TOTAL BS (Tasa ${exchangeRate.toFixed(
      2
    )}):* Bs. ${totalBs}`;

    const encodedURL =
      `https://wa.me/${phone}?text=` +
      encodeURIComponent(message);

    window.open(
      encodedURL,
      '_blank'
    );
  };

  return (
    <div className="flex flex-col min-h-screen justify-between w-full">
      {/* HEADER */}
      <header className="border-b border-pink-900/40 px-6 py-4 flex justify-between items-center bg-[#1a0008]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-[#ff007f] text-white font-black px-3 py-1.5 rounded-xl text-md shadow-lg shadow-[#ff007f]/30">
            🍣 TAKO TAKO
          </div>

          <span className="text-xs uppercase tracking-widest text-pink-400 font-semibold hidden sm:inline">
            Guarenas - Guatire
          </span>

          <span className="text-[10px] sm:text-xs text-emerald-400 font-bold">
            {isLoadingExchangeRate
              ? 'Actualizando tasa...'
              : `BCV: Bs. ${exchangeRate.toFixed(
                  2
                )} / $1`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-pink-300 hover:text-white border border-pink-900 bg-pink-950/60 px-3 py-1.5 rounded-xl transition"
          >
            🔐 Sistema POS
          </Link>

          <button
            onClick={() =>
              setIsCartOpen(true)
            }
            className="bg-pink-950 border border-pink-800 text-pink-200 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-pink-900 transition"
          >
            🛒 Carrito ({totalItems})
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        <div className="text-center mb-10">
          <span className="bg-[#ff007f]/20 text-pink-300 border border-[#ff007f]/40 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
            ✨ Menú Digital en Vivo
          </span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-wider uppercase mt-3 mb-2 text-yellow-400 drop-shadow-md">
            Nuestros Combos y Rolls
          </h1>

          <p className="text-pink-200/80 text-xs sm:text-sm max-w-md mx-auto">
            Pide directo a tu casa en Guarenas y Guatire o ven a retirar.
          </p>
        </div>

        {initialCategories.length ===
        0 ? (
          <div className="text-center py-20 text-pink-300/60">
            <p className="text-xl">
              Cargando menú desde el sistema...
            </p>
          </div>
        ) : (
          initialCategories.map(
            (cat, idx) => (
              <div
                key={idx}
                className="mb-12"
              >
                <div className="bg-[#ff007f] text-white font-black text-lg sm:text-xl py-2.5 px-5 rounded-2xl mb-6 shadow-lg uppercase tracking-wider transform -rotate-1">
                  {cat.category}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cat.items.map(
                    (
                      product: MenuItem
                    ) => {
                      const imageUrl =
                        typeof product.image ===
                        'string'
                          ? product.image.trim()
                          : '';

                      return (
                        <div
                          key={product.id}
                          className="bg-[#1f030d] border border-pink-900/50 rounded-3xl overflow-hidden flex flex-col shadow-xl"
                        >
                          {/* IMAGEN */}
                          <div className="w-full h-48 sm:h-56 bg-black/50 relative overflow-hidden border-b border-pink-900/40 flex-shrink-0">
                            {imageUrl &&
                            imageUrl !==
                              'NULL' &&
                            imageUrl !==
                              'EMPTY_STRING' ? (
                              <img
                                src={imageUrl}
                                alt={
                                  product.name
                                }
                                className="w-full h-full object-cover hover:scale-105 transition duration-500"
                                onError={(
                                  e
                                ) => {
                                  e.currentTarget.style.display =
                                    'none';

                                  const parent =
                                    e
                                      .currentTarget
                                      .parentElement;

                                  if (
                                    parent
                                  ) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full bg-[#140005] flex items-center justify-center text-pink-500/40 text-xs font-medium tracking-widest uppercase">
                                        📷 Sin imagen disponible
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-[#140005] flex items-center justify-center text-pink-500/40 text-xs font-medium tracking-widest uppercase">
                                📷 Sin imagen disponible
                              </div>
                            )}
                          </div>

                          {/* CONTENIDO */}
                          <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                            <div>
                              <h3 className="text-yellow-400 font-extrabold text-base sm:text-lg uppercase tracking-wide mb-1.5">
                                {product.name}
                              </h3>

                              <p className="text-pink-100/70 text-xs sm:text-sm leading-relaxed">
                                {product.description ||
                                  'Delicioso plato preparado al momento con los mejores ingredientes.'}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-pink-950 mt-auto">
                              <span className="bg-white text-slate-950 font-black px-3 py-1.5 rounded-xl text-base shadow-inner">
                                $
                                {product.price.toFixed(
                                  2
                                )}
                              </span>

                              <button
                                onClick={() =>
                                  addToCart(
                                    product
                                  )
                                }
                                className="bg-[#ff007f] hover:bg-pink-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#ff007f]/30 transition active:scale-95 flex items-center gap-1.5"
                              >
                                <span>
                                  + Agregar al Carrito
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )
          )
        )}
      </main>

      {/* BARRA DEL CARRITO */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a0008]/95 border-t border-pink-900/60 p-4 backdrop-blur-lg z-40 flex justify-between items-center max-w-xl mx-auto sm:rounded-t-3xl shadow-2xl">
          <div>
            <p className="text-xs text-pink-300">
              {totalItems}{' '}
              {totalItems === 1
                ? 'producto'
                : 'productos'}
            </p>

            <p className="text-lg font-black text-yellow-400">
              ${totalPrice}
            </p>
          </div>

          <button
            onClick={() =>
              setIsCartOpen(true)
            }
            className="bg-[#ff007f] hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#ff007f]/40 transition flex items-center gap-2"
          >
            🛒 Ver Pedido y Pagar
          </button>
        </div>
      )}

      {/* CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-[#1c020b] w-full max-w-md h-full p-6 flex flex-col justify-between border-l border-pink-900/50 shadow-2xl overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-pink-900/50 mb-4">
                <h2 className="text-lg font-black text-yellow-400">
                  🛒 Tu Pedido
                </h2>

                <button
                  onClick={() =>
                    setIsCartOpen(false)
                  }
                  className="bg-pink-950 text-pink-300 hover:text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-pink-900"
                >
                  ✕ Cerrar
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-10 text-pink-300/60">
                  <p className="text-4xl mb-3">
                    🍣
                  </p>

                  <p className="text-sm">
                    Tu carrito está vacío.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1 mb-4">
                  {cart.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="bg-[#140005] p-3 rounded-2xl border border-pink-950 flex justify-between items-center"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-yellow-200">
                            {item.name}
                          </h4>

                          <p className="text-[11px] text-pink-400">
                            $
                            {item.price.toFixed(
                              2
                            )}{' '}
                            c/u
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                -1
                              )
                            }
                            className="bg-pink-950 w-7 h-7 rounded-lg font-bold text-xs hover:bg-pink-900 flex items-center justify-center"
                          >
                            -
                          </button>

                          <span className="font-bold text-xs w-4 text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                1
                              )
                            }
                            className="bg-pink-950 w-7 h-7 rounded-lg font-bold text-xs hover:bg-pink-900 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-pink-900/50 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-pink-300 mb-1">
                      Tu Nombre:
                    </label>

                    <input
                      type="text"
                      placeholder="Ej. Carlos Pérez"
                      value={
                        customerName
                      }
                      onChange={(e) =>
                        setCustomerName(
                          e.target.value
                        )
                      }
                      className="w-full bg-[#140005] border border-pink-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-pink-300 mb-1">
                      Teléfono:
                    </label>

                    <input
                      type="text"
                      placeholder="0412-0000000"
                      value={
                        customerPhone
                      }
                      onChange={(e) =>
                        setCustomerPhone(
                          e.target.value
                        )
                      }
                      className="w-full bg-[#140005] border border-pink-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-pink-300 mb-1">
                    Tipo de Servicio:
                  </label>

                  <select
                    value={orderType}
                    onChange={(e) =>
                      setOrderType(
                        e.target.value
                      )
                    }
                    className="w-full bg-[#140005] border border-pink-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                  >
                    <option value="Local / Mesa">
                      🍽️ Comer en Local / Mesa
                    </option>

                    <option value="Pickup">
                      🏃‍♂️ Retirar en Local (Pickup)
                    </option>

                    <option value="Delivery">
                      🛵 Delivery a Domicilio
                    </option>
                  </select>
                </div>

                {orderType ===
                  'Delivery' && (
                  <div className="space-y-2 bg-[#140005] p-3 rounded-xl border border-pink-950">
                    <div>
                      <label className="block text-[10px] font-semibold text-pink-300 mb-1">
                        Zona de Delivery:
                      </label>

                      <select
                        value={
                          deliveryZone
                        }
                        onChange={(e) =>
                          setDeliveryZone(
                            e.target.value
                          )
                        }
                        className="w-full bg-[#1a0008] border border-pink-900 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="Guarenas">
                          Guarenas ($2.00)
                        </option>

                        <option value="Guatire">
                          Guatire ($3.00)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-pink-300 mb-1">
                        Dirección Exacta:
                      </label>

                      <input
                        type="text"
                        placeholder="Ej. Urb. Trapichito..."
                        value={
                          deliveryAddress
                        }
                        onChange={(e) =>
                          setDeliveryAddress(
                            e.target.value
                          )
                        }
                        className="w-full bg-[#1a0008] border border-pink-900 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-pink-300 mb-1">
                    Método de Pago:
                  </label>

                  <select
                    value={
                      paymentMethod
                    }
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value
                      )
                    }
                    className="w-full bg-[#140005] border border-pink-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                  >
                    <option value="Efectivo / Divisas">
                      💵 Efectivo Divisas ($)
                    </option>

                    <option value="Pago Móvil (Bs)">
                      📱 Pago Móvil (Bolívares)
                    </option>

                    <option value="Zelle / Binance">
                      🌐 Zelle / Binance
                    </option>
                  </select>
                </div>

                <div className="bg-[#140005] p-3 rounded-xl border border-pink-950 space-y-1 text-xs">
                  <div className="flex justify-between text-pink-300/80">
                    <span>
                      Subtotal:
                    </span>

                    <span>
                      $
                      {subtotalPrice.toFixed(
                        2
                      )}
                    </span>
                  </div>

                  {orderType ===
                    'Delivery' && (
                    <div className="flex justify-between text-pink-300/80">
                      <span>
                        Delivery (
                        {deliveryZone}
                        ):
                      </span>

                      <span>
                        $
                        {deliveryCost.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-sm text-yellow-400 pt-2 border-t border-pink-900/40">
                    <span>
                      Total USD:
                    </span>

                    <span>
                      ${totalPrice}
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-pink-200">
                    <span>
                      Total Bolívares (
                      {isLoadingExchangeRate
                        ? 'Actualizando tasa...'
                        : `Tasa ${exchangeRate.toFixed(
                            2
                          )}`}
                      ):
                    </span>

                    <span>
                      Bs.{' '}
                      {isLoadingExchangeRate
                        ? '...'
                        : totalBs}
                    </span>
                  </div>
                </div>

                <button
                  onClick={
                    checkoutWhatsApp
                  }
                  disabled={
                    isSubmitting ||
                    isLoadingExchangeRate
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting
                    ? 'Registrando...'
                    : isLoadingExchangeRate
                    ? 'Actualizando tasa...'
                    : '🟢 Enviar Pedido por WhatsApp'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-pink-900/30 py-6 text-center text-xs text-pink-400/60 bg-[#1a0008] space-y-2">
        <p>
          Takosushi • Guarenas y Guatire.
        </p>
      </footer>
    </div>
  );
}
