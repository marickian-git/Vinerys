"use client";
import { useEffect } from "react";
import { appPath } from "@/utils/appPath";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(appPath("/sw.js"))
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.error("SW error:", err));
    }
  }, []);
  return null;
}
