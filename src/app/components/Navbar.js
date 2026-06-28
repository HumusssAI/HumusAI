import Link from "next/link";
export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-zinc-900 border-b border-zinc-800">
      
      <h1 className="text-2xl font-bold text-green-500">
        HumusAI
      </h1>

      <div className="flex gap-6 text-zinc-300">

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

</div>

    </nav>
  );
}