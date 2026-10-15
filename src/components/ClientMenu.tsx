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

function moneyUSD(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function moneyVES(value: number) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function ProductPhoto({
  src,
  name,
}: {
  src?: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f3e8e5]">
        <div className="text-center">
          <span className="text-5xl" aria-hidden="true">
            🍣
          </span>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a777e]">
            Tako Tako
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
    />
  );
}

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: 'bag' | 'plus' | 'minus' | 'close' | 'arrow' | 'pin' | 'clock';
  className?: string;
}) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'bag':
      return (
        <svg {...common}>
          <path d="M5 8h14l1 13H4L5 8Z" />
          <path d="M9 9V6a3 3 0 0 1 6 0v3" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'minus':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="m18 6-12 12M6 6l12 12" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
  }
}

export default function ClientMenu({
  initialCategories,
}: ClientMenuProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [orderType, setOrderType] = useState('Delivery');
  const [deliveryZone, setDeliveryZone] = useState('Guarenas');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(
    'Efectivo / Divisas',
  );

  const [exchangeRate, setExchangeRate] = useState(
    DEFAULT_EXCHANGE_RATE,
  );
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  const [rateMessage, setRateMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadRate = async () => {
      try {
        const response = await fetch('/api/exchange-rate', {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error('No se pudo consultar la tasa.');
        }

        if (mounted && data?.success && Number(data.rate) > 0) {
          setExchangeRate(Number(data.rate));
          setRateMessage('');
        } else if (mounted) {
          setRateMessage('Tasa no actualizada; se conserva la disponible.');
        }
      } catch (error) {
        console.error('Error consultando tasa:', error);

        if (mounted) {
          setRateMessage('No se pudo actualizar la tasa.');
        }
      } finally {
        if (mounted) {
          setIsLoadingRate(false);
        }
      }
    };

    void loadRate();
    const interval = window.setInterval(loadRate, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const categories = useMemo(
    () =>
      initialCategories.filter(
        (category) =>
          category &&
          Array.isArray(category.items) &&
          category.items.length > 0,
      ),
    [initialCategories],
  );

  const categoryOptions = useMemo(
    () => ['Todos', ...categories.map((category) => category.category)],
    [categories],
  );

  const visibleCategories = useMemo(
    () =>
      activeCategory === 'Todos'
        ? categories
        : categories.filter(
            (category) => category.category === activeCategory,
          ),
    [activeCategory, categories],
  );

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const deliveryCost =
    orderType === 'Delivery'
      ? deliveryZone === 'Guatire'
        ? 3
        : 2
      : 0;

  const total = subtotal + deliveryCost;
  const totalBs = total * exchangeRate;

  const addToCart = (product: MenuItem) => {
    setCart((current) => {
      const exists = current.some(
        (item) => String(item.id) === String(product.id),
      );

      if (exists) {
        return current.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          quantity: 1,
        },
      ];
    });
  };

  const changeQuantity = (
    id: number | string,
    amount: number,
  ) => {
    setCart((current) =>
      current
        .map((item) =>
          String(item.id) === String(id)
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (id: number | string) => {
    setCart((current) =>
      current.filter((item) => String(item.id) !== String(id)),
    );
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('Agrega productos antes de continuar.');
      return;
    }

    if (!customerName.trim()) {
      alert('Escribe el nombre de la persona que hace el pedido.');
      return;
    }

    if (!customerPhone.trim()) {
      alert('Escribe un teléfono de contacto.');
      return;
    }

    if (orderType === 'Delivery' && !deliveryAddress.trim()) {
      alert('Escribe la dirección donde se entregará el pedido.');
      return;
    }

    if (isLoadingRate) {
      alert('Espera un momento mientras se consulta la tasa.');
      return;
    }

    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      alert('La tasa de cambio no es válida.');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    // Se abre desde el clic del usuario para reducir bloqueos del navegador.
    const whatsappWindow = window.open('about:blank', '_blank');

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerDocument: '',
        orderType,
        deliveryZone: orderType === 'Delivery' ? deliveryZone : '',
        deliveryAddress:
          orderType === 'Delivery' ? deliveryAddress.trim() : '',
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
        body: JSON.stringify(payload),
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
      message += `📦 *Modalidad:* ${orderType}\n`;

      if (orderType === 'Delivery') {
        message += `📍 *Zona:* ${deliveryZone}\n`;
        message += `🏠 *Dirección:* ${deliveryAddress.trim()}\n`;
      }

      message += `💳 *Pago:* ${paymentMethod}\n\n`;
      message += `*DETALLE DEL PEDIDO*\n`;

      cart.forEach((item) => {
        message += `• ${item.quantity} x ${item.name}\n`;
        message += `  ${moneyUSD(item.price * item.quantity)}\n`;
      });

      message += `\n----------------------\n`;
      message += `Subtotal: ${moneyUSD(subtotal)}\n`;

      if (orderType === 'Delivery') {
        message += `Delivery: ${moneyUSD(deliveryCost)}\n`;
      }

      message += `*TOTAL: ${moneyUSD(total)}*\n`;
      message += `Total en Bs.: Bs. ${moneyVES(totalBs)}\n`;
      message += `Tasa: Bs. ${moneyVES(exchangeRate)} por USD\n`;
      message += `----------------------\n`;
      message += `¡Gracias por elegir TAKO TAKO!`;

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

      console.error('Error procesando pedido:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al procesar el pedido.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf7f3] pb-28 text-[#281820]">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-[#e8ddd7] bg-[#faf7f3]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#311b26] text-xl text-white">
              竹
            </div>
            <div>
              <p className="text-lg font-black leading-none tracking-[0.1em]">
                TAKO TAKO
              </p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#927a82]">
                Sushi · Rolls · Combos
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#927a82]">
                Tasa de referencia
              </p>
              <p className="mt-0.5 text-sm font-bold">
                Bs. {moneyVES(exchangeRate)}
              </p>
            </div>

            <Link
              href="/login"
              className="hidden text-sm font-semibold text-[#6d535e] transition hover:text-[#d92d70] sm:inline-block"
            >
              Acceso POS
            </Link>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-11 items-center gap-2 rounded-full bg-[#e93378] px-4 text-sm font-bold text-white transition hover:bg-[#cf2466] active:scale-95"
              aria-label={`Ver pedido, ${totalItems} productos`}
            >
              <Icon name="bag" className="h-4 w-4" />
              <span className="hidden sm:inline">Mi pedido</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-[#b8205a]">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div id="inicio" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Portada */}
        <section className="py-7 sm:py-10 lg:py-14">
          <div className="relative overflow-hidden rounded-[28px] bg-[#321b27] text-white">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/[0.08] sm:h-96 sm:w-96" />
            <div className="absolute -right-5 -top-8 h-48 w-48 rounded-full border border-white/[0.08] sm:h-72 sm:w-72" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#e93378]/15 blur-3xl sm:h-64 sm:w-64" />

            <div className="relative grid items-center gap-6 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-14 lg:py-14">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f4c9d9] sm:text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff79ad]" />
                  Guarenas · Guatire
                </div>

                <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  Un antojo
                  <br />
                  <span className="font-light italic text-[#ff83b4]">
                    merece algo
                  </span>
                  <br />
                  extraordinario.
                </h1>

                <p className="mt-5 max-w-md text-sm leading-7 text-[#e1d1d8] sm:text-base">
                  Explora nuestros combos y rolls, elige tus favoritos
                  y arma tu pedido en unos pocos pasos.
                </p>

                <a
                  href="#menu"
                  className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#f8eee9] px-5 py-3.5 text-sm font-bold text-[#321b27] transition hover:bg-white"
                >
                  Descubrir el menú
                  <Icon name="arrow" className="h-4 w-4" />
                </a>

                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#d6c2cc]">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="pin" className="h-4 w-4 text-[#ff83b4]" />
                    Guarenas y Guatire
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="bag" className="h-4 w-4 text-[#ff83b4]" />
                    Pedidos por WhatsApp
                  </span>
                </div>
              </div>

              <div className="relative mx-auto flex w-full max-w-md items-center justify-center py-3 lg:min-h-[320px]">
                <div className="absolute h-52 w-52 rounded-full bg-[#e93378]/15 blur-2xl sm:h-64 sm:w-64" />
                <div className="relative flex aspect-square w-[70%] max-w-[280px] items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#563044] to-[#25131d] shadow-2xl">
                  <div className="absolute inset-3 rounded-full border border-dashed border-white/15" />
                  <span className="text-[110px] drop-shadow-2xl sm:text-[140px]" aria-hidden="true">
                    🍣
                  </span>
                  <div className="absolute -bottom-2 right-0 rounded-2xl border border-white/10 bg-[#f7eee8] px-4 py-3 text-[#321b27] shadow-xl">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#967b85]">
                      Hecho para disfrutar
                    </p>
                    <p className="mt-1 text-sm font-black">
                      Tu próximo favorito
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Menú y navegación */}
        <section id="menu" className="scroll-mt-24 pb-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d52d70] sm:text-xs">
                Selección de la casa
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Explora el menú
              </h2>
              <p className="mt-2 text-sm text-[#856d77]">
                Encuentra algo delicioso para hoy.
              </p>
            </div>

            <p className="text-xs text-[#927a82]">
              {categories.reduce(
                (sum, category) => sum + category.items.length,
                0,
              )}{' '}
              opciones en el menú
            </p>
          </div>

          <nav
            className="mt-6 flex gap-2 overflow-x-auto pb-2"
            aria-label="Categorías del menú"
          >
            {categoryOptions.map((category) => {
              const active = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                    active
                      ? 'border-[#321b27] bg-[#321b27] text-white'
                      : 'border-[#e7d9d3] bg-white text-[#725964] hover:border-[#d52d70]/50 hover:text-[#bd255f]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </nav>

          {visibleCategories.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-[#e7d9d3] bg-white px-6 py-16 text-center">
              <div className="text-5xl" aria-hidden="true">
                🍣
              </div>
              <h3 className="mt-4 text-lg font-bold">
                Estamos preparando el menú
              </h3>
              <p className="mt-2 text-sm text-[#927a82]">
                Por ahora no hay productos disponibles en esta categoría.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-10 sm:mt-8 sm:space-y-12">
              {visibleCategories.map((category) => (
                <section
                  key={category.category}
                  aria-label={category.category}
                >
                  {activeCategory === 'Todos' && (
                    <div className="mb-4 flex items-center gap-3">
                      <h3 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                        {category.category}
                      </h3>
                      <span className="rounded-full bg-[#f0e4df] px-2.5 py-1 text-[10px] font-bold text-[#856d77]">
                        {category.items.length}
                      </span>
                      <div className="h-px flex-1 bg-[#e8dcd6]" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                    {category.items.map((product) => {
                      const inCart = cart.find(
                        (item) =>
                          String(item.id) === String(product.id),
                      );

                      return (
                        <article
                          key={String(product.id)}
                          className="group overflow-hidden rounded-[22px] border border-[#eee2dc] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#e4b5c7] hover:shadow-xl hover:shadow-[#4c2534]/[0.07]"
                        >
                          <div className="relative h-56 overflow-hidden bg-[#f3e8e5] sm:h-60">
                            <ProductPhoto
                              src={product.image}
                              name={product.name}
                            />

                            {inCart && (
                              <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#c92768] shadow-sm">
                                {inCart.quantity} en tu pedido
                              </div>
                            )}

                            <div className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1.5 text-sm font-black text-[#321b27] shadow-sm">
                              {moneyUSD(Number(product.price) || 0)}
                            </div>
                          </div>

                          <div className="p-4 sm:p-5">
                            <h4 className="text-lg font-extrabold leading-snug tracking-tight">
                              {product.name}
                            </h4>

                            <p className="mt-2 min-h-[40px] text-sm leading-5 text-[#8a737d]">
                              {product.description?.trim() ||
                                'Una deliciosa opción para disfrutar en cualquier momento.'}
                            </p>

                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#f0e7e2] pt-4">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a18a93]">
                                  Precio
                                </p>
                                <p className="mt-1 text-lg font-black text-[#d52d70]">
                                  {moneyUSD(Number(product.price) || 0)}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => addToCart(product)}
                                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#321b27] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#d52d70] active:scale-95 sm:text-sm"
                                aria-label={`Agregar ${product.name} al pedido`}
                              >
                                <Icon name="plus" className="h-4 w-4" />
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

        {/* Información práctica */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-4 rounded-2xl border border-[#eee2dc] bg-white p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f8e8ef] text-[#cf286b]">
              <Icon name="pin" />
            </div>
            <div>
              <h3 className="font-bold">¿Dónde entregamos?</h3>
              <p className="mt-1 text-sm leading-6 text-[#8a737d]">
                Delivery disponible en Guarenas y Guatire. Selecciona
                tu zona al completar el pedido.
              </p>
              <p className="mt-2 text-xs font-bold text-[#d52d70]">
                Guarenas $2 · Guatire $3
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-[#eee2dc] bg-white p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f8e8ef] text-[#cf286b]">
              <Icon name="clock" />
            </div>
            <div>
              <h3 className="font-bold">Tasa de referencia</h3>
              <p className="mt-1 text-sm leading-6 text-[#8a737d]">
                La tasa se consulta automáticamente y permite mostrar
                el equivalente de tu pedido en bolívares.
              </p>
              <p className="mt-2 text-xs font-bold text-[#d52d70]">
                {isLoadingRate
                  ? 'Consultando tasa…'
                  : `Bs. ${moneyVES(exchangeRate)} por USD`}
              </p>
              {rateMessage && (
                <p className="mt-1 text-xs text-[#927a82]">
                  {rateMessage}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Barra del pedido en móviles */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e9dcd6] bg-[#faf7f3]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(49,27,39,0.10)] backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex min-w-0 items-center gap-3 text-left"
            >
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#321b27] text-white">
                <Icon name="bag" className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e93378] px-1 text-[10px] font-black text-white">
                  {totalItems}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-xs text-[#856d77]">
                  {totalItems === 1
                    ? '1 producto seleccionado'
                    : `${totalItems} productos seleccionados`}
                </p>
                <p className="mt-0.5 truncate text-base font-black">
                  {moneyUSD(subtotal)}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e93378] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#cf2466]"
            >
              Continuar
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Carrito y confirmación */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#1d1017]/55 backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onClick={(event) => event.stopPropagation()}
            className="flex h-full w-full max-w-xl flex-col bg-[#faf7f3] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#e9dcd6] px-5 py-4 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d52d70]">
                  Casi listo
                </p>
                <h2 id="cart-title" className="mt-1 text-2xl font-black">
                  Tu pedido
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Cerrar pedido"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5d6d0] bg-white text-[#321b27] transition hover:bg-[#f0e4df]"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7">
              {/* Paso 1 */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-extrabold">1. Revisa tus productos</h3>
                  <span className="text-xs text-[#927a82]">
                    {totalItems} unidades
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d9c7c0] bg-white px-5 py-10 text-center">
                    <span className="text-4xl" aria-hidden="true">
                      🛍️
                    </span>
                    <p className="mt-3 font-bold">Aún no hay productos</p>
                    <p className="mt-1 text-sm text-[#927a82]">
                      Vuelve al menú y agrega tus favoritos.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 rounded-full bg-[#321b27] px-5 py-2.5 text-sm font-bold text-white"
                    >
                      Explorar menú
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={String(item.id)}
                        className="flex items-center gap-3 rounded-2xl border border-[#eee2dc] bg-white p-3"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f5e8e4] text-xl">
                          🍣
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm font-extrabold text-[#d52d70]">
                            {moneyUSD(item.price * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="mt-1 text-xs text-[#927a82] underline underline-offset-2 hover:text-[#c92768]"
                          >
                            Eliminar
                          </button>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label={`Reducir cantidad de ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5d6d0] bg-[#faf7f3] hover:bg-[#f0e4df]"
                          >
                            <Icon name="minus" className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-4 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label={`Aumentar cantidad de ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#321b27] text-white hover:bg-[#d52d70]"
                          >
                            <Icon name="plus" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Paso 2 */}
              <section>
                <h3 className="mb-3 font-extrabold">2. Tus datos</h3>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="mb-1.5 block text-xs font-bold text-[#725964]"
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
                      placeholder="Nombre de quien recibe el pedido"
                      className="w-full rounded-xl border border-[#e5d6d0] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b4a0a7] focus:border-[#d52d70] focus:ring-2 focus:ring-[#d52d70]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="mb-1.5 block text-xs font-bold text-[#725964]"
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
                      className="w-full rounded-xl border border-[#e5d6d0] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b4a0a7] focus:border-[#d52d70] focus:ring-2 focus:ring-[#d52d70]/10"
                    />
                  </div>
                </div>
              </section>

              {/* Paso 3 */}
              <section>
                <h3 className="mb-3 font-extrabold">
                  3. ¿Cómo quieres recibirlo?
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'Delivery', title: 'Delivery', icon: '🛵' },
                    { value: 'Pickup', title: 'Retirar', icon: '🛍️' },
                    {
                      value: 'Local / Mesa',
                      title: 'En el local',
                      icon: '🍽️',
                    },
                  ].map((option) => {
                    const selected = orderType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setOrderType(option.value)}
                        className={`rounded-2xl border px-2 py-3 transition ${
                          selected
                            ? 'border-[#d52d70] bg-[#fbe8f0] text-[#b8205a]'
                            : 'border-[#e5d6d0] bg-white text-[#725964] hover:border-[#d52d70]/50'
                        }`}
                      >
                        <span className="block text-xl">{option.icon}</span>
                        <span className="mt-1 block text-[11px] font-bold sm:text-xs">
                          {option.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {orderType === 'Delivery' && (
                  <div className="mt-3 space-y-3 rounded-2xl border border-[#eee2dc] bg-white p-4">
                    <div>
                      <label
                        htmlFor="deliveryZone"
                        className="mb-1.5 block text-xs font-bold text-[#725964]"
                      >
                        Zona de entrega
                      </label>
                      <select
                        id="deliveryZone"
                        value={deliveryZone}
                        onChange={(event) =>
                          setDeliveryZone(event.target.value)
                        }
                        className="w-full rounded-xl border border-[#e5d6d0] bg-[#faf7f3] px-4 py-3 text-sm outline-none focus:border-[#d52d70]"
                      >
                        <option value="Guarenas">Guarenas — $2</option>
                        <option value="Guatire">Guatire — $3</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="deliveryAddress"
                        className="mb-1.5 block text-xs font-bold text-[#725964]"
                      >
                        Dirección y referencia
                      </label>
                      <textarea
                        id="deliveryAddress"
                        rows={3}
                        value={deliveryAddress}
                        onChange={(event) =>
                          setDeliveryAddress(event.target.value)
                        }
                        placeholder="Sector, calle, casa y punto de referencia"
                        className="w-full resize-y rounded-xl border border-[#e5d6d0] bg-[#faf7f3] px-4 py-3 text-sm outline-none placeholder:text-[#b4a0a7] focus:border-[#d52d70]"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Paso 4 */}
              <section>
                <h3 className="mb-3 font-extrabold">4. Forma de pago</h3>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const selected = paymentMethod === method;

                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition sm:text-sm ${
                          selected
                            ? 'border-[#d52d70] bg-[#fbe8f0] text-[#b8205a]'
                            : 'border-[#e5d6d0] bg-white text-[#725964] hover:border-[#d52d70]/50'
                        }`}
                      >
                        <span className="mb-2 block text-sm">
                          {selected ? '●' : '○'}
                        </span>
                        {method}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Total y botón final */}
            <div className="border-t border-[#e9dcd6] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-[#856d77]">
                  <span>Subtotal</span>
                  <span>{moneyUSD(subtotal)}</span>
                </div>

                {orderType === 'Delivery' && (
                  <div className="flex justify-between text-sm text-[#856d77]">
                    <span>Delivery · {deliveryZone}</span>
                    <span>{moneyUSD(deliveryCost)}</span>
                  </div>
                )}

                <div className="flex items-end justify-between gap-4 border-t border-[#eee2dc] pt-3">
                  <div>
                    <p className="text-xs font-semibold text-[#856d77]">
                      Total a pagar
                    </p>
                    <p className="mt-1 text-2xl font-black tracking-tight">
                      {moneyUSD(total)}
                    </p>
                    <p className="mt-1 text-xs text-[#927a82]">
                      Bs. {moneyVES(totalBs)}
                    </p>
                  </div>

                  <p className="max-w-32 text-right text-[10px] leading-4 text-[#a18a93]">
                    Tasa: Bs. {moneyVES(exchangeRate)} por USD
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={submitOrder}
                disabled={cart.length === 0 || isSubmitting}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#e93378] px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#cf2466] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Procesando pedido...
                  </>
                ) : (
                  <>
                    Confirmar pedido por WhatsApp
                    <Icon name="arrow" className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="mt-2 text-center text-[10px] leading-4 text-[#a18a93]">
                Al continuar, se registrará el pedido y se abrirá
                WhatsApp para enviarlo.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Pie de página */}
      <footer className="border-t border-[#e8dcd6] px-4 py-8 text-center">
        <p className="text-sm font-black tracking-[0.2em]">
          TAKO TAKO
        </p>
        <p className="mt-2 text-xs text-[#927a82]">
          Una buena elección empieza con algo delicioso.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-block text-xs font-semibold text-[#927a82] underline decoration-[#d9c7c0] underline-offset-4 hover:text-[#d52d70]"
        >
          Acceso al sistema
        </Link>
      </footer>
    </main>
  );
}
