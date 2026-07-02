"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export default function RegistroPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleRegister(event) {
    event.preventDefault();

    if (!name.trim()) {
      alert("Ingresá tu nombre.");
      return;
    }

    if (!email.trim()) {
      alert("Ingresá tu email.");
      return;
    }

    if (!password.trim()) {
      alert("Ingresá una contraseña.");
      return;
    }

    const users = safeParseJSON(localStorage.getItem("humusai-users"), []);

    const existingUser = users.find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (existingUser) {
      alert("Ya existe una cuenta con ese email.");
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      password,
      createdAt: new Date().toISOString(),
    };

    const publicUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    localStorage.setItem("humusai-users", JSON.stringify([...users, newUser]));
    localStorage.setItem("humusai-auth-user", JSON.stringify(publicUser));

    window.dispatchEvent(new Event("humusai-auth-change"));

    router.push("/perfil");
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
            <img
              src="/icons/logohumusai.png"
              alt="Logo HumusAI"
              className="mx-auto h-28 w-auto object-contain"
            />

            <h1 className="mt-2 humus-font-brand text-5xl text-[#6b3f22]">
              Crear cuenta
            </h1>

            <p className="mt-2 text-lg text-[#4a3425]">
              Registrate para usar Comunidad y Laboratorio.
            </p>
          </div>

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="text-lg font-bold">Nombre</label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                placeholder="Ej: Juan Pablo Sito"
              />
            </div>

            <div>
              <label className="text-lg font-bold">Email</label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                placeholder="tuemail@gmail.com"
              />
            </div>

            <div>
              <label className="text-lg font-bold">Contraseña</label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                placeholder="Contraseña"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#5b9b55] px-4 py-3 humus-font-brand text-3xl text-white shadow-lg hover:scale-105 transition"
            >
              Registrarme
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="rounded-full bg-white px-4 py-2 font-bold text-[#6b3f22] shadow-md hover:scale-105 transition"
            >
              Volver al inicio
            </Link>

            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-2 font-bold text-[#6b3f22] shadow-md hover:scale-105 transition"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}