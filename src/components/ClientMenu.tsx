```tsx
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

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function ClientMenu({
  initialCategories,
}: {
  initialCategories: MenuCategory[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [orderType, setOrderType] = useState('Local / Mesa');
  const [deliveryZone, setDeliveryZone] = useState('Guarenas');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo / Divisas');

  const [exchangeRate, setExchangeRate] = useState(778.33);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // ============================================================
  // TASA DE CAMBIO
  // ============================================================

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
          response.ok &&
          data?.success &&
          Number(data.rate) > 0
        ) {
          setExchangeRate(Number(data.rate));
        }
      } catch (error) {
        console.error('Error obteniendo la tasa de cambio:', error);
      } finally {
        if (isMounted) {
          setIsLoadingExchangeRate(false);
        }
      }
    };

    loadExchangeRate();

    const interval = setInterval(loadExchangeRate, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // CATEGORÍAS Y BÚSQUEDA
  // ============================================================

  const categories = [
    'Todos',
    ...initialCategories.map((cat) => cat.category),
  ];

  const visibleCategories = initialCategories
    .filter(
      (cat) =>
        selectedCategory === 'Todos' ||
        cat.category === selectedCategory
    )
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((product) => {
        const query = searchTerm.trim().toLowerCase();

        return (
          !query ||
          product.name.toLowerCase().includes(query) ||
          (product.description || '').toLowerCase().includes(query)
        );
      }),
    }))
    .filter((cat) => cat.items.length > 0);

  // ============================================================
  // CARRITO
  // ============================================================

  const addToCart = (product: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
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

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;

          const quantity = item.quantity + delta;

          return quantity > 0 ? { ...item, quantity } : null;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryCost =
    orderType === 'Delivery'
      ? deliveryZone === 'Guarenas'
        ? 2
        : 3
      : 0;

  const totalPrice = (subtotalPrice + deliveryCost).toFixed(2);

  const totalBs = (
    parseFloat(totalPrice) * exchangeRate
  ).toFixed(2);

  // ============================================================
  // REGISTRAR PEDIDO Y ABRIR WHATSAPP
  // ============================================================

  const checkoutWhatsApp = async () => {
    if (cart.length === 0) {
      alert('Agrega al menos un producto al carrito.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor ingresa tu nombre y teléfono de contacto.');
      return;
    }

    if (orderType === 'Delivery' && !deliveryAddress.trim()) {
      alert('Por favor ingresa la dirección exacta para el delivery.');
      return;
    }

    if (isLoadingExchangeRate) {
      alert('Estamos actualizando la tasa de cambio. Intenta nuevamente.');
      return;
    }

    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      alert('No se pudo obtener una tasa de cambio válida.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerDocument: '',
          orderType,
          deliveryZone: orderType === 'Delivery' ? deliveryZone : '',
          deliveryAddress:
            orderType === 'Delivery' ? deliveryAddress.trim() : '',
          items: cart,
          total: parseFloat(totalPrice),
          totalBs: parseFloat(totalBs),
          exchangeRate,
          paymentMethod,
          created_at: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            data?.error ||
            'Error al registrar el pedido.'
        );
      }
    } catch (error: unknown) {
      console.error('Error al registrar pedido:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido.';

      alert(
        'Hubo un problema al registrar el pedido: ' + errorMessage
      );

      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    // Número actualizado: 0412-9269308
    // Formato internacional de Venezuela para WhatsApp.
    const phone = '584129269308';

    let message = '🍣 *NUEVO PEDIDO - TAKO TAKO* 🍣\n\n';

    message += `👤 *Cliente:* ${customerName.trim()}\n`;
    message += `📞 *Teléfono:* ${customerPhone.trim()}\n`;

    message += `📍 *Servicio:* ${orderType}${
      orderType === 'Delivery' ? ` (${deliveryZone})` : ''
    }\n`;

    if (orderType === 'Delivery') {
      message += `🏠 *Dirección:* ${deliveryAddress.trim()}\n`;
    }

    message += `💳 *Pago:* ${paymentMethod}\n`;
    message += '-----------------------------------\n';

    cart.forEach((item) => {
      message += `• ${item.quantity}x ${item.name} ($${(
        item.price * item.quantity
      ).toFixed(2)})\n`;
    });

    message += '-----------------------------------\n';

    if (orderType === 'Delivery') {
      message += `🛵 *Delivery:* $${deliveryCost.toFixed(2)}\n`;
    }

    message += `💵 *TOTAL USD:* $${totalPrice}\n`;
    message += `🇻🇪 *TOTAL BS (Tasa ${exchangeRate.toFixed(
      2
    )}):* Bs. ${totalBs}`;

    const encodedURL =
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(encodedURL, '_blank', 'noopener,noreferrer');
  };

  // ============================================================
  // INTERFAZ
  // ============================================================

  return (
    <div className="min-h-screen w-full bg-[#10090d] text-white">
      {/* ENCABEZADO */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#10090d]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e91e75] text-xl shadow-lg shadow-pink-900/20">
              🍣
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-wide text-white sm:text-lg">
                TAKO <span className="text-[#f05a98]">TAKO</span>
              </p>
              <p className="text-[10px] font-medium tracking-[0.14em] text-white/45 sm:text-xs">
                SUSHI · GUARENAS · GUATIRE
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/70">
                Tasa de cambio
              </p>
              <p className="text-xs font-bold text-emerald-300">
                {isLoadingExchangeRate
                  ? 'Actualizando...'
                  : `Bs. ${exchangeRate.toFixed(2)} / $1`}
              </p>
            </div>

            <Link
              href="/login"
              className="hidden rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 transition hover:border-white/20 hover:text-white sm:inline-flex"
            >
              Sistema POS
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 rounded-xl bg-[#e91e75] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#d81768] sm:px-4"
            >
              <span>🛒</span>
              <span className="hidden sm:inline">Mi pedido</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-[#c3165d]">
                {totalItems}
              </span>
            </button>
          </div>
        </div>

        <div className="border-t border-white/[0.05] px-4 py-2 text-center sm:hidden">
          <p className="text-[10px] text-emerald-300/80">
            {isLoadingExchangeRate
              ? 'Actualizando tasa de cambio...'
              : `Tasa de referencia: Bs. ${exchangeRate.toFixed(2)} por dólar`}
          </p>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        {/* PRESENTACIÓN */}
        <section className="mb-8">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e91e75]/20 bg-[#e91e75]/[0.08] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-pink-200/80">
                Nuestro menú
              </span>
            </div>

            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Pide tus <span className="text-[#f05a98]">favoritos.</span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-white/50 sm:text-base">
              Descubre nuestros sabores, elige tu combinación favorita y
              disfruta TAKO TAKO en casa o en nuestro local.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 sm:px-4">
              <p className="text-lg sm:text-xl">🍣</p>
              <p className="mt-1 text-[11px] font-semibold text-white/85 sm:text-sm">
                Hecho al momento
              </p>
              <p className="mt-1 hidden text-[10px] text-white/40 sm:block">
                Preparado para ti
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 sm:px-4">
              <p className="text-lg sm:text-xl">🛵</p>
              <p className="mt-1 text-[11px] font-semibold text-white/85 sm:text-sm">
                Delivery
              </p>
              <p className="mt-1 hidden text-[10px] text-white/40 sm:block">
                Guarenas y Guatire
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 sm:px-4">
              <p className="text-lg sm:text-xl">💳</p>
              <p className="mt-1 text-[11px] font-semibold text-white/85 sm:text-sm">
                Fácil de pedir
              </p>
              <p className="mt-1 hidden text-[10px] text-white/40 sm:block">
                Pedido por WhatsApp
              </p>
            </div>
          </div>
        </section>

        {/* BUSCADOR */}
        <section className="mb-5">
          <label htmlFor="menu-search" className="sr-only">
            Buscar productos
          </label>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 transition focus-within:border-[#e91e75]/50">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 shrink-0 text-white/35"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="m16 16 4 4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>

            <input
              id="menu-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="¿Qué se te antoja hoy?"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-white/50 hover:text-white"
                aria-label="Limpiar búsqueda"
              >
                Limpiar
              </button>
            )}
          </div>
        </section>

        {/* CATEGORÍAS */}
        <nav
          aria-label="Categorías del menú"
          className="mb-8 flex gap-2 overflow-x-auto pb-2"
        >
          {categories.map((category, index) => (
            <button
              key={`${category}-${index}`}
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-semibold transition sm:text-sm ${
                selectedCategory === category
                  ? 'border-[#e91e75] bg-[#e91e75] text-white shadow-md shadow-pink-950/20'
                  : 'border-white/10 bg-white/[0.025] text-white/55 hover:border-white/20 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </nav>

        {/* PRODUCTOS */}
        {initialCategories.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] px-5 py-20 text-center">
            <p className="text-4xl">🍣</p>
            <h2 className="mt-4 text-lg font-bold text-white">
              Nuestro menú se está preparando
            </h2>
            <p className="mt-2 text-sm text-white/45">
              Intenta nuevamente en unos momentos.
            </p>
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] px-5 py-16 text-center">
            <p className="text-3xl">🔎</p>
            <p className="mt-3 font-semibold text-white">
              No encontramos productos
            </p>
            <p className="mt-1 text-sm text-white/45">
              Prueba con otro nombre o selecciona otra categoría.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todos');
              }}
              className="mt-5 rounded-xl bg-[#e91e75] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#d81768]"
            >
              Ver todo el menú
            </button>
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-12">
            {visibleCategories.map((cat) => (
              <section key={cat.category}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#f05a98]">
                      Descubre nuestros sabores
                    </p>
                    <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                      {cat.category}
                    </h2>
                  </div>

                  <span className="shrink-0 pb-1 text-[10px] text-white/35 sm:text-xs">
                    {cat.items.length}{' '}
                    {cat.items.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                  {cat.items.map((product) => {
                    const imageUrl =
                      typeof product.image === 'string'
                        ? product.image.trim()
                        : '';

                    const hasImage =
                      imageUrl !== '' &&
                      imageUrl.toUpperCase() !== 'NULL' &&
                      imageUrl !== 'EMPTY_STRING';

                    return (
                      <article
                        key={product.id}
                        className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#191116] transition duration-300 hover:-translate-y-0.5 hover:border-[#e91e75]/40 hover:shadow-xl hover:shadow-black/20"
                      >
                        {/* FOTOGRAFÍA */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-[#21151c]">
                          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                            🍣
                          </div>

                          {hasImage && (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                          <div className="absolute bottom-3 left-3 rounded-lg border border-white/15 bg-black/55 px-2.5 py-1.5 backdrop-blur-md">
                            <span className="text-sm font-extrabold text-white">
                              ${Number(product.price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* INFORMACIÓN */}
                        <div className="flex flex-1 flex-col p-4 sm:p-5">
                          <h3 className="text-sm font-bold leading-snug text-white sm:text-base">
                            {product.name}
                          </h3>

                          <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-white/45">
                            {product.description ||
                              'Una deliciosa opción preparada con el sabor de TAKO TAKO.'}
                          </p>

                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                            <span className="text-[10px] font-medium text-white/35">
                              Precio en USD
                            </span>

                            <button
                              onClick={() => addToCart(product)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#e91e75] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#d81768] active:scale-[0.97]"
                            >
                              <span className="text-base leading-none">+</span>
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
      </main>

      {/* BARRA INFERIOR DEL PEDIDO */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#10090d]/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-6 sm:py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] text-white/45 sm:text-xs">
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
              </p>
              <p className="text-lg font-black text-white sm:text-xl">
                ${totalPrice}
              </p>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#e91e75] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-pink-950/25 transition hover:bg-[#d81768] sm:px-6 sm:text-sm"
            >
              Revisar pedido
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* PANEL DEL CARRITO */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-[#151015] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABECERA DEL CARRITO */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#151015]/95 px-5 py-4 backdrop-blur-xl">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#f05a98]">
                  TAKO TAKO
                </p>
                <h2
                  id="cart-title"
                  className="mt-1 text-lg font-extrabold text-white"
                >
                  Tu pedido
                </h2>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white"
                aria-label="Cerrar carrito"
              >
                ✕
              </button>
            </div>

            {/* PRODUCTOS DEL CARRITO */}
            <div className="flex-1 px-5 py-5">
              {cart.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-4xl">🛒</p>
                  <p className="mt-4 font-semibold text-white">
                    Tu carrito está vacío
                  </p>
                  <p className="mt-2 text-xs text-white/40">
                    Agrega tus favoritos para comenzar.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-5 rounded-xl bg-[#e91e75] px-4 py-2.5 text-xs font-bold text-white"
                  >
                    Explorar menú
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold leading-5 text-white">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-[11px] text-white/40">
                          ${item.price.toFixed(2)} por unidad
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#f05a98]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sm text-white transition hover:bg-white/10"
                          aria-label={`Quitar una unidad de ${item.name}`}
                        >
                          −
                        </button>

                        <span className="w-4 text-center text-xs font-bold text-white">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e91e75] text-sm font-bold text-white transition hover:bg-[#d81768]"
                          aria-label={`Agregar una unidad de ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DATOS DEL CLIENTE */}
              {cart.length > 0 && (
                <div className="mt-7 space-y-5">
                  <div>
                    <h3 className="mb-3 text-sm font-bold text-white">
                      Datos de contacto
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="customer-name"
                          className="mb-1.5 block text-[11px] font-medium text-white/55"
                        >
                          Nombre completo
                        </label>
                        <input
                          id="customer-name"
                          type="text"
                          autoComplete="name"
                          placeholder="Ej. Carlos Pérez"
                          value={customerName}
                          onChange={(e) =>
                            setCustomerName(e.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-3 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-[#e91e75]/60"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="customer-phone"
                          className="mb-1.5 block text-[11px] font-medium text-white/55"
                        >
                          Teléfono de contacto
                        </label>
                        <input
                          id="customer-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="0412-0000000"
                          value={customerPhone}
                          onChange={(e) =>
                            setCustomerPhone(e.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-3 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-[#e91e75]/60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TIPO DE SERVICIO */}
                  <div>
                    <label
                      htmlFor="order-type"
                      className="mb-2 block text-[11px] font-medium text-white/55"
                    >
                      ¿Cómo deseas recibir tu pedido?
                    </label>

                    <select
                      id="order-type"
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#211820] px-3.5 py-3 text-xs text-white outline-none focus:border-[#e91e75]/60"
                    >
                      <option value="Local / Mesa">
                        Comer en el local
                      </option>
                      <option value="Pickup">
                        Retirar en el local
                      </option>
                      <option value="Delivery">
                        Delivery a domicilio
                      </option>
                    </select>
                  </div>

                  {/* DATOS DE DELIVERY */}
                  {orderType === 'Delivery' && (
                    <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <div>
                        <label
                          htmlFor="delivery-zone"
                          className="mb-1.5 block text-[11px] font-medium text-white/55"
                        >
                          Zona de entrega
                        </label>
                        <select
                          id="delivery-zone"
                          value={deliveryZone}
                          onChange={(e) =>
                            setDeliveryZone(e.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#211820] px-3 py-2.5 text-xs text-white outline-none focus:border-[#e91e75]/60"
                        >
                          <option value="Guarenas">
                            Guarenas — $2.00
                          </option>
                          <option value="Guatire">
                            Guatire — $3.00
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="delivery-address"
                          className="mb-1.5 block text-[11px] font-medium text-white/55"
                        >
                          Dirección exacta
                        </label>
                        <textarea
                          id="delivery-address"
                          rows={3}
                          placeholder="Urbanización, calle, casa y referencias..."
                          value={deliveryAddress}
                          onChange={(e) =>
                            setDeliveryAddress(e.target.value)
                          }
                          className="w-full resize-y rounded-xl border border-white/10 bg-[#211820] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#e91e75]/60"
                        />
                      </div>
                    </div>
                  )}

                  {/* MÉTODO DE PAGO */}
                  <div>
                    <label
                      htmlFor="payment-method"
                      className="mb-1.5 block text-[11px] font-medium text-white/55"
                    >
                      Método de pago
                    </label>
                    <select
                      id="payment-method"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#211820] px-3.5 py-3 text-xs text-white outline-none focus:border-[#e91e75]/60"
                    >
                      <option value="Efectivo / Divisas">
                        Efectivo en divisas ($)
                      </option>
                      <option value="Pago Móvil (Bs)">
                        Pago móvil (Bs)
                      </option>
                      <option value="Zelle / Binance">
                        Zelle / Binance
                      </option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* TOTALES Y CONFIRMACIÓN */}
            {cart.length > 0 && (
              <div className="border-t border-white/[0.08] bg-[#10090d] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-white/50">
                    <span>Subtotal</span>
                    <span>${subtotalPrice.toFixed(2)}</span>
                  </div>

                  {orderType === 'Delivery' && (
                    <div className="flex justify-between text-white/50">
                      <span>Delivery · {deliveryZone}</span>
                      <span>${deliveryCost.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
                    <span className="font-semibold text-white">
                      Total a pagar
                    </span>
                    <span className="text-xl font-black text-white">
                      ${totalPrice}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-emerald-300/80">
                    <span>
                      Equivalente en bolívares
                      {isLoadingExchangeRate
                        ? ' · Actualizando tasa'
                        : ` · Tasa ${exchangeRate.toFixed(2)}`}
                    </span>
                    <span className="font-bold">
                      Bs. {isLoadingExchangeRate ? '...' : totalBs}
                    </span>
                  </div>
                </div>

                <button
                  onClick={checkoutWhatsApp}
                  disabled={isSubmitting || isLoadingExchangeRate}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Registrando pedido...'
                    : isLoadingExchangeRate
                    ? 'Actualizando tasa...'
                    : 'Enviar pedido por WhatsApp'}
                  {!isSubmitting && !isLoadingExchangeRate && (
                    <span>↗</span>
                  )}
                </button>

                <p className="mt-3 text-center text-[10px] leading-4 text-white/30">
                  Tu pedido se registrará antes de abrir WhatsApp para
                  confirmar los detalles.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* PIE DE PÁGINA */}
      <footer className="border-t border-white/[0.07] px-4 py-7 text-center">
        <p className="text-sm font-bold tracking-wide text-white/70">
          TAKO <span className="text-[#f05a98]">TAKO</span>
        </p>
        <p className="mt-1 text-[10px] text-white/35">
          Guarenas · Guatire · El sabor que disfrutas
        </p>
      </footer>
    </div>
  );
}
```
