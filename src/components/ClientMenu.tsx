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

  const [exchangeRate, setExchangeRate] = useState(778.33);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar Tasa BCV
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
        if (isMounted && response.ok && data?.success && Number(data.rate) > 0) {
          setExchangeRate(Number(data.rate));
        }
      } catch (error) {
        console.error('Error obteniendo la tasa de cambio:', error);
      } finally {
        if (isMounted) setIsLoadingExchangeRate(false);
      }
    };
    loadExchangeRate();
    const interval = setInterval(loadExchangeRate, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filtrar productos
  const filteredCategories = useMemo(() => {
    return initialCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description &&
              item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      }))
      .filter((cat) => {
        const matchesTab =
          selectedCategory === 'Todos' || cat.category === selectedCategory;
        return matchesTab && cat.items.length > 0;
      });
  }, [initialCategories, searchQuery, selectedCategory]);

  const addToCart = (product: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
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

  const getItemQuantity = (id: number) => {
    const item = cart.find((i) => i.id === id);
    return item ? item.quantity : 0;
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCost = orderType === 'Delivery' ? (deliveryZone === 'Guarenas' ? 2 : 3) : 0;
  const totalPrice = (subtotalPrice + deliveryCost).toFixed(2);
  const totalBs = (parseFloat(totalPrice) * exchangeRate).toFixed(2);

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

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(data?.message || data?.error || 'Error al registrar el pedido.');
      }
    } catch (error: any) {
      alert('Hubo un problema al registrar el pedido: ' + (error?.message || 'Error'));
      setIsSubmitting(false);
      return;
    } finally {
      setIsSubmitting(false);
    }

    const phone = '584143065287';
    let message = `🍣 *NUEVO PEDIDO - TAKOSUSHI* 🍣\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📞 *Teléfono:* ${customerPhone}\n`;
    message += `📍 *Servicio:* ${orderType}${orderType === 'Delivery' ? ` (${deliveryZone})` : ''}\n`;
    if (orderType === 'Delivery') message += `🏠 *Dirección:* ${deliveryAddress}\n`;
    message += `💳 *Pago:* ${paymentMethod}\n`;
    message += `-----------------------------------\n`;
    cart.forEach((item) => {
      message += `• ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
    });
    message += `-----------------------------------\n`;
    if (orderType === 'Delivery') message += `🛵 *Delivery:* $${deliveryCost.toFixed(2)}\n`;
    message += `💵 *TOTAL USD:* $${totalPrice}\n`;
    message += `🇻🇪 *TOTAL BS (Tasa ${exchangeRate.toFixed(2)}):* Bs. ${totalBs}`;

    window.open(`https://wa.me/${phone}?text=` + encodeURIComponent(message), '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen justify-between w-full bg-slate-950 text-slate-100 font-sans selection:bg-[#ff007f] selection:text-white">
      
      {/* 🚀 HEADER ESTILO PEDIDOSYA / GLOVO */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Marca / Zona */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff007f] to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20 font-black text-lg">
              🍣
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">TAKO TAKO</span>
                <span className="bg-pink-500/10 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/20 hidden xs:inline-block">
                  Guarenas
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                {isLoadingExchangeRate ? 'Actualizando tasa...' : `BCV: Bs. ${exchangeRate.toFixed(2)}`}
              </p>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <span>🔐</span> <span className="hidden sm:inline">Sistema POS</span>
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-[#ff007f] hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/25 transition active:scale-95"
            >
              <span>🛒</span>
              <span>Ver Carrito</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 🔍 BUSCADOR HERO & CATEGORÍAS */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/60 pt-6 pb-4 px-4 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Barra de Búsqueda Grande */}
          <div className="relative max-w-xl mx-auto">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="¿Qué se te antoja hoy? Busca rolls, combos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#ff007f] focus:ring-2 focus:ring-[#ff007f]/20 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categorías (Pills Horizontales) */}
          {initialCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none max-w-4xl mx-auto justify-start sm:justify-center">
              <button
                onClick={() => setSelectedCategory('Todos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  selectedCategory === 'Todos'
                    ? 'bg-[#ff007f] text-white shadow-lg shadow-pink-600/30 scale-105'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                🔥 Todos los Platos
              </button>
              {initialCategories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                    selectedCategory === cat.category
                      ? 'bg-[#ff007f] text-white shadow-lg shadow-pink-600/30 scale-105'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🍱 CONTENIDO PRINCIPAL (GRID DE PRODUCTOS MODERNO) */}
      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-4xl mb-3">🍣</p>
            <p className="text-sm font-semibold">No encontramos resultados para tu búsqueda.</p>
          </div>
        ) : (
          filteredCategories.map((cat, idx) => (
            <div key={idx} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-white font-black text-xl tracking-wide uppercase">
                  {cat.category}
                </h2>
                <div className="h-[1px] flex-1 bg-slate-800"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cat.items.map((product: MenuItem) => {
                  const imageUrl =
                    typeof product.image === 'string' ? product.image.trim() : '';
                  const qtyInCart = getItemQuantity(product.id);

                  return (
                    <div
                      key={product.id}
                      className="group bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-3xl overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl hover:shadow-pink-950/20 transition-all duration-300"
                    >
                      {/* Imagen de Producto */}
                      <div className="w-full h-48 bg-slate-950 relative overflow-hidden">
                        {imageUrl && imageUrl !== 'NULL' && imageUrl !== 'EMPTY_STRING' ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full bg-slate-950 flex items-center justify-center text-slate-600 text-xs font-semibold tracking-widest uppercase">
                                    📷 Sin imagen
                                  </div>
                                `;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-600 text-xs font-semibold tracking-widest uppercase">
                            📷 Sin imagen
                          </div>
                        )}
                        
                        {/* Badge Precio Flotante */}
                        <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-yellow-400 font-black text-sm shadow border border-slate-800">
                          ${product.price.toFixed(2)}
                        </div>
                      </div>

                      {/* Info y Controles */}
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <h3 className="text-white font-bold text-base tracking-wide mb-1.5 group-hover:text-pink-400 transition">
                            {product.name}
                          </h3>
                          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                            {product.description ||
                              'Delicioso plato preparado al momento con los mejores ingredientes.'}
                          </p>
                        </div>

                        {/* Botón de Agregar o Selector de Cantidad Estilo App */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">Disponible</span>

                          {qtyInCart === 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="bg-[#ff007f] hover:bg-pink-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-pink-600/30 transition-all transform active:scale-95 flex items-center gap-1.5"
                            >
                              <span>+</span> Agregar
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-700">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-6 h-6 rounded-xl bg-slate-700 text-white font-bold text-xs hover:bg-slate-600 flex items-center justify-center transition"
                              >
                                -
                              </button>
                              <span className="font-bold text-xs w-4 text-center text-yellow-400">
                                {qtyInCart}
                              </span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-6 h-6 rounded-xl bg-[#ff007f] text-white font-bold text-xs hover:bg-pink-600 flex items-center justify-center transition shadow"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>

      {/* 🚀 BARRA FLOTANTE INFERIOR (CARRITO ACTIVO) */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 p-4 backdrop-blur-xl z-40 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#ff007f] text-white flex items-center justify-center font-black text-sm shadow-lg shadow-pink-600/40">
                {totalItems}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Total del Pedido
                </p>
                <p className="text-lg font-black text-yellow-400">
                  ${totalPrice} <span className="text-xs font-normal text-slate-400">({totalBs} Bs)</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-[#ff007f] hover:bg-pink-600 text-white px-6 py-3 rounded-2xl font-extrabold text-sm shadow-xl shadow-pink-600/40 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>Ver Carrito y Pagar</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* 🛒 DRAWER DE CARRITO & CHECKOUT */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md h-full p-6 flex flex-col justify-between border-l border-slate-800 shadow-2xl overflow-y-auto">
            
            <div>
              {/* Título Drawer */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-5">
                <h2 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <span>🛒</span> Tu Carrito ({totalItems})
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-slate-800 text-slate-400 hover:text-white font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 transition"
                >
                  ✕ Cerrar
                </button>
              </div>

              {/* Lista de productos en carrito */}
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <p className="text-4xl mb-2">🍣</p>
                  <p className="text-xs">Tu carrito está vacío.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[32vh] overflow-y-auto pr-1 mb-5 scrollbar-none">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex justify-between items-center"
                    >
                      <div className="pr-3">
                        <h4 className="font-bold text-xs text-white line-clamp-1 mb-0.5">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-pink-400 font-medium">
                          ${item.price.toFixed(2)} c/u
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 flex items-center justify-center transition"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs w-4 text-center text-yellow-400">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-[#ff007f] text-white font-bold text-xs hover:bg-pink-600 flex items-center justify-center transition"
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
              <div className="border-t border-slate-800 pt-4 space-y-3.5">
                
                {/* Datos del Cliente */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nombre:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Carlos Pérez"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Teléfono:
                    </label>
                    <input
                      type="text"
                      placeholder="0412-0000000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tipo de Servicio:
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                  >
                    <option value="Local / Mesa">🍽️ Comer en Local / Mesa</option>
                    <option value="Pickup">🏃‍♂️ Retirar en Local (Pickup)</option>
                    <option value="Delivery">🛵 Delivery a Domicilio</option>
                  </select>
                </div>

                {orderType === 'Delivery' && (
                  <div className="space-y-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Zona de Delivery:
                      </label>
                      <select
                        value={deliveryZone}
                        onChange={(e) => setDeliveryZone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="Guarenas">Guarenas ($2.00)</option>
                        <option value="Guatire">Guatire ($3.00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Dirección Exacta:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Urb. Trapichito..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Método de Pago:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                  >
                    <option value="Efectivo / Divisas">💵 Efectivo Divisas ($)</option>
                    <option value="Pago Móvil (Bs)">📱 Pago Móvil (Bolívares)</option>
                    <option value="Zelle / Binance">🌐 Zelle / Binance</option>
                  </select>
                </div>

                {/* Resumen Totales */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>${subtotalPrice.toFixed(2)}</span>
                  </div>
                  {orderType === 'Delivery' && (
                    <div className="flex justify-between text-slate-400">
                      <span>Delivery ({deliveryZone}):</span>
                      <span>${deliveryCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-yellow-400 pt-2 border-t border-slate-800">
                    <span>Total USD:</span>
                    <span>${totalPrice}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>Total Bolívares (Tasa {exchangeRate.toFixed(2)}):</span>
                    <span>Bs. {totalBs}</span>
                  </div>
                </div>

                {/* Botón Enviar WhatsApp */}
                <button
                  onClick={checkoutWhatsApp}
                  disabled={isSubmitting || isLoadingExchangeRate}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-2xl font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
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

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <p>Takosushi • Guarenas y Guatire.</p>
      </footer>
    </div>
  );
}
