'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Order {
  id: number;
  total_usd: number;
  total_ves: number;
  payment_method: string;
  created_at: string;
  status: string;
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Refrescar automáticamente cada 10 segundos para ver si entra un cliente nuevo
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (id: number, newStatus: 'aprobado' | 'cancelado') => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.filter(order => order.id !== id));
      } else {
        alert('Error al actualizar el pedido');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#140005] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-pink-900/40 pb-4">
          <div>
            <span className="bg-[#ff007f]/20 text-pink-300 border border-[#ff007f]/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              ⚡ Panel de Control
            </span>
            <h1 className="text-2xl font-black text-yellow-400 mt-2">Pedidos Web Pendientes</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchOrders}
              className="bg-pink-950 border border-pink-800 hover:bg-pink-900 px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              🔄 Actualizar
            </button>
            <Link 
              href="/dashboard" 
              className="bg-pink-950 border border-pink-800 hover:bg-pink-900 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center"
            >
              📊 Ir al POS
            </Link>
          </div>
        </header>

        {loading ? (
          <p className="text-pink-300/60 text-center py-20">Cargando pedidos en tiempo real...</p>
        ) : orders.length === 0 ? (
          <div className="bg-[#1c020b] border border-pink-900/40 rounded-3xl p-12 text-center text-pink-300/60 shadow-xl">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-sm font-semibold">No hay pedidos pendientes en este momento. ¡Todo al día!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#1c020b] border border-pink-900/50 rounded-3xl p-5 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 uppercase tracking-widest">
                      Pendiente
                    </span>
                    <span className="text-xs font-mono text-pink-400">ID #{order.id}</span>
                  </div>

                  <div className="space-y-1 mb-5">
                    <p className="text-xl font-black text-yellow-400">
                      ${order.total_usd.toFixed(2)} <span className="text-xs text-pink-300/70 font-normal">({order.total_ves} Bs)</span>
                    </p>
                    <p className="text-xs text-pink-200">Pago: <span className="font-bold text-white">{order.payment_method}</span></p>
                    <p className="text-[11px] text-pink-400/60">Hora: {order.created_at}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-pink-950">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'aprobado')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelado')}
                    className="flex-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-900 py-2.5 rounded-xl font-bold text-xs transition"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
