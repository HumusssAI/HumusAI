import Link from "next/link";

export default function Sidebar() {

  return (

    <aside className="w-64 h-screen bg-zinc-900 border-r border-zinc-800 p-6">

      <h1 className="text-3xl font-bold text-green-500 mb-10">
        HumusAI
      </h1>

      <nav className="flex flex-col gap-4 text-zinc-300">

        <Link
          href="/"
          className="hover:text-green-500 transition"
        >
          Inicio
        </Link>

        <Link
          href="/dashboard"
          className="hover:text-green-500 transition"
        >
          Dashboard
        </Link>

        <Link
          href="/community"
          className="hover:text-green-500 transition"
        >
          Comunidad
        </Link>

        <Link
          href="/"
          className="hover:text-green-500 transition"
        >
          Análisis IA
        </Link>

        <Link
          href="/"
          className="hover:text-green-500 transition"
        >
          Historial
        </Link>

      </nav>

    </aside>

  );
}