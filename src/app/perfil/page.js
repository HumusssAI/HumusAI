"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function PerfilPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = safeParseJSON(
      localStorage.getItem("humusai-auth-user"),
      null
    );

    if (!savedUser) {
      router.replace("/login?redirect=/perfil");
      return;
    }

    setCurrentUser(savedUser);
  }, [router]);

  function logout() {
    localStorage.removeItem("humusai-auth-user");
    window.dispatchEvent(new Event("humusai-auth-change"));
    router.push("/");
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3ebe3] humus-font-text text-[#6b3f22]">
        Cargando perfil...
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden humus-font-text text-[#6b3f22]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background/fondomadera.png')" }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <section className="w-full max-w-xl rounded-4x1 bg-[#f3ebe3] px-6 py-6 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl font-bold text-[#6b3f22] shadow-lg border-4 border-[#5f9b5f]">
              {getInitials(currentUser)}
            </div>

            <h1 className="mt-4 humus-font-brand text-5xl text-[#6b3f22]">
              Mi perfil
            </h1>

            <p className="mt-2 text-2xl font-bold">{currentUser.name}</p>

            <p className="mt-1 text-lg text-[#4a3425]">{currentUser.email}</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Link
              href="/laboratorio"
              className="rounded-2xl bg-white px-4 py-3 text-center text-xl font-bold text-[#6b3f22] shadow-md hover:scale-105 transition"
            >
              Ir a Laboratorio
            </Link>

            <Link
              href="/comunidad"
              className="rounded-2xl bg-white px-4 py-3 text-center text-xl font-bold text-[#6b3f22] shadow-md hover:scale-105 transition"
            >
              Ir a Comunidad
            </Link>

            <Link
              href="/"
              className="rounded-2xl bg-white px-4 py-3 text-center text-xl font-bold text-[#6b3f22] shadow-md hover:scale-105 transition"
            >
              Volver al inicio
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-2xl bg-[#b33a3a] px-4 py-3 text-center text-xl font-bold text-white shadow-md hover:scale-105 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}