"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCurrentUser, isAdminUser } from "../../authUtils";

const ARTICLES_STORAGE_KEY = "humusai-scientific-articles";

const INITIAL_ARTICLES = [
  {
    id: "article-1",
    title: "Vermicomposting organic wastes: a review",
    publishedAt: "2026-06-12",
    authors: "A. Martínez, L. Gómez, P. Singh",
    link: "https://scholar.google.com/",
    relevance: 9,
    createdBy: "system",
  },
  {
    id: "article-2",
    title: "Earthworm species for organic waste stabilization",
    publishedAt: "2026-05-28",
    authors: "M. Rodríguez, S. Kumar",
    link: "https://scholar.google.com/",
    relevance: 8,
    createdBy: "system",
  },
  {
    id: "article-3",
    title: "Moisture and pH effects on vermicompost quality",
    publishedAt: "2026-04-18",
    authors: "J. Alvarez, C. Fernández",
    link: "https://scholar.google.com/",
    relevance: 7,
    createdBy: "system",
  },
  {
    id: "article-4",
    title: "Eisenia fetida growth under different feeding regimes",
    publishedAt: "2026-03-30",
    authors: "R. Patel, M. López",
    link: "https://scholar.google.com/",
    relevance: 6,
    createdBy: "system",
  },
  {
    id: "article-5",
    title: "Nutrient dynamics during household vermicomposting",
    publishedAt: "2026-02-15",
    authors: "D. Sánchez, E. Torres",
    link: "https://scholar.google.com/",
    relevance: 5,
    createdBy: "system",
  },
  {
    id: "article-6",
    title: "Microbial activity in vermicompost systems",
    publishedAt: "2026-01-21",
    authors: "F. García, T. Wilson",
    link: "https://scholar.google.com/",
    relevance: 4,
    createdBy: "system",
  },
  {
    id: "article-7",
    title: "Temperature tolerance of composting earthworms",
    publishedAt: "2025-12-09",
    authors: "N. Herrera, V. Cohen",
    link: "https://scholar.google.com/",
    relevance: 3,
    createdBy: "system",
  },
  {
    id: "article-8",
    title: "Vermicompost as biofertilizer in horticultural crops",
    publishedAt: "2025-11-02",
    authors: "L. Ramírez, O. Méndez",
    link: "https://scholar.google.com/",
    relevance: 2,
    createdBy: "system",
  },
  {
    id: "article-9",
    title: "Management of leachate in small vermicomposters",
    publishedAt: "2025-10-14",
    authors: "S. Pereyra, M. Johnson",
    link: "https://scholar.google.com/",
    relevance: 1,
    createdBy: "system",
  },
];

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getEmptyArticleForm() {
  return {
    title: "",
    publishedAt: "",
    authors: "",
    link: "",
    relevance: "5",
  };
}

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

function normalizeLink(link) {
  const trimmedLink = String(link || "").trim();

  if (!trimmedLink) return "";

  if (
    trimmedLink.startsWith("http://") ||
    trimmedLink.startsWith("https://")
  ) {
    return trimmedLink;
  }

  return `https://${trimmedLink}`;
}

export default function ArticulosPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [searchText, setSearchText] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [articleForm, setArticleForm] = useState(getEmptyArticleForm());
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const savedUser = getCurrentUser();
    setCurrentUser(savedUser);

    const savedArticles = safeParseJSON(
      localStorage.getItem(ARTICLES_STORAGE_KEY),
      INITIAL_ARTICLES
    );

    setArticles(Array.isArray(savedArticles) ? savedArticles : INITIAL_ARTICLES);
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;

    localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
  }, [articles, dataLoaded]);

  const isAdmin = isAdminUser(currentUser);

  const filteredArticles = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return articles.filter((article) => {
      const searchableText =
        `${article.title} ${article.authors} ${article.publishedAt}`.toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [articles, searchText]);

  const relevantArticles = useMemo(() => {
    return [...filteredArticles].sort(
      (a, b) => Number(b.relevance || 0) - Number(a.relevance || 0)
    );
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

  function handleFormChange(event) {
    const { name, value } = event.target;

    setArticleForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  function resetForm() {
    setArticleForm(getEmptyArticleForm());
    setEditingArticleId(null);
    setShowAdminForm(false);
  }

  function openCreateForm() {
    setArticleForm(getEmptyArticleForm());
    setEditingArticleId(null);
    setShowAdminForm(true);
  }

  function openEditForm(article) {
    setArticleForm({
      title: article.title || "",
      publishedAt: article.publishedAt || "",
      authors: article.authors || "",
      link: article.link || "",
      relevance: String(article.relevance || "5"),
    });

    setEditingArticleId(article.id);
    setShowAdminForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function saveArticle(event) {
    event.preventDefault();

    if (!isAdmin) {
      alert("Solo el administrador puede cargar o editar artículos.");
      return;
    }

    if (!articleForm.title.trim()) {
      alert("Ingresá el título del artículo.");
      return;
    }

    if (!articleForm.publishedAt) {
      alert("Ingresá la fecha de publicación.");
      return;
    }

    if (!articleForm.authors.trim()) {
      alert("Ingresá los autores.");
      return;
    }

    if (!articleForm.link.trim()) {
      alert("Ingresá el link del paper.");
      return;
    }

    const normalizedArticle = {
      title: articleForm.title.trim(),
      publishedAt: articleForm.publishedAt,
      authors: articleForm.authors.trim(),
      link: normalizeLink(articleForm.link),
      relevance: Number(articleForm.relevance || 5),
    };

    if (editingArticleId) {
      setArticles((prevArticles) =>
        prevArticles.map((article) =>
          article.id === editingArticleId
            ? {
                ...article,
                ...normalizedArticle,
                editedAt: new Date().toISOString(),
                editedBy: currentUser?.id || "admin",
              }
            : article
        )
      );

      resetForm();
      return;
    }

    const newArticle = {
      id: `article-${Date.now()}`,
      ...normalizedArticle,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || "admin",
    };

    setArticles((prevArticles) => [newArticle, ...prevArticles]);
    resetForm();
  }

  function deleteArticle(articleId) {
    if (!isAdmin) {
      alert("Solo el administrador puede eliminar artículos.");
      return;
    }

    const confirmed = confirm("¿Querés eliminar este artículo?");

    if (!confirmed) return;

    setArticles((prevArticles) =>
      prevArticles.filter((article) => article.id !== articleId)
    );

    if (editingArticleId === articleId) {
      resetForm();
    }
  }

  function restoreInitialArticles() {
    if (!isAdmin) return;

    const confirmed = confirm(
      "¿Querés restaurar los artículos de ejemplo? Esto reemplazará la lista actual."
    );

    if (!confirmed) return;

    setArticles(INITIAL_ARTICLES);
    resetForm();
    setCarouselIndex(0);
  }

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

              {isAdmin && (
                <section className="rounded-[1.8rem] bg-[#f3ebe3] px-5 py-4 text-[#3d2c23] shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold">
                        Panel administrador de artículos
                      </h2>

                      <p className="mt-1 text-lg text-[#5a4636]">
                        Cargá, editá o eliminá artículos científicos.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={openCreateForm}
                        className="rounded-full bg-[#5b9b55] px-5 py-2 text-lg font-bold text-white shadow-md hover:scale-105 transition"
                      >
                        Agregar artículo
                      </button>

                      <button
                        type="button"
                        onClick={restoreInitialArticles}
                        className="rounded-full bg-white px-5 py-2 text-lg font-bold text-[#6b3f22] shadow-md hover:scale-105 transition"
                      >
                        Restaurar ejemplos
                      </button>
                    </div>
                  </div>

                  {showAdminForm && (
                    <form
                      onSubmit={saveArticle}
                      className="mt-5 rounded-3x1 bg-white px-4 py-4 shadow-md"
                    >
                      <h3 className="text-2xl font-bold text-[#6b3f22]">
                        {editingArticleId
                          ? "Editar artículo"
                          : "Nuevo artículo"}
                      </h3>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-lg font-bold">Título</label>
                          <input
                            type="text"
                            name="title"
                            value={articleForm.title}
                            onChange={handleFormChange}
                            className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                            placeholder="Título del paper"
                          />
                        </div>

                        <div>
                          <label className="text-lg font-bold">
                            Fecha de publicación
                          </label>
                          <input
                            type="date"
                            name="publishedAt"
                            value={articleForm.publishedAt}
                            onChange={handleFormChange}
                            className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-lg font-bold">
                            Relevancia
                          </label>
                          <select
                            name="relevance"
                            value={articleForm.relevance}
                            onChange={handleFormChange}
                            className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                          >
                            <option value="1">1 - Baja</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5 - Media</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9 - Alta</option>
                            <option value="10">10 - Máxima</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-lg font-bold">Autores</label>
                          <input
                            type="text"
                            name="authors"
                            value={articleForm.authors}
                            onChange={handleFormChange}
                            className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                            placeholder="Autor 1, Autor 2, Autor 3"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-lg font-bold">
                            Link del paper
                          </label>
                          <input
                            type="text"
                            name="link"
                            value={articleForm.link}
                            onChange={handleFormChange}
                            className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="rounded-full bg-[#777777] px-5 py-2 text-lg font-bold text-white shadow-md hover:scale-105 transition"
                        >
                          Cancelar
                        </button>

                        <button
                          type="submit"
                          className="rounded-full bg-[#5b9b55] px-5 py-2 text-lg font-bold text-white shadow-md hover:scale-105 transition"
                        >
                          {editingArticleId ? "Guardar cambios" : "Guardar"}
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              )}

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
                        <article
                          key={article.id}
                          className="min-h-44 rounded-[1.8rem] bg-[#303033] px-5 py-5 text-white shadow-xl"
                        >
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noreferrer"
                            className="block hover:underline"
                          >
                            <h3 className="text-xl font-bold uppercase">
                              {article.title}
                            </h3>
                          </a>

                          <p className="mt-6 text-lg font-bold">
                            Fecha publicación:
                          </p>

                          <p className="text-lg">
                            {formatDate(article.publishedAt)}
                          </p>

                          <p className="mt-4 text-lg font-bold">Autores:</p>

                          <p className="text-lg">{article.authors}</p>

                          {isAdmin && (
                            <div className="mt-5 flex gap-3">
                              <button
                                type="button"
                                onClick={() => openEditForm(article)}
                                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6b3f22] shadow-md hover:scale-105 transition"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteArticle(article.id)}
                                className="rounded-full bg-[#b33a3a] px-4 py-2 text-sm font-bold text-white shadow-md hover:scale-105 transition"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </article>
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

              <section>
                <div className="inline-block rounded-2xl bg-[#f3ebe3] px-5 py-3 shadow-lg">
                  <h2 className="text-2xl font-bold text-[#3d2c23]">
                    Todos los artículos:
                  </h2>
                </div>

                <div className="mt-4 rounded-[1.8rem] bg-[#303033] px-5 py-5 text-white shadow-xl overflow-x-auto">
                  <div className="grid min-w-225 grid-cols-[1.5fr_0.7fr_1fr_0.5fr] gap-4 border-b border-white/30 pb-3 text-lg font-bold">
                    <p>Título</p>
                    <p>Fecha de publicación</p>
                    <p>Autores</p>
                    <p>{isAdmin ? "Acciones" : ""}</p>
                  </div>

                  <div className="divide-y divide-white/20 min-w-225">
                    {allArticles.length > 0 ? (
                      allArticles.map((article, index) => (
                        <div
                          key={article.id}
                          className="grid grid-cols-[1.5fr_0.7fr_1fr_0.5fr] gap-4 py-4 text-lg"
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

                          <div>
                            {isAdmin && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditForm(article)}
                                  className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#6b3f22] shadow-md hover:scale-105 transition"
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteArticle(article.id)}
                                  className="rounded-full bg-[#b33a3a] px-3 py-1 text-sm font-bold text-white shadow-md hover:scale-105 transition"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>
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