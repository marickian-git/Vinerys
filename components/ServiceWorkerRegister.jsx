"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations.map((registration) => registration.unregister()),
          ),
        )
        // Cache-urile vechi pot conține pagini private (dashboard, colecție) — le ștergem
        .then(() => ("caches" in window ? caches.keys() : []))
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith("vinerys")).map((key) => caches.delete(key))))
        .catch((err) => console.error("SW error:", err));
    }
  }, []);
  return null;
}
