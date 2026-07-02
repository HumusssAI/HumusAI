"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const ARTICLES = [
  {
    id: "article-1",
    title: "Vermicomposting organic wastes: a review",
    publishedAt: "2026-06-12",
    authors: "A. Martínez, L. Gómez, P. Singh",
    link: "https://scholar.google.com/",
    relevance: 9,
  },
  {
    id: "article-2",
    title: "Earthworm species for organic waste stabilization",
    publishedAt: "2026-05-28",
    authors: "M. Rodríguez, S. Kumar",
    link: "https://scholar.google.com/",
    relevance: 8,
  },
  {
    id: "article-3",
    title: "Moisture and pH effects on vermicompost quality",
    publishedAt: "2026-04-18",
    authors: "J. Alvarez, C. Fernández",
    link: "https://scholar.google.com/",
    relevance: 7,
  },
  {
    id: "article-4",
    title: "Eisenia fetida growth under different feeding regimes",
    publishedAt: "2026-03-30",
    authors: "R. Patel, M. López",
    link: "https://scholar.google.com/",
    relevance: 6,
  },
  {
    id: "article-5",
    title: "Nutrient dynamics during household vermicomposting",
    publishedAt: "2026-02-15",
    authors: "D. Sánchez, E. Torres",
    link: "https://scholar.google.com/",
    relevance: 5,
  },
  {
    id: "article-6",
    title: "Microbial activity in vermicompost systems",
    publishedAt: "2026-01-21",
    authors: "F. García, T. Wilson",
    link: "https://scholar.google.com/",
    relevance: 4,
  },
  {
    id: "article-7",
    title: "Temperature tolerance of composting earthworms",
    publishedAt: "2025-12-09",
    authors: "N. Herrera, V. Cohen",
    link: "https://scholar.google.com/",
    relevance: 3,
  },
  {
    id: "article-8",
    title: "Vermicompost as biofertilizer in horticultural crops",
    publishedAt: "2025-11-02",
    authors: "L. Ramírez, O. Méndez",
    link: "https://scholar.google.com/",
    relevance: 2,
  },
  {
    id: "article-9",
    title: "Management of leachate in small vermicomposters",
    publishedAt: "2025-10-14",
    authors: "S. Pereyra, M. Johnson",
    link: "https://scholar.google.com/",
    relevance: 1,
  },
];

function formatDate(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ArticulosPage() {
  const [searchText, setSearchText] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const filteredArticles = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return ARTICLES.filter((article) => {
      const searchableText = `${article.title} ${article.authors} ${article.publishedAt}`.toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [searchText]);

  const relevantArticles = useMemo(() => {
    return [...filteredArticles].sort((a, b) => b.relevance - a.relevance);
  }, [filteredArticles]);

  const allArticles = useMemo(() => {
    return [...filteredArticles].sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );
  }, [filteredArticles]);

  const visibleRelevantArticles = useMemo(() => {
    if (relevantArticles.length === 0) return [];

    const visible = [];

    for (let index = 0; index < Math.min(3, relevantArticles.length); index++) {
      const articleIndex = (carouselIndex + index) % relevantArticles.length;
      visible.push(relevantArticles[articleIndex]);
    }

    return visible;
  }, [relevantArticles, carouselIndex]);

  function goToPreviousArticle() {
    if (relevantArticles.length === 0) return;

    setCarouselIndex((prevIndex) =>
      prevIndex === 0 ? relevantArticles.length - 1 : prevIndex - 1
    );
  }

  function goToNextArticle() {
    if (relevantArticles.length === 0) return;

    setCarouselIndex((prevIndex) => (prevIndex + 1) % relevantArticles.length);
  }

  return (
    <main className="min-h-screen bg-[#2a2a2a] text-white relative overflow-hidden humus-font-text">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background/fondomadera.png')" }}
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-[#5b9b55] px-5 py-4 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="pt-1">
              <Link
                href="/"
                className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition"
              >
                Inicio
              </Link>
            </div>

            <div className="flex-1 flex justify-center">
              <img
                src="/icons/logohumusai.png"
                alt="Logo HumusAI"
                className="h-24 md:h-28 w-auto object-contain"
              />
            </div>

            <div className="w-72" />
          </div>
        </header>

        <section className="px-4 py-4 md:px-7 md:py-4">
          <div className="mx-auto grid max-w-7xl grid-cols-[76px_1fr] gap-4">
            {/* Flecha volver */}
            <div className="pt-4">
              <Link
                href="/comunidad"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#777777] text-4xl text-white shadow-lg hover:scale-105 transition"
                aria-label="Volver a Comunidad"
              >
                ←
              </Link>
            </div>

            <div className="space-y-6">
              {/* Buscador */}
              <div className="max-w-5xl rounded-2xl border-2 border-[#8f6d4e] bg-[#f3ebe3] px-4 py-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-4xl text-[#6b3f22]">⌕</span>

                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => {
                      setSearchText(event.target.value);
                      setCarouselIndex(0);
                    }}
                    placeholder="Buscar en Humus.AI..."
                    className="w-full bg-transparent text-2xl text-black outline-none placeholder:text-[#4d4d4d]"
                  />
                </div>
              </div>

              {/* Los más relevantes */}
              <section>
                <div className="inline-block rounded-2xl bg-[#f3ebe3] px-5 py-3 shadow-lg">
                  <h2 className="text-2xl font-bold text-[#3d2c23]">
                    Los más relevantes:
                  </h2>
                </div>

                <div className="mt-5 grid grid-cols-[64px_1fr_64px] items-center gap-4">
                  <button
                    type="button"
                    onClick={goToPreviousArticle}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3ebe3] text-3xl font-bold text-black shadow-lg hover:scale-105 transition"
                    aria-label="Artículo anterior"
                  >
                    {"<"}
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {visibleRelevantArticles.length > 0 ? (
                      visibleRelevantArticles.map((article) => (
                        <a
                          key={article.id}
                          href={article.link}
                          target="_blank"
                          rel="noreferrer"
                          className="min-h-44 rounded-[1.8rem] bg-[#303033] px-5 py-5 text-white shadow-xl hover:scale-105 transition"
                        >
                          <h3 className="text-xl font-bold uppercase">
                            {article.title}
                          </h3>

                          <p className="mt-6 text-lg font-bold">
                            Fecha publicación:
                          </p>

                          <p className="text-lg">
                            {formatDate(article.publishedAt)}
                          </p>

                          <p className="mt-4 text-lg font-bold">Autores:</p>

                          <p className="text-lg">{article.authors}</p>
                        </a>
                      ))
                    ) : (
                      <div className="md:col-span-3 rounded-[1.8rem] bg-[#303033] px-5 py-6 text-center text-2xl text-white shadow-xl">
                        No se encontraron artículos con esa búsqueda.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={goToNextArticle}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3ebe3] text-3xl font-bold text-black shadow-lg hover:scale-105 transition"
                    aria-label="Artículo siguiente"
                  >
                    {">"}
                  </button>
                </div>
              </section>

              {/* Todos los artículos */}
              <section>
                <div className="inline-block rounded-2xl bg-[#f3ebe3] px-5 py-3 shadow-lg">
                  <h2 className="text-2xl font-bold text-[#3d2c23]">
                    Todos los artículos:
                  </h2>
                </div>

                <div className="mt-4 rounded-[1.8rem] bg-[#303033] px-5 py-5 text-white shadow-xl">
                  <div className="grid grid-cols-[1.5fr_0.7fr_1fr] gap-4 border-b border-white/30 pb-3 text-lg font-bold">
                    <p>Título</p>
                    <p>Fecha de publicación</p>
                    <p>Autores</p>
                  </div>

                  <div className="divide-y divide-white/20">
                    {allArticles.length > 0 ? (
                      allArticles.map((article, index) => (
                        <div
                          key={article.id}
                          className="grid grid-cols-[1.5fr_0.7fr_1fr] gap-4 py-4 text-lg"
                        >
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold hover:underline"
                          >
                            {index + 1}-{article.title}
                          </a>

                          <p>{formatDate(article.publishedAt)}</p>

                          <p>{article.authors}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xl">
                        No hay artículos para mostrar.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}