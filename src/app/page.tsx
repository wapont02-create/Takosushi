'use client';
import { useState } from 'react';

// Menú de ejemplo basado en el estilo de tu local (puedes cargarlo luego desde tu base de datos SQLite Cloud)
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
  const [orderType, setOrderType] = useState('Mesa 01');

  // Agregar al carrito
  const addToCart = (product: { id: number; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  // Modificar cantidad
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

  // Enviar a WhatsApp
  const checkoutWhatsApp = () => {
    if (!customerName.trim()) {
      alert('Por favor ingresa tu nombre o número de mesa.');
      return;
    }

    const phone = "584120000000"; // Reemplaza con el número real de WhatsApp del local
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
    <div className="min-h-screen bg-[#140005] text-white flex flex-col justify-between selection:bg-[#ff007f] selection:text-white">
      
      {/* Cabecera */}
      <header className="border-b border-pink-900/40 px-6 py-6 flex justify-between items-center bg-[#1a0008]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-[#ff007f] text-white font-black px-3 py-1.5 rounded-xl text-lg shadow-lg shadow-[#ff007f]/30">
            🍣 TAKO TAKO
          </div>
          <span className="text-xs uppercase tracking-widest text-pink-400 font-semibold hidden sm:inline">Cocina Asiática</span>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="bg-[#ff007f] hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#ff007f]/30 transition"
        >
          🛒 Carrito ({totalItems}) - ${totalPrice}
        </button>
      </header>

      {/* Banner / Hero */}
      <main className="max-w-5xl mx-auto px-4 py-10 w-full flex-1">
        <div className="text-center mb-12">
          <span className="bg-[#ff007f]/20 text-pink-300 border border-[#ff007f]/40 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
            ✨ Menú Digital Interactivo
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-wider uppercase mt-4 mb-3 text-yellow-400 drop-shadow-md">
            Nuestros Combos y Rolls
          </h1>
          <p className="text-pink-200/80 text-sm sm:text-base max-w-xl mx-auto">
            Elige tus platos favoritos, arma tu pedido y envíalo al instante por WhatsApp para disfrutar el mejor sushi.
          </p>
        </div>

        {/* Listado del Menú Estilo Flyer */}
        {menuCategories.map((cat, idx) => (
          <div key={idx} className="mb-12">
            <div className="bg-[#ff007f] text-white font-black text-xl sm:text-2xl py-3 px-6 rounded-2xl mb-6 shadow-lg uppercase tracking-wider transform -rotate-1">
              {cat.category}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cat.items.map(product => (
                <div key={product.id} className="bg-[#1f030d] border border-pink-900/50 p-6 rounded-3xl flex flex-col justify-between shadow-xl hover:border-[#ff007f] transition">
                  <div>
                    <h3 className="text-yellow-400 font-extrabold text-lg sm:text-xl uppercase tracking-wide mb-2">{product.name}</h3>
                    <p className="text-pink-100/70 text-xs sm:text-sm leading-relaxed mb-4">{product.description}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-pink-950">
                    <span className="bg-white text-slate-950 font-black px-4 py-1.5 rounded-xl text-lg shadow-inner">
                      ${product.price.toFixed(2)}
                    </span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-[#ff007f] hover:bg-pink-600 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Carrito Flotante / Modal Lateral */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="bg-[#1c020b] w-full max-w-md h-full p-6 flex flex-col justify-between border-l border-pink-900/50 shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-pink-900/50 mb-6">
                <h2 className="text-xl font-black text-yellow-400">🛒 Tu Pedido Actual</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-pink-400 hover:text-white font-bold text-lg px-2"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 text-pink-300/60">
                  <p className="text-4xl mb-3">🍣</p>
                  <p>Tu carrito está vacío. ¡Agrega deliciosos rollos o combos!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {cart.map(item => (
                    <div key={item.id} className="bg-[#140005] p-4 rounded-2xl border border-pink-950 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-yellow-200">{item.name}</h4>
                        <p className="text-xs text-pink-400">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.id, -1)} className="bg-pink-950 px-2.5 py-1 rounded-lg font-bold text-xs hover:bg-pink-900">-</button>
                        <span className="font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="bg-pink-950 px-2.5 py-1 rounded-lg font-bold text-xs hover:bg-pink-900">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Datos del Cliente y Botón WhatsApp */}
            {cart.length > 0 && (
              <div className="border-t border-pink-900/50 pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-pink-300 mb-1">Tu Nombre o Alias:</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Carlos Pérez" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#140005] border border-pink-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff007f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pink-300 mb-1">Mesa / Tipo de Pedido:</label>
                  <input 
                    type="text" 
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-[#140005] border border-pink-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff007f]"
                  />
                </div>

                <div className="flex justify-between items-center text-lg font-black py-2">
                  <span>Total a Pagar:</span>
                  <span className="text-yellow-400 text-2xl">${totalPrice}</span>
                </div>

                <button 
                  onClick={checkoutWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-extrabold text-base shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  🟢 Enviar Pedido por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pie de página */}
      <footer className="border-t border-pink-900/30 py-6 text-center text-xs text-pink-400/60 bg-[#1a0008]">
        <p>Takosushi • Sistema de Menú Digital y Punto de Venta.</p>
      </footer>
    </div>
  );
}
