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
                ...
