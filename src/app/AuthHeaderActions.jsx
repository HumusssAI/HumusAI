"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getInitials(user) {
  const fullName = user?.name?.trim();

  if (fullName) {
    const parts = fullName.split(" ").filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return parts[0].slice(0, 2).toUpperCase();
  }

  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase();
  }

  return "US";
}

export default function AuthHeaderActions() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  function syncUser() {
    const savedUser = safeParseJSON(
      localStorage.getItem("humusai-auth-user"),
      null
    );

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
        className="fixed right-5 top-5 z-9999 flex h-12 w-12 items-center justify-center rounded-full bg-white humus-font-text text-lg font-bold text-[#6b3f22] shadow-xl border-2 border-[#5f9b5f] hover:scale-105 transition"
        title="Ver perfil"
        aria-label="Ver perfil"
      >
        {getInitials(currentUser)}
      </Link>
    );
  }

  return (
    <div className="fixed right-5 top-5 z-9999 flex items-center gap-3">
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