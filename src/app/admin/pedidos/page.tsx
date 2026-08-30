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
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado limpio acorde al panel principal */}
        <header className="flex justify-between items-center mb-8 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5">
          <div>
            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              ⚡ Panel de Control
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">Pedidos Web Pendientes</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchOrders}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              🔄 Actualizar
            </button>
            <Link 
              href="/dashboard" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition flex items-center"
            >
              📊 Ir al POS
            </Link>
          </div>
        </header>

        {loading ? (
          <p className="text-slate-400 text-center py-20 font-medium">Cargando pedidos en tiempo real...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-sm font-semibold">No hay pedidos pendientes en este momento. ¡Todo al día!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 uppercase tracking-widest">
                      Pendiente
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">ID #{order.id}</span>
                  </div>

                  <div className="space-y-1 mb-5">
                    <p className="text-xl font-bold text-slate-900">
                      ${order.total_usd.toFixed(2)} <span className="text-xs text-slate-500 font-normal">({order.total_ves} Bs)</span>
                    </p>
                    <p className="text-xs text-slate-600">Pago: <span className="font-semibold text-slate-900">{order.payment_method}</span></p>
                    <p className="text-[11px] text-slate-400">Hora: {order.created_at}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => updateOrderStatus(order.id, 'aprobado')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-xs shadow-sm transition"
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelado')}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2.5 rounded-xl font-semibold text-xs transition"
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
