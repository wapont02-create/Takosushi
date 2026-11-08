
"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log(
          "POS Enterprise: Service Worker registrado correctamente.",
          registration.scope
        );
      } catch (error) {
        console.error(
          "POS Enterprise: Error al registrar el Service Worker:",
          error
        );
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}

