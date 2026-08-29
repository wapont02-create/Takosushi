'use client';
import { useState } from 'react';
import Link from 'next/link';

const menuCategories = [
  {
    category: "🔥 COMBOS ESPECIALES",
    items: [
      { id: 1, name: "COMBO LOCURA", description: "24 Piezas Mixto + 3 Und Kokitos Cangrejo + Refresco de litro", price: 13.99 },
      { id: 2, name: "COMBO PERSONAL", description: "12 Pieza de Cangrejo + Topping de Camarón + Ensalada Dinamita + Refresco 400 ml", price: 11.99 },
      { id: 3, name: "COMBO FAMILIAR", description: "70 Piezas de Sushi Variados + Ensalada Dinamita + Kokitos de Cangrejo + Refresco de 2 Litros", price: 65.67 },
      { id: 4, name: "COMBO DUO", description: "12 Pieza Mixto + Poke + Refresco de Litro", price: 14.99 },
      { id: 5, name: "COMBO TAKOTAKOSUSHI", description: "36 Piezas de Sushi Mixto + Croquetas de Cangrejo + 2 Poke", price: 31.99 },
    ]
  },
  {
    category: "🍣 ROLLS FAVORITOS",
    items: [
      { id: 6, name: "PHILADELPHIA", description: "Roll de salmón, queso crema, aguacate con topping de ajonjolí", price: 9.90 },
      { id: 7, name: "KANNY CRISPY", description: "Roll relleno de cangrejo crispiado dinamita queso crema aguacate cebollín topping de plátano", price: 7.30 },
      { id: 8, name: "SUKIDRANGON", description: "Roll de pescado blanco dinamita queso crema aguacate topping de camarón con salsa udon", price: 9.99 },
    ]
  }
];

export default function TakosushiMenu() {
  const [cart, setCart] = useState<{ id: number; name: string; price: number; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('Mesa 01 / Web');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToCart = (product: { id: number; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as typeof cart);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

  const checkoutWhatsApp = async () => {
    if (!customerName.trim()) {
      alert('Por favor ingresa tu nombre o número de mesa.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Guardar el pedido en la base de datos a través de nuestra API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          orderType,
          items: cart,
          total: parseFloat(totalPrice)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Error al registrar en BD:', data.error);
      }
    } catch (error) {
      console.error('Fallo de red al registrar pedido:', error);
    } finally {
      setIsSubmitting(false);
    }

    // 2. Construir mensaje de WhatsApp
    const phone = "584120000000"; // Reemplaza con tu número real de WhatsApp
    let message = `🍣 *NUEVO PEDIDO - TAKOSUSHI* 🍣\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📍 *Ubicación / Tipo:* ${orderType}\n`;
    message += `-----------------------------------\n`;
    
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
    });

    message += `-----------------------------------\n`;
    message += `💵 *TOTAL A PAGAR: $${totalPrice}*`;

    const encodedURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(encodedURL, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#140005] text-white flex flex-col justify-between selection:bg-[#ff007f] selection:text-white pb-24">
      
      {/* Cabecera */}
      <header className="border-b border-pink-900/40 px-6 py-4 flex justify-between items-center bg-[#1a0008]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-[#ff007f] text-white font-black px-3 py-1.5 rounded-xl text-md shadow-lg shadow-[#ff007f]/30">
            🍣 TAKO TAKO
          </div>
          <span className="text-xs uppercase tracking-widest text-pink-400 font-semibold hidden sm:inline">Cocina Asiática</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="text-xs font-semibold text-pink-300 hover:text-white border border-pink-900 bg-pink-950/60 px-3 py-1.5 rounded-xl transition"
          >
            🔐 Entrar al Sistema
          </Link>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-pink-950 border border-pink-800 text-pink-200 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-pink-900 transition"
          >
            🛒 Carrito ({totalItems})
          </button>
        </div>
      </header>

      {/* Menú Principal */}
      <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        <div className="text-center mb-10">
          <span className="bg-[#ff007f]/20 text-pink-300 border border-[#ff007f]/40 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
            ✨ Menú Digital
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-wider uppercase mt-3 mb-2 text-yellow-400 drop-shadow-md">
            Nuestros Combos y Rolls
          </h1>
          <p className="text-pink-200/80 text-xs sm:text-sm max-w-md mx-auto">
            Toca en "+ Agregar" para sumar productos a tu pedido sin salir del menú.
          </p>
        </div>

        {menuCategories.map((cat, idx) => (
          <div key={idx} className="mb-10">
            <div className="bg-[#ff007f] text-white font-black text-lg sm:text-xl py-2.5 px-5 rounded-2xl mb-5 shadow-lg uppercase tracking-wider transform -rotate-1">
              {cat.category}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cat.items.map(product => (
                <div key={product.id} className="bg-[#1f030d] border border-pink-900/50 p-5 rounded-3xl flex flex-col justify-between shadow-xl">
                  <div>
                    <h3 className="text-yellow-400 font-extrabold text-base uppercase tracking-wide mb-1">{product.name}</h3>
                    <p className="text-pink-100/70 text-xs leading-relaxed mb-3">{product.description}</p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-pink-950">
                    <span className="bg-white text-slate-950 font-black px-3 py-1 rounded-xl text-base shadow-inner">
                      ${product.price.toFixed(2)}
                    </span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-[#ff007f] hover:bg-pink-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1"
                    >
                      <span>+ Agregar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* BARRA FLOTANTE INFERIOR */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a0008]/95 border-t border-pink-900/60 p-4 backdrop-blur-lg z-40 flex justify-between items-center max-w-xl mx-auto sm:rounded-t-3xl shadow-2xl">
          <div>
            <p className="text-xs text-pink-300">{totalItems} {totalItems === 1 ? 'producto' : 'productos'} en el carrito</p>
            <p className="text-lg font-black text-yellow-400">${totalPrice}</p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-[#ff007f] hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#ff007f]/40 transition flex items-center gap-2"
          >
            🛒 Ver Pedido y Pagar
          </button>
        </div>
      )}

      {/* MODAL / PANEL LATERAL DEL CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-[#1c020b] w-full max-w-md h-full p-6 flex flex-col justify-between border-l border-pink-900/50 shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-pink-900/50 mb-4">
                <h2 className="text-lg font-black text-yellow-400">🛒 Tu Pedido Actual</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="bg-pink-950 text-pink-300 hover:text-white font-bold text-sm px-3 py-1.5 rounded-xl border border-pink-900"
                >
                  ← Seguir Comprando
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 text-pink-300/60">
                  <p className="text-4xl mb-3">🍣</p>
                  <p className="text-sm">Tu carrito está vacío.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="bg-[#140005] p-3 rounded-2xl border border-pink-950 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-xs text-yellow-200">{item.name}</h4>
                        <p className="text-[11px] text-pink-400">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="bg-pink-950 w-7 h-7 rounded-lg font-bold text-xs hover:bg-pink-900 flex items-center justify-center">-</button>
                        <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="bg-pink-950 w-7 h-7 rounded-lg font-bold text-xs hover:bg-pink-900 flex items-center justify-center">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Datos del Cliente y Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-pink-900/50 pt-3 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-pink-300 mb-1">Tu Nombre o Alias:</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Carlos Pérez" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#140005] border border-pink-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-pink-300 mb-1">Mesa / Tipo de Pedido:</label>
                  <input 
                    type="text" 
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-[#140005] border border-pink-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff007f]"
                  />
                </div>

                <div className="flex justify-between items-center text-base font-black py-1">
                  <span>Total a Pagar:</span>
                  <span className="text-yellow-400 text-xl">${totalPrice}</span>
                </div>

                <button 
                  onClick={checkoutWhatsApp}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Registrando pedido...' : '🟢 Enviar Pedido por WhatsApp'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pie de página con acceso al login */}
      <footer className="border-t border-pink-900/30 py-6 text-center text-xs text-pink-400/60 bg-[#1a0008] space-y-2">
        <p>Takosushi • Sistema de Menú Digital y Punto de Venta.</p>
        <Link href="/login" className="text-pink-400 hover:text-white underline font-semibold inline-block">
          Acceso Administrativo / POS (Login)
        </Link>
      </footer>
    </div>
  );
}
