"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  return (
    <main className="min-h-screen bg-[#fffdf8] text-[#6b3f22]">
      {/* Barra superior fija */}
      <header className="fixed top-0 left-0 right-0 z-40 h-28 bg-[#5f9b5f] shadow-md">
        <div className="h-full flex items-center justify-between px-8 md:px-16">
          <Link href="/" className="flex items-center">
            <img
              src="/icons/logohumusai.png"
              alt="Logo HumusAI"
              className="h-28 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-6">
            <button className="rounded-full bg-white px-6 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition">
              Iniciar sesión
            </button>

            <button className="rounded-full bg-white px-6 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition">
              Registrarse
            </button>
          </div>
        </div>
      </header>

      {/* Botón menú fijo */}
  {!menuOpen && (
  <button
    onClick={() => setMenuOpen(true)}
    className="fixed left-2 top-30 z-80 h-11 w-11 rounded-full border-4 border-[#3a8d43] bg-transparent text-[#3a8d43] shadow-lg hover:scale-105 transition flex items-center justify-center"
    aria-label="Abrir menú"
  >
    <span className="flex flex-col gap-1">
      <span className="block h-1 w-6 rounded-full bg-[#3a8d43]" />
      <span className="block h-1 w-6 rounded-full bg-[#3a8d43]" />
      <span className="block h-1 w-6 rounded-full bg-[#3a8d43]" />
    </span>
  </button>
)}

      {/* Panel lateral desplegable */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/20"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar fondo del menú"
          />

          <aside className="relative h-full w-72 bg-[#dce8dc] border-r-8 border-[#6aa96a] shadow-2xl rounded-r-4xl p-6">
            <button
  onClick={() => setMenuOpen(false)}
  className="absolute right-3 top-5 z-90 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#6b3f22] shadow-lg hover:scale-105 transition"
  aria-label="Cerrar menú"
>
  ✕
</button>

            <nav className="mt-30 flex flex-col gap-4">
              <MenuLink href="/" label="Inicio" />
              <MenuLink href="/asistente" label="Asistente IA" />
              <MenuLink href="/comunidad" label="Comunidad" />
              <MenuLink href="/laboratorio" label="Laboratorio" />
            </nav>
          </aside>
        </div>
      )}

      {/* Contenido inicio */}
      <section className="pt-36 px-6 md:px-16 pb-20">
        <div className="relative min-h-155 flex flex-col items-center">
          <div className="max-w-5xl text-center mt-10">
            <div className="inline-block rounded-2xl bg-[#efe5dc] px-6 py-3 shadow-sm">
              <h1 className=".humus-font-text text-4xl md:text-5xl text-[#7a4828]">
                Bienvenidos a la plataforma de vermicompostaje
              </h1>
            </div>

            <div className="mt-3 inline-block rounded-2xl bg-[#efe5dc] px-6 py-3 shadow-sm">
              <h2 className=".humus-font-text text-3xl md:text-4xl text-[#7a4828]">
                con Inteligencia Artificial integrada.
              </h2>
            </div>
          </div>

          <div className="mt-20 w-full flex justify-center">
            <div className="max-w-5xl">
              <div className="inline-block rounded-2xl bg-[#efe5dc] px-5 py-3 shadow-sm">
                <h3 className=".humus-font-text text-4xl text-[#7a4828]">
                  Aquí podrás:
                </h3>
              </div>

              <ul className="mt-5 space-y-4 .humus-font-text text-3xl md:text-4xl leading-tight text-[#7a4828]">
                <li className="rounded-2xl bg-[#efe5dc] px-5 py-2 w-fit">
                  • Diseñar composteras elegantes, económicas y recicladas.
                </li>
                <li className="rounded-2xl bg-[#efe5dc] px-5 py-2 w-fit">
                  • Identificar especies de lombrices usadas en vermicompostaje.
                </li>
                <li className="rounded-2xl bg-[#efe5dc] px-5 py-2 w-fit">
                  • Registrar temperatura, pH y humedad de la tierra.
                </li>
                <li className="rounded-2xl bg-[#efe5dc] px-5 py-2 w-fit">
                  • Planificar la alimentación de tus lombrices.
                </li>
                <li className="rounded-2xl bg-[#efe5dc] px-5 py-2 w-fit">
                  • Y muchas cosas más...
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Información general al scrollear */}
      <section className=".humus-font-text px-6 md:px-16 py-16 bg-white">
        <div className=".humus-font-text max-w-7xl mx-auto">
          <h2 className=".humus-font-text text-4xl md:text-5xl text-[#7a4828] mb-8">
            Información sobre compost y lombrices
          </h2>

          <div className=".humus-font-text grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InfoCard 
              title="¿Qué es una vermicompostera?"
              text="Es un sistema donde lombrices y microorganismos transforman restos orgánicos en humus, un material rico en nutrientes útil para huertas, macetas y suelos."
            />

            <InfoCard
              title="¿Por qué usar IA?"
              text="La IA puede ayudarte a interpretar fotos, registrar parámetros, detectar patrones y sugerir mejoras según temperatura, humedad, pH, alimentación e historial."
            />

            <InfoCard
              title="Diseños posibles"
              text="Podés usar cajones verticales, bandejas horizontales, tachos reciclados con perforaciones, sistemas caseros o módulos más profesionales."
            />

            <InfoCard
              title="Seguimiento biológico"
              text="HumusAI está pensado para registrar evolución, reproducción, alimentación, generación de humus, lixiviado y posibles alertas ambientales."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            <ComposterImage title="Sistema vertical" />
            <ComposterImage title="Tacho reciclado" />
            <ComposterImage title="Cajón horizontal" />
            <ComposterImage title="Diseño modular" />
          </div>
        </div>
      </section>

      {/* Chat rápido */}
      {chatOpen && (
        <div
          className={`fixed z-50 bg-[#dce8dc] border-4 border-black shadow-2xl rounded-4xl overflow-hidden ${
            chatExpanded
              ? "inset-6"
              : "right-6 bottom-28 w-[min(90vw,680px)] h-130"
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setChatExpanded(true)}
              className="text-4xl"
              aria-label="Ampliar chat"
            >
              ↗
            </button>

            <button
              onClick={() => setChatOpen(false)}
              className="text-5xl leading-none"
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </div>

          <div className="px-6">
            <p className=".humus-font-text text-2xl md:text-3xl text-black">
              ¡Hola! Soy Humi y estoy aquí para responder todas las dudas que
              tengas acerca de vermicompostaje y ciencias. ¿Qué te gustaría
              saber hoy?
            </p>

          </div>

          <div className="absolute left-4 right-4 bottom-4 flex items-center rounded-full border-4 border-black bg-[#e7f0e7] overflow-hidden">
            <input
              className="flex-1 bg-transparent px-5 py-4 text-2xl humus-font-text text-black outline-none placeholder:text-black/70"
              placeholder="Escribí tu pregunta..."
            />
            <button className="px-5 text-4xl" aria-label="Enviar pregunta">
              ▷
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function MenuLink({ href, label }) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white px-6 py-4 text-center humus-font-brand text-3xl text-[#7a4828] shadow-lg hover:scale-105 transition"
    >
      {label}
    </Link>
  );
}

function InfoCard({ title, text }) {
  return (
    <article className="rounded-3xl bg-[#f1e8dd] p-6 shadow-sm border border-[#e0d1c2]">
      <h3 className=".humus-font-text text-3xl text-[#7a4828] mb-3">
        {title}
      </h3>
      <p className="text-xl leading-relaxed text-[#5f3b24]">{text}</p>
    </article>
  );
}

function ComposterImage({ title }) {
  return (
    <div className="aspect-3/4 rounded-2xl border-4 border-[#7a4828] bg-linear-to-br from-[#e8f0df] to-[#c8d9bd] flex items-center justify-center shadow-md">
      <span className="humus-font-brand text-2xl text-[#7a4828] text-center px-4">
        {title}
      </span>
    </div>
  );
}