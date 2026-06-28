import Link from "next/link";

export default function PlanificacionPage() {
  return (
    <main className="min-h-screen bg-[#edf4ea] text-[#57351f] humus-font-text p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/laboratorio"
          className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg"
        >
          ← Volver a Laboratorio
        </Link>

        <h1 className="mt-8 humus-font-brand text-6xl text-[#6b3f22]">
          Planificación
        </h1>

        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <button className="rounded-4xl bg-white px-8 py-6 humus-font-brand text-4xl text-[#6b3f22] shadow-lg">
            Notas
          </button>

          <button className="rounded-4xl bg-white px-8 py-6 humus-font-brand text-4xl text-[#6b3f22] shadow-lg">
            Alimentación
          </button>
        </div>
      </div>
    </main>
  );
}