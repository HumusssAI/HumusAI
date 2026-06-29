import Link from "next/link";

export default function GraficosPage() {
  return (
    <main className="min-h-screen bg-[#edf4ea] text-[#57351f] humus-font-text p-8">
      <div className="max-w-5xl mx-auto">
        
        <h1 className="mt-8 humus-font-brand text-6xl text-[#6b3f22]">
          Gráficos
        </h1>

        <p className="mt-4 text-2xl">
          Acá vamos a mostrar gráficos de temperatura, pH, humedad y población.
        </p>
      </div>
    </main>
  );
}