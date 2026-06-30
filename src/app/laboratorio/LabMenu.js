"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const labLinks = [
  {
    href: "/laboratorio",
    label: "Laboratorio",
    key: "laboratorio",
  },
  {
    href: "/laboratorio/calendario",
    label: "Calendario",
    key: "calendario",
  },
  {
    href: "/laboratorio/parametros",
    label: "Parámetros",
    key: "parametros",
  },
  {
    href: "/laboratorio/graficos",
    label: "Gráficos",
    key: "graficos",
  },
  {
    href: "/laboratorio/planificacion",
    label: "Planificación",
    key: "planificacion",
  },
];

function getActiveKey(pathname) {
  if (pathname === "/laboratorio") return "laboratorio";
  if (pathname.startsWith("/laboratorio/calendario")) return "calendario";
  if (pathname.startsWith("/laboratorio/parametros")) return "parametros";
  if (pathname.startsWith("/laboratorio/graficos")) return "graficos";
  if (pathname.startsWith("/laboratorio/planificacion")) return "planificacion";

  return "laboratorio";
}

export default function LabMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const active = getActiveKey(pathname);

  return (
    <>
      <button
  onClick={() => setMenuOpen(true)}
  className="fixed left-2 top-29 z-80 h-12 w-12 rounded-full border-4 border-[#3a8d43] bg-transparent text-[#3a8d43] shadow-lg hover:scale-105 transition flex items-center justify-center"
  aria-label="Abrir menú de laboratorio"
>
  <span className="flex flex-col gap-1">
    <span className="block h-1 w-6 rounded-full bg-[#3a8d43]" />
    <span className="block h-1 w-6 rounded-full bg-[#3a8d43]" />
    <span className="block h-1 w-6 rounded-full bg-[#3a8d43]" />
  </span>
</button>

      {menuOpen && (
        <div className="fixed inset-0 z-100">
          <button
            className="absolute inset-0 bg-black/25"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar fondo del menú"
          />

          <aside className="relative h-full w-80 bg-[#dce8dc] border-r-8 border-[#6aa96a] shadow-2xl rounded-r-4xl p-6">
            <button
              onClick={() => setMenuOpen(false)}
              className="mb-8 h-14 w-14 rounded-full bg-white border-4 border-[#3a8d43] text-[#3a8d43] shadow-md text-3xl hover:scale-105 transition"
              aria-label="Cerrar menú"
            >
              ×
            </button>

            <nav className="flex flex-col gap-5">
              {labLinks.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-2xl px-6 py-4 text-center humus-font-brand text-3xl shadow-lg hover:scale-105 transition ${
                    active === item.key
                      ? "bg-[#5f9b5f] text-white"
                      : "bg-white text-[#7a4828]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 border-t-4 border-[#6aa96a] pt-5">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block rounded-2xl bg-white px-6 py-4 text-center humus-font-brand text-3xl text-[#7a4828] shadow-lg hover:scale-105 transition"
              >
                Inicio
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}