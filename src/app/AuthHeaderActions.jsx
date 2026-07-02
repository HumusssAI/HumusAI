"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, getInitials, isAdminUser } from "./authUtils";

export default function AuthHeaderActions() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  function syncUser() {
    const savedUser = getCurrentUser();

    setCurrentUser(savedUser);
    setDataLoaded(true);
  }

  useEffect(() => {
    syncUser();

    window.addEventListener("storage", syncUser);
    window.addEventListener("humusai-auth-change", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("humusai-auth-change", syncUser);
    };
  }, []);

  if (!dataLoaded) return null;

  if (currentUser) {
    return (
      <Link
        href="/perfil"
        className={`fixed right-5 top-5 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-white humus-font-text text-lg font-bold shadow-xl border-2 hover:scale-105 transition ${
          isAdminUser(currentUser)
            ? "border-[#d4a017] text-[#8a5a00]"
            : "border-[#5f9b5f] text-[#6b3f22]"
        }`}
        title={isAdminUser(currentUser) ? "Perfil administrador" : "Ver perfil"}
        aria-label="Ver perfil"
      >
        {getInitials(currentUser)}
      </Link>
    );
  }

  return (
    <div className="fixed right-5 top-5 z-[9999] flex items-center gap-3">
      <Link
        href="/login"
        className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg border-2 border-[#5f9b5f] hover:scale-105 transition"
      >
        Iniciar sesión
      </Link>

      <Link
        href="/registro"
        className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg border-2 border-[#5f9b5f] hover:scale-105 transition"
      >
        Registrarse
      </Link>
    </div>
  );
}