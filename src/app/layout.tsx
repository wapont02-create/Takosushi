
import type { Metadata, Viewport } from "next";
import "./globals.css";

import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "POS Enterprise",
  description:
    "Sistema profesional de punto de venta, inventario y gestión empresarial.",
  applicationName: "POS Enterprise",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "POS Enterprise",
  },

  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegister />
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
