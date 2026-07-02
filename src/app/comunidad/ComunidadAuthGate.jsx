"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export default function ComunidadAuthGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const currentUser = safeParseJSON(
      localStorage.getItem("humusai-auth-user"),
      null
    );

    if (!currentUser) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      setChecking(false);
      return;
    }

    setAllowed(true);
    setChecking(false);
  }, [pathname, router]);

  if (checking || !allowed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3ebe3] humus-font-text text-2xl text-[#6b3f22]">
        Para acceder a Comunidad, primero tenés que iniciar sesión...
      </main>
    );
  }

  return children;
}