'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-blue-500 selection:text-white transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Barra de navegación */}
      <header className={`max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b transition-colors duration-300 ${darkMode ? 'border-slate-900' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-blue-600 tracking-wider">⚡ POS Enterprise Venezuela</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl text-sm font-semibold transition border ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'}`}
            title="Cambiar Modo Claro / Oscuro"
          >
            {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
          </button>

          <Link className="text-sm font-medium transition hidden sm:inline-block opacity-80 hover:opacity-100" href="/login">
            Ver demo
          </Link>
          <Link className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-lg shadow-blue-600/30" href="/login">
            Entrar al Sistema
          </Link>
        </div>
      </header>

      {/* Hero Principal */}
      <main className="max-w-6xl mx-auto px-6 py-16 text-center flex flex-col items-center">
        <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6">
          🇻🇪 Diseñado para hacer crecer tu negocio sin límites
        </span>
        <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight leading-tight mb-6 max-w-4xl">
          El motor que tu comercio merece: <span className="text-blue-600">Punto de Venta y Tu Propia Web Corporativa</span>
        </h1>
        <p className={`text-lg sm:text-xl max-w-3xl mb-10 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Imagina tener el control absoluto de tus ventas en dólares y bolívares con tasa BCV, gestionar tu inventario al vuelo y, al mismo tiempo, proyectar una imagen profesional imbatible con una página web corporativa propia para tu marca. ¡Haz que tus clientes se enamoren de tu negocio desde el primer clic!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-20">
          <Link className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition shadow-xl shadow-blue-600/30" href="/login">
            Iniciar Sesión en el Sistema
          </Link>
        </div>

        {/* Sección Especial: Página Web Corporativa */}
        <div className={`w-full border rounded-3xl p-8 sm:p-12 mb-16 text-left grid grid-cols-1 lg:grid-cols-2 gap-10 items-center transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-950 border-blue-500/30' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50/50 border-blue-200 shadow-xl'}`}>
          <div>
            <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              🌐 Presencia Digital Imparable
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold mt-4 mb-4">Tu negocio con una Página Web Corporativa de Alto Impacto</h3>
            <p className={`text-sm sm:text-base leading-relaxed mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Hoy en día, un negocio que no tiene presencia en internet pierde clientes frente a la competencia. Con nuestra plataforma, no solo facturas en tu tienda física, sino que impulsas una <strong className="text-blue-600">página web profesional y moderna</strong> para tu marca, ideal para mostrar tus servicios, catálogos, ubicación y conectar de inmediato con nuevos compradores.
            </p>
            <ul className={`space-y-2.5 text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              <li className="flex items-center gap-2">✨ Diseño elegante, rápido y adaptable a celulares (Responsive)</li>
              <li className="flex items-center gap-2">✨ Autoridad de marca que inspira confianza absoluta</li>
              <li className="flex items-center gap-2">✨ Canal directo para convertir visitantes en clientes fieles</li>
            </ul>
          </div>
          <div className={`border p-8 rounded-2xl text-center space-y-4 ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="text-4xl">🚀</div>
            <div className="text-xl font-bold">Tu marca en las grandes ligas</div>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Integra tu punto de venta en la nube con una vitrina digital diseñada para destacar y vender más todos los días.
            </p>
          </div>
        </div>

        {/* Módulos Principales */}
        <div className="w-full text-left mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Conoce todos los módulos diseñados para tu tranquilidad</h2>
            <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Cada herramienta está pensada para ahorrarte tiempo, evitar pérdidas y automatizar tu operación.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">💱</div>
              <div className="text-blue-600 font-bold text-xl mb-2">Módulo Multi-Moneda & BCV</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Sincronización automática de la tasa oficial del BCV. Realiza conversiones exactas y transparentes entre Dólares ($) y Bolívares (Bs.).</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">💳</div>
              <div className="text-blue-600 font-bold text-xl mb-2">Medios de Pago Venezolanos</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Acepta sin enredos Efectivo USD, Pago Móvil, Zelle, Binance Pay y administra cómodamente tus créditos o cuentas por cobrar.</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">🛡️</div>
              <div className="text-blue-600 font-bold text-xl mb-2">Control de Roles y Permisos</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Protege tu dinero e inventario asignando accesos específicos para cajeros, administradores y personal de almacén con total seguridad.</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">📦</div>
              <div className="text-blue-600 font-bold text-xl mb-2">Inventario en Tiempo Real</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>El stock se descuenta automáticamente con cada venta. Recibe alertas de productos agotados y mantén tu negocio al día.</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">📊</div>
              <div className="text-blue-600 font-bold text-xl mb-2">Cierres de Caja & Reportes Z</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Audita tus ingresos diarios desglosados por método de pago, calcula márgenes de ganancia y supervisa el flujo de caja sin dolores de cabeza.</p>
            </div>

            <div className={`border p-8 rounded-2xl transition ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 shadow-md hover:border-blue-400'}`}>
              <div className="text-3xl mb-4">☁️</div>
              <div className="text-blue-600 font-bold text-xl mb-2">Nube Segura y Confiable</div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tus datos están protegidos y respaldados. Accede desde cualquier computadora, tablet o teléfono con velocidad óptima.</p>
            </div>
          </div>
        </div>

        {/* Llamado a la acción final */}
        <div className={`text-center border rounded-3xl p-10 sm:p-14 w-full transition-colors duration-300 ${darkMode ? 'bg-gradient-to-r from-blue-900/20 via-slate-900 to-blue-900/20 border-blue-500/20' : 'bg-blue-50 border-blue-200 shadow-xl'}`}>
          <h3 className="text-2xl sm:text-4xl font-extrabold mb-4">Dale a tu negocio el impulso definitivo hoy</h3>
          <p className={`text-sm sm:text-base max-w-xl mx-auto mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Únete a los emprendedores y comerciantes que ya están modernizando su manera de vender, cobrar y proyectarse al mundo.
          </p>
          <Link className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-base transition shadow-xl shadow-blue-600/30" href="/login">
            Iniciar Sesión en el Sistema
          </Link>
        </div>
      </main>

      {/* Pie de página */}
      <footer className={`border-t py-8 text-center text-sm transition-colors duration-300 ${darkMode ? 'border-slate-900 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
        <p>POS Enterprise Venezuela • Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
