'use client';
import { useState, useEffect } from 'react';
import RolesManagerModule from '../../components/RolesManagerModule';
import ReceiptTicket from '../../components/ReceiptTicket';
import { getRoles, getUsers } from '../../utils/rolesManager';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Product = { 
  id: number; 
  name: string; 
  costPrice: number; 
  price: number;     
  category: string; 
  taxable: boolean;  
  stock: number;     
  image?: string;    // <--- Campo de imagen opcional
};

type CartItem = Product & { quantity: number };

type PaymentMethodType = 'Efectivo USD' | 'Efectivo Bs' | 'Pago Móvil' | 'Zelle' | 'Binance Pay' | 'Crédito / Fiado';

type SaleRecord = {
  id: number;
  date: string;
  items: CartItem[];
  subtotalUSD: number;
  ivaUSD: number;
  totalUSD: number;
  totalBs: number;
  exchangeRate: number;
  paymentMethod: PaymentMethodType;
  changeUSD: number;
  clientName?: string;
  created_at?: string; 
};

type CreditAccount = {
  id: number;
  clientName: string;
  clientPhone: string;
  clientDocument: string;
  totalDebtUSD: number;
  totalDebtBs: number;
  date: string;
  status: 'Pendiente' | 'Pagado';
  saleId: number;
};

type PayableAccount = {
  id: number;
  providerName: string;
  providerDocument: string;
  description: string;
  totalDebtUSD: number;
  totalDebtBs: number;
  dueDate: string;
  date: string;
  status: 'Pendiente' | 'Pagado';
};

const IVA_RATE = 0.16;

function POSCustomerSelector({ onSelectCustomer }: { onSelectCustomer: (client: { name: string; document: string; phone: string }) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    if (query.length > 1) {
      fetch(`/api/customers?q=${query}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setResults(data);
            setShowDropdown(true);
          }
        })
        .catch(err => console.error("Error buscando clientes:", err));
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query]);

  const handleRegisterQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, rif_ci: newDoc, phone: newPhone })
      });
      const data = await res.json();
      if (data.success) {
        onSelectCustomer({ name: newName, document: newDoc || 'V-00000000', phone: newPhone || 'N/A' });
        setIsAddingNew(false);
        setQuery(newName);
        setNewName(''); setNewDoc(''); setNewPhone('');
        alert('¡Cliente registrado y seleccionado!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 Buscar cliente (Nombre / Cédula)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition shadow-2xs"
          />
          {showDropdown && results.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border border-slate-200 mt-1 shadow-xl max-h-40 overflow-y-auto rounded-xl text-xs">
              {results.map((c: any) => (
                <li
                  key={c.id}
                  className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex justify-between items-center transition"
                  onClick={() => {
                    onSelectCustomer({ name: c.name, document: c.rif_ci || 'N/A', phone: c.phone || 'N/A' });
                    setQuery(c.name);
                    setShowDropdown(false);
                  }}
                >
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span className="text-slate-500">{c.rif_ci}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs"
        >
          {isAddingNew ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {isAddingNew && (
        <form onSubmit={handleRegisterQuickCustomer} className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-2.5 animate-fadeIn">
          <div className="text-[11px] font-extrabold text-blue-900">Registro Rápido de Cliente</div>
          <input
            type="text"
            placeholder="Nombre y Apellido *"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-2xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Cédula / RIF"
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-2xs"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-2xs"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 text-xs font-bold shadow-sm transition">
            Guardar y Seleccionar ⚡
          </button>
        </form>
      )}
    </div>
  );
}

function CustomersDirectoryModule() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [rifCi, setRifCi] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCustomers(data); })
      .catch(err => console.error(err));
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rif_ci: rifCi, phone, address })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Cliente guardado con éxito!');
        setName(''); setRifCi(''); setPhone(''); setAddress('');
        const updated = await fetch('/api/customers').then(r => r.json());
        if (Array.isArray(updated)) setCustomers(updated);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800">👥 Directorio de Clientes Frecuentes</h3>
          <p className="text-xs text-slate-500">Base de datos de compradores para créditos y facturación rápida.</p>
        </div>
        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-200">Total: {customers.length}</span>
      </div>

      <form onSubmit={handleSaveCustomer} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
        <input type="text" placeholder="Nombre *" required value={name} onChange={e => setName(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-2xs" />
        <input type="text" placeholder="Cédula / RIF" value={rifCi} onChange={e => setRifCi(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-2xs" />
        <input type="text" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-2xs" />
        <input type="text" placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-2xs" />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs shadow-sm transition">Registrar 💾</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase font-bold text-[10px]">
              <th className="p-3">Cliente</th>
              <th className="p-3">Cédula / RIF</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Dirección</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-400">No hay clientes registrados.</td></tr>}
            {customers.map((c, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition">
                <td className="p-3 font-bold text-slate-800">{c.name}</td>
                <td className="p-3 text-slate-600">{c.rif_ci || 'N/A'}</td>
                <td className="p-3 text-slate-600">{c.phone || 'N/A'}</td>
                <td className="p-3 text-slate-600">{c.address || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPOS() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'welcome' | 'pos' | 'inventory' | 'reports' | 'accounts' | 'customers' | 'roles'>('welcome'); 
  
  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [credits, setCredits] = useState<CreditAccount[]>([]);
  const [payables, setPayables] = useState<PayableAccount[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(778.33);

  const [currentUsername, setCurrentUsername] = useState<string>('admin');
  const [rolesList, setRolesList] = useState(getRoles());
  const [usersList, setUsersList] = useState(getUsers());

  // Estados de control de caja backend API
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [activeRegisterId, setActiveRegisterId] = useState<number | null>(null);
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [openingUSD, setOpeningUSD] = useState('');
  const [openingBs, setOpeningBs] = useState('');
  const [countedUSD, setCountedUSD] = useState('');
  const [countedBs, setCountedBs] = useState('');

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState('');

  const [inventoryFilterMode, setInventoryFilterMode] = useState<'all' | 'low'>('all');
  const [reportFilterPeriod, setReportFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderDoc, setNewProviderDoc] = useState('');
  const [newPayableDesc, setNewPayableDesc] = useState('');
  const [newPayableAmountUSD, setNewPayableAmountUSD] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [cashGivenUSD, setCashGivenUSD] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo USD');

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientDocument, setClientDocument] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const [newName, setNewName] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Comida');
  const [newTaxable, setNewTaxable] = useState(true);
  const [newStock, setNewStock] = useState('');
  const [newImage, setNewImage] = useState(''); // <--- Estado para la URL de la imagen

  const [lastPrintedSale, setLastPrintedSale] = useState<any>(null);
  const [successModalData, setSuccessModalData] = useState<{ isOpen: boolean; changeUSD: number; changeBs: number; isCredit: boolean; clientName?: string } | null>(null);

  // Consultar estatus de caja sin bloquear todo el panel
  const checkCashRegisterStatus = async (onOpenPOS?: boolean) => {
    try {
      const res = await fetch('/api/cash');
      const data = await res.json();
      if (data.success) {
        setIsCashOpen(data.isOpen);
        if (data.isOpen && data.register) {
          setActiveRegisterId(data.register.id);
          if (onOpenPOS) setActiveTab('pos');
        } else {
          setActiveRegisterId(null);
          if (onOpenPOS) {
            setShowOpenCashModal(true); 
          }
        }
      }
    } catch (error) {
      console.error('Error verificando estatus de caja:', error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    checkCashRegisterStatus(false);
    if (typeof window !== 'undefined') {
      const savedCredits = localStorage.getItem('pos_credits');
      if (savedCredits) { try { setCredits(JSON.parse(savedCredits)); } catch (e) { console.error(e); } }
      const savedPayables = localStorage.getItem('pos_payables');
      if (savedPayables) { try { setPayables(JSON.parse(savedPayables)); } catch (e) { console.error(e); } }
      const savedBcv = localStorage.getItem('pos_bcv');
      if (savedBcv) {
        const parsedBcv = parseFloat(savedBcv);
        if (!isNaN(parsedBcv)) setExchangeRate(parsedBcv);
      }
    }
  }, []);

  useEffect(() => {
    async function loadCloudData() {
      try {
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);

        const salesRes = await fetch('/api/sales');
        const salesData = await salesRes.json();
        if (Array.isArray(salesData)) {
          const formattedSales = salesData.map((sale: any) => ({
            id: sale.id,
            items: sale.items || [],
            subtotalUSD: Number(sale.subtotal_usd || sale.subtotalUSD || 0),
            ivaUSD: Number(sale.iva_usd || sale.ivaUSD || 0),
            totalUSD: Number(sale.total_usd || sale.totalUSD || 0),
            totalBs: Number(sale.total_bs || sale.totalBs || (Number(sale.total_usd || sale.totalUSD || 0) * exchangeRate)),
            exchangeRate: Number(sale.exchange_rate || sale.exchangeRate || exchangeRate),
            paymentMethod: sale.payment_method || sale.paymentMethod || 'Efectivo USD',
            changeUSD: Number(sale.change_usd || sale.changeUSD || 0),
            clientName: sale.client_name || sale.clientName || 'Cliente Genérico',
            date: sale.created_at || sale.date || new Date().toLocaleString()
          }));
          setSalesHistory(formattedSales as SaleRecord[]);
        }
      } catch (error) {
        console.error("Error sincronizando datos:", error);
      }
    }
    loadCloudData();
  }, [exchangeRate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRolesList(getRoles());
      setUsersList(getUsers());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentUserObj = usersList.find((u: any) => String(u.username || '').toLowerCase() === String(currentUsername || '').toLowerCase()) || usersList[0];
  const currentRoleObj = rolesList.find((r: any) => String(r.id || '').toLowerCase() === String(currentUserObj?.role || '').toLowerCase() || String(r.name || '').toLowerCase() === String(currentUserObj?.role || '').toLowerCase()) || rolesList[0];
  const userPermissions = currentRoleObj ? currentRoleObj.permissions : [];

  const handleTabChange = async (tab: 'welcome' | 'pos' | 'inventory' | 'reports' | 'accounts' | 'customers' | 'roles') => {
    if (tab === 'pos') {
      try {
        const res = await fetch('/api/cash');
        const data = await res.json();
        if (data.success && data.isOpen) {
          setIsCashOpen(true);
          setActiveRegisterId(data.register.id);
          setActiveTab('pos');
        } else {
          setIsCashOpen(false);
          setActiveRegisterId(null);
          setShowOpenCashModal(true); 
        }
      } catch (err) {
        console.error(err);
        setShowOpenCashModal(true);
      }
    } else {
      setActiveTab(tab); 
    }
  };

  const handleOpenCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const usd = Number(openingUSD || 0);
    const bs = Number(openingBs || 0);

    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          openingUSD: usd,
          openingBs: bs,
          userId: currentUserObj?.id || 1
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Caja abierta exitosamente!');
        setShowOpenCashModal(false);
        setOpeningUSD('');
        setOpeningBs('');
        setIsCashOpen(true);
        if (data.register) setActiveRegisterId(data.register.id);
        setActiveTab('pos'); 
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error abriendo la caja.');
    }
  };

  const handleCloseCashSubmit = async () => {
    if (!activeRegisterId) {
      alert('No se encontró el ID de la caja abierta actual.');
      return;
    }

    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          registerId: activeRegisterId,
          countedUSD: Number(countedUSD || 0),
          countedBs: Number(countedBs || 0)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Caja cerrada y arqueada exitosamente!');
        setShowCloseCashModal(false);
        setCountedUSD('');
        setCountedBs('');
        setIsCashOpen(false);
        setActiveRegisterId(null);
        setActiveTab('welcome'); 
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error cerrando la caja.');
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 text-sm font-bold">Cargando POS Enterprise...</div>;

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Producto sin stock disponible.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Stock límite alcanzado.');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        const prod = products.find(p => p.id === id);
        if (prod && newQty > prod.stock) {
          alert('Stock insuficiente.');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));

  const subtotalUSD = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const ivaUSD = cart.reduce((acc, item) => acc + (item.taxable ? item.price * item.quantity * IVA_RATE : 0), 0);
  const totalUSD = subtotalUSD + ivaUSD;
  const totalBs = totalUSD * exchangeRate;

  const totalSalesTodayUSD = salesHistory.reduce((acc, s) => acc + s.totalUSD, 0);
  const totalTransactionsCount = salesHistory.length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const givenUSD = parseFloat(cashGivenUSD || '0');
    let changeUSD = 0;
    let changeBs = 0;

    if (paymentMethod === 'Efectivo USD') {
      if (givenUSD < totalUSD) {
        alert('El monto entregado es menor al total.');
        return;
      }
      changeUSD = givenUSD - totalUSD;
      changeBs = changeUSD * exchangeRate;
    }

    if (paymentMethod === 'Crédito / Fiado' && !clientName) {
      alert('Especifique el nombre del cliente para ventas a crédito.');
      return;
    }

    const salePayload = {
      items: cart,
      subtotalUSD,
      ivaUSD,
      totalUSD,
      totalBs,
      exchangeRate,
      paymentMethod,
      changeUSD,
      clientName: clientName || 'Cliente Genérico',
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });
      const data = await res.json();

      if (data.success || res.ok) {
        const newSaleRecord: SaleRecord = {
          id: data.saleId || Date.now(),
          date: new Date().toLocaleString(),
          items: [...cart],
          subtotalUSD,
          ivaUSD,
          totalUSD,
          totalBs,
          exchangeRate,
          paymentMethod,
          changeUSD,
          clientName: clientName || 'Cliente Genérico',
          created_at: new Date().toISOString()
        };

        setSalesHistory(prev => [newSaleRecord, ...prev]);
        setLastPrintedSale(newSaleRecord);

        if (paymentMethod === 'Crédito / Fiado') {
          const newCredit: CreditAccount = {
            id: Date.now(),
            clientName: clientName || 'Cliente Genérico',
            clientPhone: clientPhone || 'N/A',
            clientDocument: clientDocument || 'N/A',
            totalDebtUSD: totalUSD,
            totalDebtBs: totalBs,
            date: new Date().toLocaleDateString(),
            status: 'Pendiente',
            saleId: newSaleRecord.id
          };
          setCredits(prev => [newCredit, ...prev]);
        }

        for (const item of cart) {
          const prod = products.find(p => p.id === item.id);
          if (prod) {
            await fetch(`/api/products/${prod.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...prod, stock: prod.stock - item.quantity })
            }).catch(err => console.error(err));
          }
        }

        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);

        setSuccessModalData({
          isOpen: true,
          changeUSD,
          changeBs,
          isCredit: paymentMethod === 'Crédito / Fiado',
          clientName: clientName || undefined
        });

        setCart([]);
        setIsCheckoutModalOpen(false);
        setCashGivenUSD('');
        setClientName('');
        setClientPhone('');
        setClientDocument('');
      } else {
        alert('Error: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      console.error(err);
      alert('Error procesando la venta.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice || !newStock) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          costPrice: parseFloat(newCostPrice || '0'),
          price: parseFloat(newPrice),
          category: newCategory,
          taxable: newTaxable,
          stock: parseInt(newStock),
          image: newImage // <--- Se envía la URL de la imagen al backend
        })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        alert('¡Producto creado exitosamente!');
        setNewName(''); setNewCostPrice(''); setNewPrice(''); setNewStock(''); setNewImage(''); 
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock || !restockAmount) return;
    const qty = parseInt(restockAmount);
    if (isNaN(qty) || qty <= 0) return;

    try {
      const res = await fetch(`/api/products/${selectedProductForRestock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedProductForRestock, stock: selectedProductForRestock.stock + qty })
      });
      if (res.ok) {
        alert('¡Inventario reabastecido!');
        setIsRestockModalOpen(false);
        setSelectedProductForRestock(null);
        setRestockAmount('');
        const prodRes = await fetch('/api/products');
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderName || !newPayableAmountUSD) return;
    const amountUSD = parseFloat(newPayableAmountUSD);
    const newPayable: PayableAccount = {
      id: Date.now(),
      providerName: newProviderName,
      providerDocument: newProviderDoc || 'N/A',
      description: newPayableDesc || 'Compra mercancía',
      totalDebtUSD: amountUSD,
      totalDebtBs: amountUSD * exchangeRate,
      dueDate: newDueDate || new Date().toLocaleDateString(),
      date: new Date().toLocaleDateString(),
      status: 'Pendiente'
    };
    setPayables(prev => [newPayable, ...prev]);
    setNewProviderName(''); setNewProviderDoc(''); setNewPayableDesc(''); setNewPayableAmountUSD(''); setNewDueDate('');
    alert('¡Cuenta por pagar registrada!');
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col relative font-sans">
      {/* Header / Navbar Enterprise */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3 flex flex-wrap justify-between items-center gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-2 rounded-2xl font-black text-sm shadow-sm cursor-pointer" onClick={() => handleTabChange('welcome')}>⚡ POS</div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight">Enterprise Suite</h1>
            <p className="text-[10px] text-slate-400 font-semibold">Sistema de Gestión Comercial</p>
          </div>
          <div className="hidden sm:flex items-center bg-blue-50/70 border border-blue-100 rounded-xl px-3 py-1 text-xs font-bold text-blue-700">
            BCV: Bs. {exchangeRate.toFixed(2)} / $1
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl text-xs font-bold border border-slate-200/50">
          <button onClick={() => handleTabChange('welcome')} className={`px-3.5 py-1.5 rounded-xl transition ${activeTab === 'welcome' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            🏠 Inicio
          </button>
          {userPermissions.includes('view_pos') && (
            <button onClick={() => handleTabChange('pos')} className={`px-3.5 py-1.5 rounded-xl transition ${activeTab === 'pos' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              🛒 POS Caja
            </button>
          )}
          {userPermissions.includes('view_inventory') && (
            <button onClick={() => handleTabChange('inventory')} className={`px-3.5 py-1.5 rounded-xl transition ${activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              📦 Inventario
            </button>
          )}
          {userPermissions.includes('view_reports') && (
            <button onClick={() => handleTabChange('reports')} className={`px-3.5 py-1.5 rounded-xl transition ${activeTab === 'reports' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              📊 Reportes
            </button>
          )}
          {(userPermissions.includes('view_credits') || userPermissions.includes('view_payables') || userPermissions.includes('manage_roles')) && (
            <button onClick={() => handleTabChange('accounts')} className={`px-3.5 py-1.5 rounded-xl transition ${activeTab === 'accounts' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              📑 Finanzas
            </button>
          )}
          {userPermissions.includes('view_pos') && (
            <button onClick={() => handleTabChange('customers')} className={`px-3.5 py-1.5 rounded-xl transition ${activeTab === 'customers' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              👥 Clientes
            </button>
          )}
          {userPermissions.includes('manage_roles') && (
            <button onClick={() => handleTabChange('roles')} className={`px-3.5 py-1.5 rounded-xl transition ${activeTab === 'roles' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              🔐 Roles
            </button>
          )}
        </nav>

        {/* User Profile & Shift Controls */}
        <div className="flex items-center gap-3">
          {isCashOpen && (
            <button
              onClick={() => setShowCloseCashModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
            >
              🔒 Arqueo / Cerrar Caja
            </button>
          )}

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-2xl">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">{currentUserObj?.name || currentUsername}</div>
              <div className="text-[10px] text-blue-600 font-semibold">{currentRoleObj?.name || 'Operador'}</div>
            </div>
            <select value={currentUsername} onChange={(e) => setCurrentUsername(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none">
              {usersList.map((u: any) => (<option key={u.id || u.username} value={u.username}>{u.name || u.username}</option>))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* PANTALLA DE BIENVENIDA */}
        {activeTab === 'welcome' && (
          <div className="space-y-6 py-6 animate-fadeIn">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-2xl mx-auto font-bold shadow-xs">⚡</div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">¡Bienvenido al Sistema Enterprise!</h2>
                <p className="text-xs text-slate-500">Selecciona el módulo con el que deseas trabajar hoy o consulta tus accesos rápidos a continuación.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                {userPermissions.includes('view_pos') && (
                  <button onClick={() => handleTabChange('pos')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-4 rounded-2xl text-xs shadow-sm transition flex flex-col items-center justify-center gap-2">
                    <span className="text-lg">🛒</span>
                    <span>POS / Caja</span>
                  </button>
                )}
                {userPermissions.includes('view_inventory') && (
                  <button onClick={() => handleTabChange('inventory')} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold p-4 rounded-2xl text-xs transition flex flex-col items-center justify-center gap-2">
                    <span className="text-lg">📦</span>
                    <span>Inventario</span>
                  </button>
                )}
                {userPermissions.includes('view_reports') && (
                  <button onClick={() => handleTabChange('reports')} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold p-4 rounded-2xl text-xs transition flex flex-col items-center justify-center gap-2">
                    <span className="text-lg">📊</span>
                    <span>Reportes</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Ventas Registradas</p>
                  <h4 className="text-lg font-black text-slate-900 mt-0.5">${totalSalesTodayUSD.toFixed(2)}</h4>
                </div>
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-sm">📈</div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Alertas de Stock</p>
                  <h4 className="text-lg font-black text-amber-600 mt-0.5">{lowStockCount} items</h4>
                </div>
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold text-sm">⚠️</div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Transacciones</p>
                  <h4 className="text-lg font-black text-slate-900 mt-0.5">{totalTransactionsCount}</h4>
                </div>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-sm">🧾</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: POS (Con soporte visual para imágenes de productos) */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="🔍 Buscar producto por nombre o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 shadow-sm transition"
                />
                <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`bg-white border rounded-3xl p-4 flex flex-col justify-between cursor-pointer transition shadow-xs hover:shadow-md ${product.stock <= 0 ? 'opacity-50 border-rose-200 bg-rose-50/20' : 'border-slate-200/80 hover:border-blue-400 hover:-translate-y-0.5'}`}
                  >
                    <div>
                      {/* Renderizado de la imagen en las tarjetas POS */}
                      {product.image ? (
                        <div className="w-full h-24 mb-2.5 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">{product.category}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${product.stock > 5 ? 'bg-emerald-50 text-emerald-700' : product.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mt-2.5 line-clamp-2">{product.name}</h4>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-end">
                      <div>
                        <div className="text-sm font-black text-slate-900">${product.price.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Bs. {(product.price * exchangeRate).toFixed(2)}</div>
                      </div>
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xs shadow-2xs">＋</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col h-[calc(100vh-210px)] sticky top-20">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">🛒 Carrito Actual</h3>
                  <button onClick={() => setCart([])} className="text-xs text-rose-500 font-bold hover:underline">Vaciar</button>
                </div>

                <POSCustomerSelector onSelectCustomer={(c) => {
                  setClientName(c.name);
                  setClientDocument(c.document);
                  setClientPhone(c.phone);
                }} />

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6">
                      <span className="text-3xl mb-2">🛍️</span>
                      El carrito está vacío. Selecciona productos para facturar.
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3 flex justify-between items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-slate-800 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400">${item.price.toFixed(2)} c/u</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                            <button onClick={() => updateCartQuantity(item.id, -1)} className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100">-</button>
                            <span className="px-2 text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, 1)} className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1">×</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span>${subtotalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>IVA (16%)</span>
                    <span>${ivaUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total USD</span>
                    <span>${totalUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-blue-600">
                    <span>Total Bs.</span>
                    <span>Bs. {totalBs.toFixed(2)}</span>
                  </div>

                  <button
                    disabled={cart.length === 0}
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl text-xs transition shadow-md mt-2"
                  >
                    Proceder al Pago 💳
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY (Con campo de URL de imagen incluido) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-base">➕ Nuevo Producto</h3>
                <form onSubmit={handleAddProduct} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre *</label>
                    <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Hamburguesa Doble" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                  </div>
                  {/* Campo de entrada para la URL de la imagen */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">URL de la Imagen</label>
                    <input type="text" value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Costo ($)</label>
                      <input type="number" step="0.01" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Precio Venta ($) *</label>
                      <input type="number" step="0.01" required value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoría</label>
                      <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Comida, Bebidas..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Stock Inicial *</label>
                      <input type="number" required value={newStock} onChange={e => setNewStock(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="taxableCheck" checked={newTaxable} onChange={e => setNewTaxable(e.target.checked)} className="rounded text-blue-600" />
                    <label htmlFor="taxableCheck" className="text-xs text-slate-700 font-semibold">Aplica IVA (16%)</label>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-xs shadow-sm mt-2 transition">Guardar Producto 💾</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-base">📦 Listado de Inventario</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setInventoryFilterMode('all')} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${inventoryFilterMode === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
                    <button onClick={() => setInventoryFilterMode('low')} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${inventoryFilterMode === 'low' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Stock Bajo</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                        <th className="p-3">Producto</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Precio</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.filter(p => inventoryFilterMode === 'all' || p.stock <= 5).map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                            {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                            <span>{p.name}</span>
                          </td>
                          <td className="p-3 text-slate-500">{p.category}</td>
                          <td className="p-3 font-extrabold text-slate-900">${p.price.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-lg font-bold ${p.stock > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {p.stock} unids.
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => { setSelectedProductForRestock(p); setIsRestockModalOpen(true); }}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-xl transition"
                            >
                              Reponer ➕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-800">💱 Tasa Oficial BCV</h3>
                <p className="text-xs text-slate-500">Actualiza la tasa de referencia para el cálculo instantáneo en bolívares.</p>
                <div className="flex gap-3">
                  <input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 0)} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold" />
                  <button onClick={() => alert('¡Tasa de cambio guardada!')} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm">Guardar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">📊 Reportes y Analítica Comercial</h3>
                <p className="text-xs text-slate-500">Monitoreo de ingresos y tendencias de venta.</p>
              </div>
              <div className="flex gap-2">
                {(['all', 'today', 'week', 'month'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setReportFilterPeriod(period)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition ${reportFilterPeriod === period ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {period === 'all' ? 'Histórico' : period === 'today' ? 'Hoy' : period === 'week' ? 'Semana' : 'Mes'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm">Tendencia de Ventas ($)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesHistory.slice(0, 10).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="totalUSD" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm">Volumen por Transacción</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesHistory.slice(0, 10).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="totalUSD" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="font-extrabold text-slate-800 text-sm">Historial Detallado</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                      <th className="p-3">ID / Fecha</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Método de Pago</th>
                      <th className="p-3">Total USD</th>
                      <th className="p-3">Total Bs.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesHistory.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No hay ventas registradas.</td></tr>}
                    {salesHistory.map(sale => (
                      <tr key={sale.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">#{sale.id}</div>
                          <div className="text-[10px] text-slate-400">{sale.date}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-700">{sale.clientName || 'Cliente Genérico'}</td>
                        <td className="p-3"><span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg">{sale.paymentMethod}</span></td>
                        <td className="p-3 font-black text-slate-900">${sale.totalUSD.toFixed(2)}</td>
                        <td className="p-3 text-slate-500">Bs. {sale.totalBs.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-slate-800">📑 Cuentas por Cobrar (Créditos / Fiados)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Contacto</th>
                      <th className="p-3">Deuda USD</th>
                      <th className="p-3">Deuda Bs.</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {credits.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No hay créditos activos.</td></tr>}
                    {credits.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3 font-bold text-slate-800">{c.clientName}</td>
                        <td className="p-3 text-slate-500">{c.clientPhone} / {c.clientDocument}</td>
                        <td className="p-3 font-black text-slate-900">${c.totalDebtUSD.toFixed(2)}</td>
                        <td className="p-3 text-slate-500">Bs. {c.totalDebtBs.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-lg font-bold ${c.status === 'Pendiente' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {c.status === 'Pendiente' && (
                            <button
                              onClick={() => {
                                setCredits(prev => prev.map(item => item.id === c.id ? { ...item, status: 'Pagado' } : item));
                                alert('¡Crédito marcado como pagado!');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-2xs"
                            >
                              Cobrar ✓
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-base">➕ Registrar Cuenta por Pagar</h3>
                <form onSubmit={handleAddPayable} className="space-y-3">
                  <input type="text" placeholder="Proveedor *" required value={newProviderName} onChange={e => setNewProviderName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                  <input type="text" placeholder="Rif / Cédula" value={newProviderDoc} onChange={e => setNewProviderDoc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                  <input type="text" placeholder="Descripción de la deuda" value={newPayableDesc} onChange={e => setNewPayableDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                  <input type="number" step="0.01" placeholder="Monto USD ($) *" required value={newPayableAmountUSD} onChange={e => setNewPayableAmountUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                  <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-xs shadow-sm transition">Guardar Deuda 💾</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-base">📋 Cuentas por Pagar a Proveedores</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                        <th className="p-3">Proveedor</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Monto USD</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payables.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-400">No hay cuentas por pagar.</td></tr>}
                      {payables.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 font-bold text-slate-800">{p.providerName}</td>
                          <td className="p-3 text-slate-500">{p.description}</td>
                          <td className="p-3 font-black text-slate-900">${p.totalDebtUSD.toFixed(2)}</td>
                          <td className="p-3"><span className={`px-2.5 py-1 rounded-lg font-bold ${p.status === 'Pendiente' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{p.status}</span></td>
                          <td className="p-3 text-right">
                            {p.status === 'Pendiente' && (
                              <button onClick={() => {
                                setPayables(prev => prev.map(item => item.id === p.id ? { ...item, status: 'Pagado' } : item));
                                alert('¡Cuenta pagada!');
                              }} className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl font-bold shadow-2xs">Pagar ✓</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMERS */}
        {activeTab === 'customers' && <CustomersDirectoryModule />}

        {/* TAB 6: ROLES */}
        {activeTab === 'roles' && <RolesManagerModule />}
      </main>

      {/* MODAL DE APERTURA DE CAJA */}
      {showOpenCashModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <span className="text-3xl">🔓</span>
              <h3 className="text-lg font-black text-slate-900">Apertura Obligatoria de Turno</h3>
              <p className="text-xs text-slate-500">Debe registrar el fondo inicial en caja para poder entrar al módulo de ventas POS.</p>
            </div>
            <form onSubmit={handleOpenCashSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fondo Inicial USD ($)</label>
                <input type="number" min="0" step="0.01" required value={openingUSD} onChange={e => setOpeningUSD(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold shadow-2xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fondo Inicial Bs. (Bs.)</label>
                <input type="number" min="0" step="0.01" required value={openingBs} onChange={e => setOpeningBs(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold shadow-2xs" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowOpenCashModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-2xl text-xs font-bold text-slate-600 transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-xs transition shadow-sm">
                  Abrir Caja ⚡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ARQUEO Y CIERRE DE CAJA */}
      {showCloseCashModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-extrabold text-slate-800">🔒 Arqueo y Cierre de Caja</h3>
            <p className="text-xs text-slate-500">Ingrese el efectivo físico total contado en gaveta para cerrar el turno actual.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total USD Contado ($)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={countedUSD} onChange={(e) => setCountedUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Bs. Contado (Bs.)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={countedBs} onChange={(e) => setCountedBs(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowCloseCashModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-2xl text-xs font-bold text-slate-600 transition">Cancelar</button>
              <button onClick={handleCloseCashSubmit} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl text-xs font-bold shadow-sm transition">Confirmar Cierre ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-extrabold text-slate-800">💳 Procesar Pago</h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700"><span>Total a Pagar:</span><span className="font-black text-slate-900">${totalUSD.toFixed(2)} / Bs. {totalBs.toFixed(2)}</span></div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs"
              >
                <option value="Efectivo USD">Efectivo USD ($)</option>
                <option value="Efectivo Bs">Efectivo Bs (Bs.)</option>
                <option value="Pago Móvil">Pago Móvil</option>
                <option value="Zelle">Zelle</option>
                <option value="Binance Pay">Binance Pay</option>
                <option value="Crédito / Fiado">Crédito / Fiado</option>
              </select>

              {paymentMethod === 'Efectivo USD' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Efectivo Recibido ($)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={cashGivenUSD} onChange={e => setCashGivenUSD(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold shadow-2xs" />
                </div>
              )}

              {paymentMethod === 'Crédito / Fiado' && (
                <div className="space-y-2.5">
                  <input type="text" placeholder="Nombre del Cliente *" required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                  <input type="text" placeholder="Cédula / RIF" value={clientDocument} onChange={e => setClientDocument(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                  <input type="text" placeholder="Teléfono" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs" />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsCheckoutModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-2xl text-xs font-bold text-slate-600 transition">Cancelar</button>
              <button onClick={handleCheckout} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl text-xs font-bold shadow-sm transition">Confirmar Venta ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && selectedProductForRestock && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-extrabold text-slate-800">Reponer Inventario</h3>
            <p className="text-xs text-slate-500">Producto: <strong className="text-slate-800">{selectedProductForRestock.name}</strong> (Actual: {selectedProductForRestock.stock})</p>
            <form onSubmit={handleRestock} className="space-y-3">
              <input type="number" min="1" required placeholder="Cantidad a agregar *" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold shadow-2xs" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsRestockModalOpen(false)} className="flex-1 bg-slate-100 py-3 rounded-2xl text-xs font-bold text-slate-600">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-xs font-bold shadow-sm">Actualizar ➕</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success / Receipt Modal */}
      {successModalData && successModalData.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-scaleUp">
            
            <div id="printable-ticket" className="bg-white text-slate-800 p-4 rounded-2xl border border-slate-100 text-left font-mono text-xs space-y-3">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <h4 className="font-black text-sm uppercase">⚡ Mi Empresa C.A.</h4>
                <p className="text-[10px] text-slate-500">RIF: J-00000000-0</p>
                <p className="text-[10px] text-slate-500">Sistema POS Enterprise</p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between"><span>Fecha:</span> <span className="font-bold">{lastPrintedSale?.date || new Date().toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Cliente:</span> <span className="font-bold">{lastPrintedSale?.clientName || 'Cliente Genérico'}</span></div>
                <div className="flex justify-between"><span>Método:</span> <span className="font-bold">{lastPrintedSale?.paymentMethod}</span></div>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Descripción / Cant. / Precio</div>
                {lastPrintedSale?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="truncate flex-1">{item.quantity}x {item.name}</span>
                    <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between"><span>Subtotal:</span> <span>${lastPrintedSale?.subtotalUSD?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>IVA (16%):</span> <span>${lastPrintedSale?.ivaUSD?.toFixed(2)}</span></div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                  <span>TOTAL USD:</span> 
                  <span>${lastPrintedSale?.totalUSD?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-600">
                  <span>TOTAL Bs.:</span> 
                  <span>Bs. {lastPrintedSale?.totalBs?.toFixed(2)}</span>
                </div>
                {successModalData.changeUSD > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold pt-1">
                    <span>Cambio Entregado:</span> 
                    <span>${successModalData.changeUSD.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                ¡Gracias por su compra!<br/>Conserve su ticket.
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={() => setSuccessModalData(null)}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-2xl text-xs font-bold shadow-sm transition"
              >
                Continuar ⚡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
