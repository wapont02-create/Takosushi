import Link from "next/link";

export const dynamic = "force-dynamic";

const modules = [
  {
    icon: "▣",
    title: "Punto de venta",
    description: "Operaciones y facturación",
    color: "from-blue-500 to-blue-700",
  },
  {
    icon: "▤",
    title: "Inventario",
    description: "Control de productos",
    color: "from-cyan-400 to-blue-600",
  },
  {
    icon: "▥",
    title: "Reportes",
    description: "Análisis del negocio",
    color: "from-indigo-400 to-blue-600",
  },
  {
    icon: "♙",
    title: "Clientes",
    description: "Gestión de clientes",
    color: "from-sky-400 to-blue-600",
  },
];

export default function MinimarketPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#071426] text-white">

      {/* FONDO DE APLICACIÓN */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -right-40 -top-40 h-[650px] w-[650px] rounded-full bg-blue-600/20 blur-[150px]" />
        <div className="absolute -bottom-60 left-1/3 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">

        {/* MENÚ LATERAL DESKTOP */}
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0A192C]/90 px-6 py-7 lg:flex">

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 shadow-lg shadow-blue-600/30">
              <span className="text-xl font-black">MJ</span>
            </div>

            <div>
              <h1 className="text-sm font-black tracking-wide">
                MINIMARKET
              </h1>
              <p className="text-sm font-bold text-blue-400">
                JOSÉ
              </p>
            </div>
          </div>

          <div className="mt-14">
            <p className="mb-5 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
              ESPACIO DE TRABAJO
            </p>

            <div className="flex items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-600/20 px-4 py-3.5 text-sm font-semibold text-blue-300 shadow-lg shadow-blue-950/20">
              <span className="text-lg">⌂</span>
              Inicio
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-blue-400/15 bg-gradient-to-br from-blue-600/15 to-cyan-500/[0.04] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-xl text-blue-300">
              ✦
            </div>

            <p className="mt-4 text-sm font-bold">
              Gestión comercial
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Todas las herramientas de tu negocio en un solo lugar.
            </p>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400" />
            </div>
          </div>

          <p className="mt-7 text-center text-[10px] text-slate-600">
            MINIMARKET JOSÉ · VENEZUELA
          </p>

        </aside>

        {/* ÁREA PRINCIPAL */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* BARRA SUPERIOR */}
          <header className="flex h-[76px] items-center justify-between border-b border-white/[0.07] bg-[#0A192C]/65 px-5 backdrop-blur-xl sm:px-9">

            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 font-black shadow-lg shadow-blue-600/20">
                MJ
              </div>
              <div>
                <p className="text-xs font-black tracking-wide">
                  MINIMARKET JOSÉ
                </p>
                <p className="text-[10px] text-slate-500">
                  Centro de Guarenas
                </p>
              </div>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs text-slate-500">
                Espacio de trabajo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-200">
                Inicio
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                <span className="text-[10px] font-bold text-emerald-300">
                  SISTEMA DISPONIBLE
                </span>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/15 text-sm font-bold text-blue-300">
                MJ
              </div>
            </div>

          </header>

          {/* CONTENIDO */}
          <div className="mx-auto flex w-full max-w-[1450px] flex-1 flex-col px-5 py-8 sm:px-9 sm:py-10 lg:px-12">

            {/* BIENVENIDA */}
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">
                    Panel principal
                  </span>
                </div>

                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Bienvenido a{" "}
                  <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                    Minimarket José
                  </span>
                </h2>

                <p className="mt-3 text-sm text-slate-400">
                  Tu espacio de gestión comercial.
                </p>
              </div>

              <div className="text-xs text-slate-500">
                CENTRO DE GUARENAS · VENEZUELA
              </div>

            </div>

            {/* PANEL PRINCIPAL DE ACCESO */}
            <section className="relative overflow-hidden rounded-[26px] border border-blue-400/25 bg-gradient-to-br from-[#123A75] via-[#0C2B58] to-[#101E36] p-7 shadow-2xl shadow-blue-950/40 sm:p-10 lg:p-12">

              <div className="pointer-events-none absolute -right-24 -top-36 h-[450px] w-[450px] rounded-full border border-blue-300/10" />
              <div className="pointer-events-none absolute -right-8 -top-20 h-[320px] w-[320px] rounded-full border border-blue-300/10" />
              <div className="pointer-events-none absolute right-20 top-20 h-64 w-64 rounded-full bg-blue-400/20 blur-[100px]" />

              <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_300px]">

                <div>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200/20 bg-blue-300/10 px-3 py-2">
                    <span className="text-blue-200">✦</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
                      Plataforma de gestión
                    </span>
                  </div>

                  <h3 className="mt-7 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                    Todo tu negocio.
                    <br />
                    <span className="text-cyan-300">
                      En un solo lugar.
                    </span>
                  </h3>

                  <p className="mt-5 max-w-lg text-sm leading-7 text-blue-100/70">
                    Accede a las herramientas de administración,
                    ventas, inventario y control comercial de
                    Minimarket José.
                  </p>

                  <Link
                    href="/login"
                    className="group mt-8 inline-flex w-full items-center justify-center gap-4 rounded-xl bg-gradient-to-r from-[#2584FF] to-[#0870F5] px-7 py-4 text-sm font-black tracking-wide text-white shadow-xl shadow-blue-950/40 transition duration-300 hover:-translate-y-1 hover:from-[#42A0FF] hover:to-[#1685FF] hover:shadow-blue-500/30 sm:w-auto"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                      ↗
                    </span>
                    ACCEDER AL SISTEMA
                    <span className="text-lg transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>

                  <p className="mt-5 text-xs text-blue-100/50">
                    Acceso exclusivo para personal autorizado.
                  </p>
                </div>

                {/* ICONO CENTRAL */}
                <div className="relative mx-auto hidden w-full max-w-[280px] lg:block">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-[65px]" />

                  <div className="relative rounded-[32px] border border-blue-200/20 bg-[#071A35]/70 p-8 shadow-2xl backdrop-blur-xl">

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/70">
                        MINIMARKET
                      </span>
                      <span className="text-cyan-300">✦</span>
                    </div>

                    <div className="flex flex-col items-center py-12">
                      <div className="flex h-32 w-32 items-center justify-center rounded-[32px] border border-blue-200/30 bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_15px_50px_rgba(37,99,235,.4)]">
                        <span className="text-6xl font-black tracking-tighter text-white">
                          MJ
                        </span>
                      </div>

                      <p className="mt-7 text-center text-lg font-black tracking-wider">
                        MINIMARKET JOSÉ
                      </p>

                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        CALIDAD · CONFIANZA
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 border-t border-white/10 pt-5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-semibold text-blue-100/60">
                        ENTORNO COMERCIAL
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </section>

            {/* MÓDULOS */}
            <section className="mt-10">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">
                    Herramientas de gestión
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Módulos disponibles en la plataforma
                  </p>
                </div>

                <span className="rounded-lg border border-blue-400/15 bg-blue-500/10 px-3 py-2 text-[10px] font-bold text-blue-300">
                  04 MÓDULOS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

                {modules.map((module) => (
                  <div
                    key={module.title}
                    className="group rounded-2xl border border-white/[0.08] bg-[#102039]/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-[#142B4B] hover:shadow-xl hover:shadow-blue-950/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${module.color} text-2xl font-bold text-white shadow-lg`}>
                        {module.icon}
                      </div>

                      <span className="text-lg text-slate-600 transition group-hover:text-blue-400">
                        ↗
                      </span>
                    </div>

                    <h4 className="mt-6 text-sm font-bold text-white">
                      {module.title}
                    </h4>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {module.description}
                    </p>
                  </div>
                ))}

              </div>
            </section>

            {/* PIE */}
            <footer className="mt-auto flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-8 sm:mt-12 sm:flex-row">
              <p className="text-[10px] text-slate-600">
                © {new Date().getFullYear()} MINIMARKET JOSÉ
              </p>

              <p className="text-[10px] font-semibold tracking-wider text-slate-600">
                CENTRO DE GUARENAS · VENEZUELA
              </p>
            </footer>

          </div>
        </div>
      </div>
    </main>
  );
}
