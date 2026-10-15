'use client';

import { useEffect, useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const [orderType, setOrderType] = useState('Local / Mesa');
  const [deliveryZone, setDeliveryZone] = useState('Guarenas');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo / Divisas');

  // Tasa de respaldo por si todavía no existe una tasa registrada.
  const [exchangeRate, setExchangeRate] = useState(778.33);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================
  // CARGAR TASA ACTUAL DESDE LA BASE DE DATOS
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    const loadExchangeRate = async () => {
      try {
        setIsLoadingExchangeRate(true);
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
  // FILTRAR CATEGORÍAS Y PRODUCTOS
  // ============================================================
  const filteredCategories = useMemo(() => {
    return initialCategories
      .map((cat) => {
        const filteredItems = cat.items.filter((item) => {
          const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description &&
              item.description.toLowerCase().includes(searchQuery.toLowerCase()));
          return matchesSearch;
        });
        return {
          ...cat,
          items: filteredItems,
        };
      })
      .filter((cat) => {
        const matchesCategoryTab =
          selectedCategory === 'Todos' || cat.category === selectedCategory;
        return matchesCategoryTab && cat.items.length > 0;
      });
  }, [initialCategories, searchQuery, selectedCategory]);

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
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof cart
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryCost =
    orderType === 'Delivery' ? (deliveryZone === 'Guarenas' ? 2 : 3) : 0;

  const totalPrice = (subtotalPrice + deliveryCost).toFixed(2);
  const totalBs = (parseFloat(totalPrice) * exchangeRate).toFixed(2);

  // ============================================================
  // ENVIAR PEDIDO
  // ============================================================
  const checkoutWhatsApp = async () => {
    if (cart.length === 0) {
      alert('Agrega al menos un producto al carrito.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor ingresa tu Nombre y Teléfono de contacto.');
      return;
    }

    if (orderType === 'Delivery' && !deliveryAddress.trim()) {
      alert('Por favor ingresa la dirección exacta para el delivery.');
      return;
    }

    if (isLoadingExchangeRate) {
      alert('Estamos actualizando la tasa de cambio. Intenta nuevamente en unos segundos.');
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
          deliveryAddress: orderType === 'Delivery' ? deliveryAddress.trim() : '',
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
          data?.message || data?.error || 'Error al registrar el pedido.'
        );
      }
    } catch (error: any) {
      console.error('Error al registrar pedido:', error);
      alert(
        'Hubo un problema al registrar el pedido: ' +
          (error?.message || 'Error desconocido.')
      );
      setIsSubmitting(false);
      return;
    } finally {
      setIsSubmitting(false);
    }

    // WHATSAPP
    const phone = '584143065287';
    let message = `🍣 *NUEVO PEDIDO - TAKOSUSHI* 🍣\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📞 *Teléfono:* ${customerPhone}\n`;
    message += `📍 *Servicio:* ${orderType}${
      orderType === 'Delivery' ? ` (${deliveryZone})` : ''
    }\n`;

    if (orderType === 'Delivery') {
      message += `🏠 *Dirección:* ${deliveryAddress}\n`;
    }

    message += `💳 *Pago:* ${paymentMethod}\n`;
    message += `-----------------------------------\n`;

    cart.forEach((item) => {
      message += `• ${item.quantity}x ${item.name} ($${(
        item.price * item.quantity
      ).toFixed(2)})\n`;
    });

    message += `-----------------------------------\n`;

    if (orderType === 'Delivery') {
      message += `🛵 *Delivery:* $${deliveryCost.toFixed(2)}\n`;
    }

    message += `💵 *TOTAL USD:* $${totalPrice}\n`;
    message += `🇻🇪 *TOTAL BS (Tasa ${exchangeRate.toFixed(2)}):* Bs. ${totalBs}`;

    const encodedURL =
      `https://wa.me/${phone}?text=` + encodeURIComponent(message);
    window.open(encodedURL, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen justify-between w-full bg-[#0d0105] text-slate-100 font-sans">
      {/* HEADER ESTILO PEDIDOSYA */}
      <header className="border-b border-pink-950 px-4 sm:px-8 py-3.5 flex justify-between items-center bg-[#150106]/95 backdrop-blur-md sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-[#ff007f] text-white font-black px-3 py-1.5 rounded-xl text-sm shadow-md shadow-[#ff007f]/30 flex items-center gap-1.5">
            <span>🍣</span> TAKO TAKO
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-pink-400 font-bold">
              Guarenas - Guatire
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">
              {isLoadingExchangeRate
                ? 'Actualizando tasa...'
                : `BCV: Bs. ${exchangeRate.toFixed(2)} / $1`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="text-xs font-semibold text-pink-300 hover:text-white border border-pink-900/60 bg-pink-950/40 px-3 py-2 rounded-xl transition"
          >
            🔐 POS
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-[#ff007f] hover:bg-pink-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#ff007f]/30 transition transform active:scale-95"
          >
            <span>🛒</span>
            <span className="hidden xs:inline">Carrito</span>
            <span className="bg-white text-[#ff007f] px-1.5 py-0.5 rounded-full text-[10px] font-black">
              {totalItems}
            </span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        {/* HERO BANNER */}
        <div className="text-center mb-6">
          <span className="bg-[#ff007f]/15 text-pink-300 border border-[#ff007f]/30 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            ✨ Menú Digital en Vivo
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-wider uppercase mt-2.5 mb-1 text-yellow-400 drop-shadow">
            Nuestros Combos y Rolls
          </h1>
          <p className="text-pink-200/70 text-xs sm:text-sm max-w-sm mx-auto">
            Pide directo a tu casa en Guarenas y Guatire o ven a retirar.
          </p>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="mb-6 max-w-xl mx-auto relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pink-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Busca tu roll o combo favorito..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1b020a] border border-pink-900/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-pink-400/50 focus:outline-none focus:border-[#ff007f] shadow-inner transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-pink-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* CATEGORÍAS (PILLS / TABS HORIZONTALES) */}
        {initialCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('Todos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === 'Todos'
                  ? 'bg-[#ff007f] text-white shadow-[#ff007f]/30 scale-105'
                  : 'bg-[#1b020a] text-pink-200/80 border border-pink-900/40 hover:bg-pink-950'
              }`}
            >
              🔥 Todos
            </button>
            {initialCategories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  selectedCategory === cat.category
                    ? 'bg-[#ff007f] text-white shadow-[#ff007f]/30 scale-105'
                    : 'bg-[#1b020a] text-pink-200/80 border border-pink-900/40 hover:bg-pink-950'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        )}

        {/* LISTADO DE PRODUCTOS */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 text-pink-300/50">
            <p className="text-3xl mb-2">🍣</p>
            <p className="text-sm font-medium">No se encontraron productos con esa búsqueda.</p>
          </div>
        ) : (
          filteredCategories.map((cat, idx) => (
            <div key={idx} className="mb-10">
              <h2 className="text-yellow-400 font-extrabold text-base sm:text-lg mb-4 tracking-wide uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff007f]"></span>
                {cat.category}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.items.map((product: MenuItem) => {
                  const imageUrl =
                    typeof product.image === 'string'
                      ? product.image.trim()
                      : '';

                  return (
                    <div
                      key={product.id}
                      className="bg-[#180208] border border-pink-950 hover:border-pink-900/80 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                    >
                      {/* IMAGEN DE LA TARJETA */}
                      <div className="w-full h-40 bg-black/40 relative overflow-hidden flex-shrink-0">
                        {imageUrl &&
                        imageUrl !== 'NULL' &&
                        imageUrl !== 'EMPTY_STRING' ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition duration-500"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full bg-[#120004] flex items-center justify-center text-pink-500/40 text-[10px] font-semibold tracking-widest uppercase">
                                    📷 Sin imagen
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-[#120004] flex items-center justify-center text-pink-500/40 text-[10px] font-semibold tracking-widest uppercase">
                            📷 Sin imagen
                          </div>
                        )}
                        <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-yellow-400 font-black text-xs shadow">
                          ${product.price.toFixed(2)}
                        </div>
                      </div>

                      {/* DETALLES */}
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <h3 className="text-white font-bold text-sm tracking-wide mb-1 line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-pink-200/60 text-xs leading-relaxed line-clamp-2">
                            {product.description ||
                              'Delicioso plato preparado al momento con los mejores ingredientes.'}
                          </p>
                        </div>

                        <button
                          onClick={() => addToCart(product)}
                          className="w-full bg-[#ff007f]/20 hover:bg-[#ff007f] text-pink-200 hover:text-white border border-[#ff007f]/40 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <span>+</span> Agregar al Carrito
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      {/* BARRA INFERIOR FLOTANTE (ESTILO PEDIDOSYA) */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#150106]/95 border-t border-pink-950 p-3.5 backdrop-blur-xl z-40 flex justify-between items-center max-w-lg mx-auto sm:rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff007f] text-white flex items-center justify-center font-black text-xs shadow-md shadow-[#ff007f]/30">
              {totalItems}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-pink-400 font-bold">
                Total Carrito
              </p>
              <p className="text-base font-black text-yellow-400">
                ${totalPrice}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-[#ff007f] hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-[#ff007f]/40 transition flex items-center gap-1.5"
          >
            <span>Ver Pedido y Pagar</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* CARRITO / CHECKOUT DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-[#180208] w-full max-w-md h-full p-5 flex flex-col justify-between border-l border-pink-950 shadow-2xl overflow-y-auto">
            <div>
              {/* TÍTULO DRAWER */}
              <div className="flex justify-between items-center pb-3 border-b border-pink-950 mb-4">
                <h2 className="text-sm font-black text-yellow-400 uppercase tracking-wide flex items-center gap-2">
                  <span>🛒</span> Tu Pedido Actual
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-pink-950/60 text-pink-300 hover:text-white font-bold text-xs px-2.5 py-1 rounded-lg border border-pink-900/50"
                >
                  ✕ Cerrar
                </button>
              </div>

              {/* LISTA DE ÍTEMS */}
              {cart.length === 0 ? (
                <div className="text-center py-12 text-pink-300/50">
                  <p className="text-3xl mb-2">🍣</p>
                  <p className="text-xs">Tu carrito está vacío.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1 mb-4 scrollbar-none">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#110004] p-3 rounded-xl border border-pink-950 flex justify-between items-center"
                    >
                      <div className="pr-2">
                        <h4 className="font-bold text-xs text-yellow-200 line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-pink-400 font-medium">
                          ${item.price.toFixed(2)} c/u
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-pink-950/80 w-6 h-6 rounded-lg font-bold text-xs hover:bg-pink-900 flex items-center justify-center text-pink-300"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs w-4 text-center text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-pink-950/80 w-6 h-6 rounded-lg font-bold text-xs hover:bg-pink-900 flex items-center justify-center text-pink-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-pink-950 pt-3 space-y-3">
                {/* FORMULARIO DE DATOS */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-pink-300/80 mb-1">
                      Tu Nombre:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos Pérez"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#110004] border border-pink-950 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-pink-300/80 mb-1">
                      Teléfono:
                    </label>
                    <input
                      type="text"
                      placeholder="0412-0000000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#110004] border border-pink-950 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-pink-300/80 mb-1">
                    Tipo de Servicio:
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-[#110004] border border-pink-950 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                  >
                    <option value="Local / Mesa">🍽️ Comer en Local / Mesa</option>
                    <option value="Pickup">🏃‍♂️ Retirar en Local (Pickup)</option>
                    <option value="Delivery">🛵 Delivery a Domicilio</option>
                  </select>
                </div>

                {orderType === 'Delivery' && (
                  <div className="space-y-2 bg-[#110004] p-2.5 rounded-xl border border-pink-950">
                    <div>
                      <label className="block text-[10px] font-semibold text-pink-300/80 mb-1">
                        Zona de Delivery:
                      </label>
                      <select
                        value={deliveryZone}
                        onChange={(e) => setDeliveryZone(e.target.value)}
                        className="w-full bg-[#170106] border border-pink-950 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        <option value="Guarenas">Guarenas ($2.00)</option>
                        <option value="Guatire">Guatire ($3.00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-pink-300/80 mb-1">
                        Dirección Exacta:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Urb. Trapichito..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-[#170106] border border-pink-950 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-pink-300/80 mb-1">
                    Método de Pago:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#110004] border border-pink-950 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                  >
                    <option value="Efectivo / Divisas">💵 Efectivo Divisas ($)</option>
                    <option value="Pago Móvil (Bs)">📱 Pago Móvil (Bolívares)</option>
                    <option value="Zelle / Binance">🌐 Zelle / Binance</option>
                  </select>
                </div>

                {/* RESUMEN DE TOTALES */}
                <div className="bg-[#110004] p-2.5 rounded-xl border border-pink-950 space-y-1 text-xs">
                  <div className="flex justify-between text-pink-300/70">
                    <span>Subtotal:</span>
                    <span>${subtotalPrice.toFixed(2)}</span>
                  </div>

                  {orderType === 'Delivery' && (
                    <div className="flex justify-between text-pink-300/70">
                      <span>Delivery ({deliveryZone}):</span>
                      <span>${deliveryCost.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-xs text-yellow-400 pt-1.5 border-t border-pink-950">
                    <span>Total USD:</span>
                    <span>${totalPrice}</span>
                  </div>

                  <div className="flex justify-between font-bold text-pink-200">
                    <span>
                      Bolívares ({isLoadingExchangeRate ? '...' : `Tasa ${exchangeRate.toFixed(2)}`}):
                    </span>
                    <span>Bs. {isLoadingExchangeRate ? '...' : totalBs}</span>
                  </div>
                </div>

                {/* BOTÓN WHATSAPP */}
                <button
                  onClick={checkoutWhatsApp}
                  disabled={isSubmitting || isLoadingExchangeRate}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
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
      <footer className="border-t border-pink-950 py-4 text-center text-[11px] text-pink-400/50 bg-[#150106]">
        <p>Takosushi • Guarenas y Guatire.</p>
      </footer>
    </div>
  );
}
