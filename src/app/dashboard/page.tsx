'use client';

import { useState, useEffect } from 'react';
import RolesManagerModule from '../../components/RolesManagerModule';
import WebOrdersModule from '../../components/WebOrdersModule';
import { getRoles, getUsers } from '../../utils/rolesManager';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

type Product = {
  id: number;
  name: string;
  costPrice: number;
  price: number;
  category: string;
  description?: string;
  taxable: boolean;
  stock: number;
  image?: string;
  active?: boolean;
  hasSales?: boolean;
};

type CartItem = Product & {
  quantity: number;
};

type PaymentMethodType =
  | 'Efectivo USD'
  | 'Efectivo Bs'
  | 'Pago Móvil'
  | 'Zelle'
  | 'Binance Pay'
  | 'Crédito / Fiado'
  | 'Pago mixto';

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
  cashRegisterId?: number;
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

async function readJson<T = any>(
  response: Response
): Promise<T> {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Respuesta inválida del servidor (${response.status}): ${text.slice(
        0,
        200
      )}`
    );
  }
}

/* ============================================================
   SELECTOR DE CLIENTES
============================================================ */

function POSCustomerSelector({
  onSelectCustomer
}: {
  onSelectCustomer: (client: {
    name: string;
    document: string;
    phone: string;
  }) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [newName, setNewName] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    if (query.length > 1) {
      fetch(
        `/api/customers?q=${encodeURIComponent(query)}`
      )
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setResults(data);
            setShowDropdown(true);
          }
        })
        .catch(err =>
          console.error(
            'Error buscando clientes:',
            err
          )
        );
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query]);

  const handleRegisterQuickCustomer = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
