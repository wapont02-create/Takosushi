'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type MenuItem = {
  id: number | string;
  name: string;
  price: number;
  description?: string;
  image?: string;
};

type MenuCategory = {
  category: string;
  items: MenuItem[];
};

type CartItem = {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
};

type ClientMenuProps = {
  initialCategories: MenuCategory[];
};

const WHATSAPP_NUMBER = '584129269308';
const DEFAULT_EXCHANGE_RATE = 778.33;

const PAYMENT_METHODS = [
  'Efectivo / Divisas',
  'Pago Móvil',
  'Zelle',
  'Binance Pay',
];

function formatUSD(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatVES(value: number) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function ProductImage({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#2c101b] to-[#170910] text-[#d9a8bb]">
        <span className="text-4xl" aria-hidden="true">
          🍣
        </span>
        <span className="text-xs tracking-widest text-[#b78a9c]">
          TAKO TAKO
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => setHasError(true)}
    />
  );
}

export default function ClientMenu({
  initialCategories,
}: ClientMenuProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [orderType, setOrderType] = useState('Local / Mesa');
  const [deliveryZone, setDeliveryZone] = useState('Guarenas');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo / Divisas');

  const [exchangeRate, setExchangeRate] = useState(
    DEFAULT_EXCHANGE_RATE,
  );
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] =
    useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRateMessage, setExchangeRateMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadExchangeRate = async () => {
      try {
        const response = await fetch('/api/exchange-rate', {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await response.json();

        if (
          isMounted &&
          data?.success &&
          Number(data.rate) > 0
        ) {
          setExchangeRate(Number(data.rate));
          setExchangeRateMessage('');
        } else if (isMounted) {
          setExchangeRateMessage(
            'Mostrando la última tasa disponible.',
          );
        }
      } catch (error) {
        console.error('Error consultando la tasa:', error);

        if (isMounted) {
          setExchangeRateMessage(
            'No se pudo actualizar la tasa. Se conserva la tasa disponible.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingExchangeRate(false);
        }
      }
    };

    loadExchangeRate();

    const interval = window.setInterval(loadExchangeRate, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const categories = useMemo(() => {
    return initialCategories.filter(
      (category) =>
        category &&
        Array.isArray(category.items) &&
        category.items.length > 0,
    );
  }, [initialCategories]);

  const categoryNames = useMemo(() => {
    return [
      'Todos',
      ...categories.map((category) => category.category),
    ];
  }, [categories]);

  const visibleCategories = useMemo(() => {
    if (selectedCategory === 'Todos') {
      return categories;
    }

    return categories.filter(
      (category) => category.category === selectedCategory,
    );
  }, [categories, selectedCategory]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }, [cart]);

  const deliveryCost = useMemo(() => {
    if (orderType !== 'Delivery') {
      return 0;
    }

    return deliveryZone === 'Guatire' ? 3 : 2;
  }, [orderType, deliveryZone]);

  const total = subtotal + deliveryCost;
  const totalBs = total * exchangeRate;

  const addToCart = (product: MenuItem) => {
    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) => String(item.id) === String(product.id),
      );

      if (existingItem) {
        return previousCart.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...previousCart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (
    id: number | string,
    delta: number,
  ) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          String(item.id) === String(id)
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (id: number | string) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => String(item.id) !== String(id),
      ),
    );
  };

  const checkoutWhatsApp = async () => {
    if (cart.length === 0) {
      alert('Agrega al menos un producto al carrito.');
      return;
    }

    if (!customerName.trim()) {
      alert('Por favor, escribe el nombre del cliente.');
      return;
    }

    if (!customerPhone.trim()) {
      alert('Por favor, escribe un número de contacto.');
      return;
    }

    if (
      orderType === 'Delivery' &&
      !deliveryAddress.trim()
    ) {
      alert('Por favor, escribe la dirección de entrega.');
      return;
    }

    if (isLoadingExchangeRate) {
      alert('Espera mientras se consulta la tasa de cambio.');
      return;
    }

    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      alert('La tasa de cambio no es válida. Intenta nuevamente.');
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    // Abrir la pestaña desde la acción del usuario para reducir
    // la posibilidad de que el navegador bloquee WhatsApp.
    const whatsappWindow = window.open('about:blank', '_blank');

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerDocument: '',
        orderType,
        deliveryZone:
          orderType === 'Delivery' ? deliveryZone : '',
        deliveryAddress:
          orderType === 'Delivery'
            ? deliveryAddress.trim()
            : '',
        items: cart,
        total: Number(total.toFixed(2)),
        totalBs: Number(totalBs.toFixed(2)),
        exchangeRate,
        paymentMethod,
        created_at: new Date().toISOString(),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            'No se pudo registrar el pedido.',
        );
      }

      let message = `🍣 *NUEVO PEDIDO - TAKO TAKO* 🍣\n\n`;

      message += `👤 *Cliente:* ${customerName.trim()}\n`;
      message += `📱 *Teléfono:* ${customerPhone.trim()}\n`;
      message += `📦 *Tipo de pedido:* ${orderType}\n`;

      if (orderType === 'Delivery') {
        message += `📍 *Zona:* ${deliveryZone}\n`;
        message += `🏠 *Dirección:* ${deliveryAddress.trim()}\n`;
      }

      message += `💳 *Método de pago:* ${paymentMethod}\n\n`;
      message += `🛒 *DETALLE DEL PEDIDO*\n`;

      cart.forEach((item) => {
        const lineTotal = item.price * item.quantity;

        message += `• ${item.quantity} x ${item.name}\n`;
        message += `  ${formatUSD(lineTotal)}\n`;
      });

      message += `\n━━━━━━━━━━━━━━━━━━\n`;
      message += `Subtotal: ${formatUSD(subtotal)}\n`;

      if (orderType === 'Delivery') {
        message += `Delivery: ${formatUSD(deliveryCost)}\n`;
      }

      message += `*TOTAL: ${formatUSD(total)}*\n`;
      message += `Total en Bs: Bs. ${formatVES(totalBs)}\n`;
      message += `Tasa aplicada: Bs. ${formatVES(exchangeRate)} por USD\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
      message += `¡Gracias por elegir TAKO TAKO! 🍣`;

      const whatsappUrl =
        `https://wa.me/${WHATSAPP_NUMBER}?text=` +
        encodeURIComponent(message);

      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }

      setCart([]);
      setIsCartOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
    } catch (error) {
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.close();
      }

      console.error('Error al procesar el pedido:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.';

      alert(
        `No se pudo procesar el pedido.\n${errorMessage}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10070c] pb-28 text-white">
      {/* Encabezado */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#10070c]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a
            href="#inicio"
            className="flex min-w-0 items-center gap-3"
            aria-label="TAKO TAKO, inicio"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-pink-400/20 bg-gradient-to-br from-[#ed277c] to-[#8e174d] text-xl shadow-lg shadow-pink-950/30">
              🍣
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-[0.12em] sm:text-xl">
                TAKO <span className="text-[#ff4b98]">TAKO</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#bda6b1] sm:text-xs">
                Sushi & rolls
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right sm:block">
              <p className="text-[10px] uppercase tracking-wider text-[#bda6b1]">
                Tasa de cambio
              </p>
              <p className="text-sm font-bold text-white">
                Bs. {formatVES(exchangeRate)}
              </p>
            </div>

            <Link
              href="/login"
              className="hidden rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-[#e7d8df] transition hover:border-pink-400/50 hover:bg-white/5 sm:inline-flex"
            >
              Acceso POS
            </Link>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-11 items-center gap-2 rounded-xl bg-[#f02d82] px-3 text-sm font-bold text-white transition hover:bg-[#ff4896] active:scale-[0.98] sm:px-4"
              aria-label={`Abrir carrito, ${totalItems} productos`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M3 3h2l2.2 11.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="20" r="1.5" fill="currentColor" />
                <circle cx="18" cy="20" r="1.5" fill="currentColor" />
              </svg>

              <span className="hidden sm:inline">Mi pedido</span>

              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-black text-[#b51b5d]">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main id="inicio" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Presentación */}
        <section className="relative overflow-hidden py-10 sm:py-14 lg:py-16">
          <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-[#b71f61]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-0 h-64 w-64 rounded-full bg-[#741a42]/20 blur-3xl" />

          <div className="relative grid items-center gap-7 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-400/[0.07] px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ff4b98]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f6b5d1] sm:text-xs">
                  Guarenas · Guatire
                </span>
              </div>

              <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Tu próximo antojo
                <span className="block text-[#ff4b98]">
                  comienza aquí.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#c9b8c1] sm:text-base">
                Descubre nuestros combos y rolls favoritos.
                Elige tus productos, arma tu pedido y disfrútalo
                como más te guste.
              </p>

              <a
                href="#menu"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#28111d] transition hover:bg-[#ffe6f0]"
              >
                Explorar menú
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className="hidden md:block">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border border-pink-300/15 bg-gradient-to-br from-[#42172c] to-[#1c0c14] shadow-2xl shadow-black/20 lg:h-44 lg:w-44">
                <span className="text-7xl lg:text-8xl" aria-hidden="true">
                  🍣
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 sm:p-4">
              <span className="text-lg sm:text-xl" aria-hidden="true">
                🍱
              </span>
              <p className="mt-2 text-xs font-bold sm:text-sm">
                Combos y rolls
              </p>
              <p className="mt-1 hidden text-xs text-[#bda6b1] sm:block">
                Para disfrutar
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 sm:p-4">
              <span className="text-lg sm:text-xl" aria-hidden="true">
                🛵
              </span>
              <p className="mt-2 text-xs font-bold sm:text-sm">
                Delivery
              </p>
              <p className="mt-1 hidden text-xs text-[#bda6b1] sm:block">
                Guarenas y Guatire
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 sm:p-4">
              <span className="text-lg sm:text-xl" aria-hidden="true">
                💬
              </span>
              <p className="mt-2 text-xs font-bold sm:text-sm">
                Pedido fácil
              </p>
              <p className="mt-1 hidden text-xs text-[#bda6b1] sm:block">
                Confirmación por WhatsApp
              </p>
            </div>
          </div>
        </section>

        {/* Menú */}
        <section id="menu" className="scroll-mt-24 pb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff70ad]">
                Hecho para disfrutar
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Nuestro menú
              </h2>
              <p className="mt-2 text-sm text-[#bda6b1]">
                Encuentra tu favorito y agrégalo a tu pedido.
              </p>
            </div>

            <div className="mt-2 text-xs text-[#bda6b1] sm:mt-0">
              {categories.reduce(
                (totalCount, category) =>
                  totalCount + category.items.length,
                0,
              )}{' '}
              productos disponibles
            </div>
          </div>

          {/* Filtros de categorías */}
          {categoryNames.length > 1 && (
            <div className="mt-6 flex gap-2 overflow-x-auto pb-3">
              {categoryNames.map((categoryName) => {
                const isActive = selectedCategory === categoryName;

                return (
                  <button
                    key={categoryName}
                    type="button"
                    onClick={() => setSelectedCategory(categoryName)}
                    className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
                      isActive
                        ? 'border-[#f02d82] bg-[#f02d82] text-white shadow-lg shadow-pink-950/20'
                        : 'border-white/10 bg-white/[0.035] text-[#d7c6cf] hover:border-pink-400/40 hover:bg-white/[0.07]'
                    }`}
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          )}

          {visibleCategories.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-12 text-center">
              <span className="text-4xl" aria-hidden="true">
                🍣
              </span>
              <p className="mt-4 font-semibold">
                El menú estará disponible pronto.
              </p>
              <p className="mt-2 text-sm text-[#bda6b1]">
                No hay productos para mostrar en este momento.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-10 sm:mt-8 sm:space-y-12">
              {visibleCategories.map((category) => (
                <section
                  key={category.category}
                  aria-label={category.category}
                >
                  {selectedCategory === 'Todos' && (
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-6 w-1 rounded-full bg-[#f02d82]" />
                      <h3 className="text-lg font-extrabold sm:text-xl">
                        {category.category}
                      </h3>
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-[#bda6b1]">
                        {category.items.length}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                    {category.items.map((product) => {
                      const cartItem = cart.find(
                        (item) =>
                          String(item.id) === String(product.id),
                      );

                      return (
                        <article
                          key={String(product.id)}
                          className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1a0d14] transition duration-300 hover:-translate-y-1 hover:border-pink-400/30 hover:shadow-xl hover:shadow-black/20"
                        >
                          <div className="relative h-52 overflow-hidden bg-[#24101b] sm:h-56">
                            <ProductImage
                              src={product.image}
                              alt={product.name}
                            />

                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />

                            {cartItem && (
                              <span className="absolute right-3 top-3 rounded-full border border-pink-300/20 bg-[#e82b7e] px-3 py-1 text-xs font-bold text-white shadow-lg">
                                En el pedido: {cartItem.quantity}
                              </span>
                            )}
                          </div>

                          <div className="p-4 sm:p-5">
                            <h4 className="text-base font-bold leading-snug text-white sm:text-lg">
                              {product.name}
                            </h4>

                            {product.description ? (
                              <p className="mt-2 min-h-10 text-sm leading-5 text-[#bda6b1]">
                                {product.description}
                              </p>
                            ) : (
                              <p className="mt-2 min-h-10 text-sm leading-5 text-[#8f7883]">
                                Una opción deliciosa para disfrutar.
                              </p>
                            )}

                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-[#9f8994]">
                                  Precio
                                </p>
                                <p className="mt-1 text-xl font-black text-[#ff75af]">
                                  {formatUSD(Number(product.price) || 0)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => addToCart(product)}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ed2c81] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ff4896] active:scale-[0.97]"
                                aria-label={`Agregar ${product.name} al pedido`}
                              >
                                <span className="text-lg leading-none">
                                  +
                                </span>
                                Agregar
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        {/* Información de tasa y zonas */}
        <section className="mb-8 mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#bda6b1]">
                  Tasa de cambio
                </p>
                <p className="mt-2 text-xl font-black">
                  Bs. {formatVES(exchangeRate)}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.06] p-3 text-xl" aria-hidden="true">
                $
              </div>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#a9939e]">
              {isLoadingExchangeRate
                ? 'Consultando tasa disponible…'
                : exchangeRateMessage ||
                  'La tasa se consulta automáticamente cada 60 segundos.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#bda6b1]">
              Zonas de entrega
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 px-3 py-2 text-sm text-[#e5d5dd]">
                Guarenas · $2
              </span>
              <span className="rounded-full border border-white/10 px-3 py-2 text-sm text-[#e5d5dd]">
                Guatire · $3
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-[#a9939e]">
              El costo de delivery se suma al total únicamente cuando
              seleccionas esa modalidad.
            </p>
          </div>
        </section>
      </main>

      {/* Barra inferior del carrito */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#160a11]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex min-w-0 items-center gap-3 text-left"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f02d82] font-black">
                {totalItems}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold">
                  Tu pedido
                </p>
                <p className="text-xs text-[#bda6b1]">
                  {totalItems === 1
                    ? '1 producto'
                    : `${totalItems} productos`}
                </p>
              </div>
            </button>

            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wider text-[#bda6b1]">
                Subtotal
              </p>
              <p className="text-lg font-black text-[#ff75af]">
                {formatUSD(subtotal)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#29121d] transition hover:bg-[#ffe6f0]"
            >
              Ver pedido
            </button>
          </div>
        </div>
      )}

      {/* Panel del carrito y formulario */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
          role="presentation"
        >
          <section
            className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#140910] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Cabecera del panel */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4 sm:px-6">
              <div>
                <h2
                  id="cart-title"
                  className="text-xl font-black"
                >
                  Tu pedido
                </h2>
                <p className="mt-1 text-xs text-[#bda6b1]">
                  Revisa tus productos antes de confirmar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-xl text-[#e8d8e0] transition hover:bg-white/[0.07]"
                aria-label="Cerrar carrito"
              >
                ×
              </button>
            </div>

            {/* Contenido desplazable */}
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
              {/* Productos del carrito */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold">
                    Productos seleccionados
                  </h3>
                  <span className="text-xs text-[#bda6b1]">
                    {totalItems} unidades
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center">
                    <span className="text-4xl" aria-hidden="true">
                      🛒
                    </span>
                    <p className="mt-3 text-sm font-semibold">
                      Tu carrito está vacío
                    </p>
                    <p className="mt-1 text-xs text-[#bda6b1]">
                      Agrega tus favoritos desde el menú.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 rounded-xl bg-[#ed2c81] px-4 py-2.5 text-sm font-bold"
                    >
                      Volver al menú
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={String(item.id)}
                        className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3a1728] text-xl">
                          🍣
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-[#ff75af]">
                            {formatUSD(item.price * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="mt-1 text-[11px] text-[#bda6b1] underline decoration-white/20 underline-offset-2 hover:text-white"
                          >
                            Eliminar
                          </button>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-lg transition hover:bg-white/10"
                            aria-label={`Quitar una unidad de ${item.name}`}
                          >
                            −
                          </button>

                          <span className="w-5 text-center text-sm font-bold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-lg transition hover:bg-white/10"
                            aria-label={`Agregar una unidad de ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Datos del cliente */}
              <section>
                <h3 className="mb-3 text-sm font-bold">
                  Datos del cliente
                </h3>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="mb-1.5 block text-xs font-medium text-[#d4c1cb]"
                    >
                      Nombre y apellido
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      autoComplete="name"
                      value={customerName}
                      onChange={(event) =>
                        setCustomerName(event.target.value)
                      }
                      placeholder="¿A nombre de quién va el pedido?"
                      className="w-full rounded-xl border border-white/10 bg-[#21111a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#806b76] focus:border-pink-400/60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="mb-1.5 block text-xs font-medium text-[#d4c1cb]"
                    >
                      Teléfono de contacto
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      autoComplete="tel"
                      value={customerPhone}
                      onChange={(event) =>
                        setCustomerPhone(event.target.value)
                      }
                      placeholder="Ej. 0412 123 4567"
                      className="w-full rounded-xl border border-white/10 bg-[#21111a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#806b76] focus:border-pink-400/60"
                    />
                  </div>
                </div>
              </section>

              {/* Modalidad del pedido */}
              <section>
                <h3 className="mb-3 text-sm font-bold">
                  ¿Cómo deseas recibirlo?
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Local / Mesa', icon: '🍽️' },
                    { label: 'Pickup', icon: '🛍️' },
                    { label: 'Delivery', icon: '🛵' },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setOrderType(option.label)}
                      className={`rounded-xl border px-2 py-3 text-center transition ${
                        orderType === option.label
                          ? 'border-[#f02d82] bg-[#f02d82]/10 text-white'
                          : 'border-white/10 bg-white/[0.025] text-[#c8b5bf] hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="block text-xl">
                        {option.icon}
                      </span>
                      <span className="mt-1 block text-[11px] font-bold sm:text-xs">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>

                {orderType === 'Delivery' && (
                  <div className="mt-4 space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
                    <div>
                      <label
                        htmlFor="deliveryZone"
                        className="mb-1.5 block text-xs font-medium text-[#d4c1cb]"
                      >
                        Zona de entrega
                      </label>
                      <select
                        id="deliveryZone"
                        value={deliveryZone}
                        onChange={(event) =>
                          setDeliveryZone(event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#21111a] px-4 py-3 text-sm text-white outline-none focus:border-pink-400/60"
                      >
                        <option value="Guarenas">
                          Guarenas — $2
                        </option>
                        <option value="Guatire">
                          Guatire — $3
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="deliveryAddress"
                        className="mb-1.5 block text-xs font-medium text-[#d4c1cb]"
                      >
                        Dirección detallada
                      </label>
                      <textarea
                        id="deliveryAddress"
                        value={deliveryAddress}
                        onChange={(event) =>
                          setDeliveryAddress(event.target.value)
                        }
                        rows={3}
                        placeholder="Sector, calle, casa, referencia..."
                        className="w-full resize-y rounded-xl border border-white/10 bg-[#21111a] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#806b76] focus:border-pink-400/60"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Método de pago */}
              <section>
                <h3 className="mb-3 text-sm font-bold">
                  Método de pago
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-xl border px-3 py-3 text-left text-xs font-semibold transition sm:text-sm ${
                        paymentMethod === method
                          ? 'border-[#f02d82] bg-[#f02d82]/10 text-white'
                          : 'border-white/10 bg-white/[0.025] text-[#c8b5bf] hover:bg-white/[0.06]'
                      }`}
                    >
                      <span
                        className={`mr-2 inline-block h-2 w-2 rounded-full ${
                          paymentMethod === method
                            ? 'bg-[#ff4b98]'
                            : 'bg-[#79616d]'
                        }`}
                      />
                      {method}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Resumen y confirmación */}
            <div className="border-t border-white/[0.08] bg-[#170a12] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              <div className="space-y-2">
                <div className="flex justify-between gap-3 text-sm text-[#c5b2bc]">
                  <span>Subtotal</span>
                  <span>{formatUSD(subtotal)}</span>
                </div>

                {orderType === 'Delivery' && (
                  <div className="flex justify-between gap-3 text-sm text-[#c5b2bc]">
                    <span>Delivery ({deliveryZone})</span>
                    <span>{formatUSD(deliveryCost)}</span>
                  </div>
                )}

                <div className="flex items-end justify-between gap-3 border-t border-white/[0.08] pt-3">
                  <div>
                    <p className="text-xs text-[#bda6b1]">
                      Total del pedido
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#ff75af]">
                      {formatUSD(total)}
                    </p>
                    <p className="mt-1 text-xs text-[#bda6b1]">
                      Bs. {formatVES(totalBs)}
                    </p>
                  </div>

                  <p className="max-w-32 text-right text-[10px] leading-4 text-[#9d8792]">
                    Tasa: Bs. {formatVES(exchangeRate)} por USD
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={checkoutWhatsApp}
                disabled={cart.length === 0 || isSubmitting}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ed2c81] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#ff4896] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Procesando pedido...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M20.52 3.48A11.8 11.8 0 0 0 12.1 0C5.55 0 .22 5.33.22 11.88c0 2.1.55 4.16 1.6 5.97L.12 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.88-5.33 11.88-11.88a11.8 11.8 0 0 0-3.47-8.44ZM12.1 21.78a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.65-.23-.37a9.83 9.83 0 0 1-1.5-5.27c0-5.46 4.44-9.9 9.9-9.9 2.64 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.9-9.9 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.1 4.49.71.31 1.27.5 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.08-.13-.27-.2-.57-.35Z" />
                    </svg>
                    Confirmar pedido por WhatsApp
                  </>
                )}
              </button>

              <p className="mt-2 text-center text-[10px] leading-4 text-[#8f7883]">
                Tu pedido se registra y luego se prepara el mensaje
                para enviarlo a TAKO TAKO.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Pie de página */}
      <footer className="border-t border-white/[0.07] px-4 py-8 text-center">
        <p className="text-sm font-black tracking-[0.18em]">
          TAKO <span className="text-[#ff4b98]">TAKO</span>
        </p>
        <p className="mt-2 text-xs text-[#9f8994]">
          Sushi, rolls y buenos momentos.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-xs text-[#c6a9b8] underline decoration-white/20 underline-offset-4 transition hover:text-white"
        >
          Acceso al sistema
        </Link>
      </footer>
    </div>
  );
}
