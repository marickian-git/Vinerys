"use client";
import { useEffect } from "react";
import { appPath } from "@/utils/appPath";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const workerPath = appPath("/sw.js");
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations
              .filter(
                (registration) =>
                  !registration.scope.startsWith(
                    `${window.location.origin}${appPath("/")}`,
                  ),
              )
              .map((registration) => registration.unregister()),
          ),
        )
        .then(() =>
          navigator.serviceWorker.register(workerPath, { scope: appPath("/") }),
        )
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.error("SW error:", err));
    }
  }, []);
  return null;
}
