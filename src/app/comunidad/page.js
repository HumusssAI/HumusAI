"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const INITIAL_POSTS = [
  {
    id: "post-1",
    username: "@USUARIO1",
    title:
      "¿Alguien sabe qué especie de lombriz es la lombriz de Tandil? ¿Sirve para compostaje?",
    content:
      "Compré en una casa de pesca una porción de lombriz de Tandil pero no sé su nombre científico y si sirve para compost.",
    createdAt: "2026-06-29T18:20",
    likes: 14,
    dislikes: 2,
    userVote: null,
    comments: [
      {
        id: "comment-1",
        author: "@Humi",
        text: "Podría tratarse de una lombriz usada para carnada. Habría que revisar fotos, color, tamaño y comportamiento para orientarte mejor.",
        createdAt: "2026-06-29T18:45",
      },
      {
        id: "comment-2",
        author: "@UsuarioX",
        text: "Si podés subí una foto porque algunas no son las mejores para vermicompostaje.",
        createdAt: "2026-06-29T19:02",
      },
    ],
    saved: false,
    image: "",
    imageName: "",
  },
  {
    id: "post-2",
    username: "@USUARIOX",
    title: "¿Dónde puedo conseguir lombrices californianas?",
    content:
      "Hola comunidad, ¿alguien sabe dónde puedo conseguir lombrices californianas para compost acá en Rosario?",
    createdAt: "2026-06-28T16:10",
    likes: 21,
    dislikes: 1,
    userVote: null,
    comments: [
      {
        id: "comment-3",
        author: "@Usuario2",
        text: "A veces se consiguen por Marketplace o grupos de huerta.",
        createdAt: "2026-06-28T16:50",
      },
    ],
    saved: false,
    image: "",
    imageName: "",
  },
];

const INITIAL_ARTICLES = [
  {
    id: "article-1",
    title: "Vermicomposting organic wastes: a review",
    source: "Scientific review",
    year: "2024",
    summary:
      "Revisión general sobre transformación de residuos orgánicos mediante vermicompostaje, calidad del humus y factores ambientales.",
  },
  {
    id: "article-2",
    title: "Earthworm species in compost systems",
    source: "Applied Soil Ecology",
    year: "2023",
    summary:
      "Comparación de especies de lombrices usadas en compostaje y su eficiencia según tipo de residuo y condiciones ambientales.",
  },
  {
    id: "article-3",
    title: "Moisture and pH effects on worm activity",
    source: "Waste Management Journal",
    year: "2022",
    summary:
      "Trabajo sobre cómo la humedad, el pH y la temperatura afectan la actividad y reproducción de lombrices.",
  },
];

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(dateTime) {
  if (!dateTime) return "";

  const date = new Date(dateTime);

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPostImages(post) {
  const normalizedImages = [];

  if (Array.isArray(post.images)) {
    post.images.forEach((imageItem, index) => {
      if (typeof imageItem === "string") {
        normalizedImages.push({
          id: `${post.id}-image-${index}`,
          src: imageItem,
          name: `Imagen ${index + 1}`,
        });

        return;
      }

      const imageSrc =
        imageItem?.src ||
        imageItem?.image ||
        imageItem?.url ||
        imageItem?.dataUrl ||
        "";

      if (imageSrc) {
        normalizedImages.push({
          id: imageItem.id || `${post.id}-image-${index}`,
          src: imageSrc,
          name:
            imageItem.name ||
            imageItem.imageName ||
            imageItem.filename ||
            `Imagen ${index + 1}`,
        });
      }
    });
  }

  if (normalizedImages.length > 0) {
    return normalizedImages;
  }

  if (post.image) {
    return [
      {
        id: `${post.id}-legacy-image`,
        src: post.image,
        name: post.imageName || "Imagen de la charla",
      },
    ];
  }

  return [];
}

export default function ComunidadPage() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [searchText, setSearchText] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [menuOpenPostId, setMenuOpenPostId] = useState(null);
  const [imageViewer, setImageViewer] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const savedPosts = safeParseJSON(
      localStorage.getItem("humusai-community-posts"),
      INITIAL_POSTS
    );

    setPosts(Array.isArray(savedPosts) ? savedPosts : INITIAL_POSTS);
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;

    localStorage.setItem("humusai-community-posts", JSON.stringify(posts));
  }, [posts, dataLoaded]);

  const filteredPosts = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();

    return posts
      .filter((post) => {
        const searchable = `${post.username} ${post.title} ${post.content}`.toLowerCase();

        return searchable.includes(normalized);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts, searchText]);

  const selectedPost =
    posts.find((post) => post.id === selectedPostId) || null;

  function openImageViewer(image, imageName) {
    setImageViewer({
      image,
      imageName: imageName || "Imagen de la charla",
    });
  }    

  function openPost(postId) {
    setSelectedPostId(postId);
    setMenuOpenPostId(null);
  }

  function toggleVote(postId, voteType) {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        let likes = post.likes || 0;
        let dislikes = post.dislikes || 0;
        let userVote = post.userVote || null;

        if (voteType === "like") {
          if (userVote === "like") {
            likes -= 1;
            userVote = null;
          } else if (userVote === "dislike") {
            dislikes -= 1;
            likes += 1;
            userVote = "like";
          } else {
            likes += 1;
            userVote = "like";
          }
        }

        if (voteType === "dislike") {
          if (userVote === "dislike") {
            dislikes -= 1;
            userVote = null;
          } else if (userVote === "like") {
            likes -= 1;
            dislikes += 1;
            userVote = "dislike";
          } else {
            dislikes += 1;
            userVote = "dislike";
          }
        }

        return {
          ...post,
          likes: Math.max(0, likes),
          dislikes: Math.max(0, dislikes),
          userVote,
        };
      })
    );
  }

  function addComment() {
    if (!selectedPostId) return;

    if (!commentText.trim()) {
      alert("Escribí un comentario.");
      return;
    }

    const newComment = {
      id: `comment-${Date.now()}`,
      author: "@USUARIO",
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === selectedPostId
          ? {
              ...post,
              comments: [...(post.comments || []), newComment],
            }
          : post
      )
    );

    setCommentText("");
  }

  function toggleSave(postId) {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              saved: !post.saved,
            }
          : post
      )
    );

    setMenuOpenPostId(null);
  }

  function sharePost(postId) {
    const link = `${window.location.origin}/comunidad#${postId}`;

    navigator.clipboard.writeText(link);
    alert("Enlace copiado al portapapeles.");
    setMenuOpenPostId(null);
  }

  function reportPost() {
    alert("Publicación reportada.");
    setMenuOpenPostId(null);
  }

  function deletePost(postId) {
    const confirmed = confirm("¿Querés eliminar esta charla?");

    if (!confirmed) return;

    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

    if (selectedPostId === postId) {
      setSelectedPostId(null);
    }

    setMenuOpenPostId(null);
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

            <div className="flex items-center gap-3 pt-1">
              <button className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition">
                Iniciar sesión
              </button>

              <button className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition">
                Registrarse
              </button>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <section className="px-4 py-4 md:px-5 md:py-5">
          <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 items-start">
            {/* Botones laterales */}
            <aside className="flex flex-col gap-4">
              <Link
                href="/comunidad/nueva"
                className="rounded-[1.8rem] bg-[#6a6a6a] px-4 py-5 text-center humus-font-text text-2xl text-white shadow-lg hover:scale-105 transition"
              >
                Mis charlas
                <br />
                / nueva
              </Link>

              <Link
  href="/comunidad/articulos"
  className="rounded-[1.8rem] bg-[#6a6a6a] px-4 py-5 text-center humus-font-text text-2xl text-white shadow-lg hover:scale-105 transition leading-tight"
>
  Artículos
  <br />
  científicos
</Link>
            </aside>

            {/* Feed */}
            <div className="space-y-4">
              {/* Buscador */}
              <div className="rounded-2xl border-2 border-[#8f6d4e] bg-[#f3ebe3] px-4 py-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-4xl text-[#6b3f22]">⌕</span>

                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Buscar en Humus.AI..."
                    className="w-full bg-transparent text-2xl text-black outline-none placeholder:text-[#4d4d4d]"
                  />
                </div>
              </div>

              {/* Charlas */}
              <div className="space-y-4">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <article
                      key={post.id}
                      id={post.id}
                      className="rounded-4xl bg-[#2f2f32] px-5 py-4 text-white shadow-xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xl font-bold">{post.username}</p>

                          <h2 className="mt-1 text-2xl font-bold leading-snug">
                            {post.title}
                          </h2>

                          <p className="mt-2 text-xl leading-relaxed text-[#f1f1f1]">
                            {post.content}
                          </p>

                         {getPostImages(post).length > 0 && (
  <div className="mt-4 flex flex-wrap gap-3">
    {getPostImages(post).map((imageItem) => (
      <button
        key={imageItem.id}
        type="button"
        onClick={() => openImageViewer(imageItem.src, imageItem.name)}
        className="block h-48 w-48 overflow-hidden rounded-3xl bg-black/20 shadow-lg hover:scale-105 transition"
        title="Ver imagen"
      >
        <img
          src={imageItem.src}
          alt={imageItem.name || post.title}
          className="h-full w-full object-cover"
        />
      </button>
    ))}
  </div>
)}

                          <p className="mt-2 text-sm text-[#cfcfcf]">
                            {formatDate(post.createdAt)}
                          </p>
                        </div>

                        <div className="relative">
                          <button
                            onClick={() =>
                              setMenuOpenPostId((prev) =>
                                prev === post.id ? null : post.id
                              )
                            }
                            className="px-2 py-1 text-3xl text-white hover:scale-110 transition"
                          >
                            ...
                          </button>

                          {menuOpenPostId === post.id && (
                            <div className="absolute right-0 top-10 z-20 w-48 rounded-2xl bg-white p-2 shadow-xl text-[#6b3f22]">
                              <button
                                onClick={() => sharePost(post.id)}
                                className="block w-full rounded-xl px-3 py-2 text-left hover:bg-[#f2ebe3]"
                              >
                                Compartir
                              </button>

                              <button
                                onClick={() => toggleSave(post.id)}
                                className="block w-full rounded-xl px-3 py-2 text-left hover:bg-[#f2ebe3]"
                              >
                                {post.saved ? "Quitar guardado" : "Guardar"}
                              </button>

                              <button
                                onClick={reportPost}
                                className="block w-full rounded-xl px-3 py-2 text-left hover:bg-[#f2ebe3]"
                              >
                                Reportar / denunciar
                              </button>

                              <button
                                onClick={() => deletePost(post.id)}
                                className="block w-full rounded-xl px-3 py-2 text-left text-red-600 hover:bg-[#f2ebe3]"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-5 text-white">
                        <button
                          onClick={() => toggleVote(post.id, "like")}
                          className={`flex items-center gap-2 hover:scale-105 transition ${
                            post.userVote === "like"
                              ? "text-green-400"
                              : "text-white"
                          }`}
                        >
                          <span className="text-3xl">👍</span>
                          <span className="text-2xl">{post.likes || 0}</span>
                        </button>

                        <button
                          onClick={() => toggleVote(post.id, "dislike")}
                          className={`flex items-center gap-2 hover:scale-105 transition ${
                            post.userVote === "dislike"
                              ? "text-red-400"
                              : "text-white"
                          }`}
                        >
                          <span className="text-3xl">👎</span>
                          <span className="text-2xl">
                            {post.dislikes || 0}
                          </span>
                        </button>

                        <button
                          onClick={() => openPost(post.id)}
                          className="flex items-center gap-2 hover:scale-105 transition"
                        >
                          <span className="text-3xl">💬</span>
                          <span className="text-2xl">
                            {(post.comments || []).length}
                          </span>
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-4xl bg-[#2f2f32] px-5 py-6 text-center text-2xl text-white shadow-xl">
                    No se encontraron charlas con esa búsqueda.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal comentarios */}
      {selectedPost && (
        <Modal onClose={() => setSelectedPostId(null)}>
          <div className="rounded-4xl bg-[#f4ede5] p-6 text-[#6b3f22] max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold">{selectedPost.username}</h2>

            <h3 className="mt-2 text-3xl font-bold leading-snug">
              {selectedPost.title}
            </h3>

            <p className="mt-3 text-xl leading-relaxed text-[#4a3425]">
              {selectedPost.content}
            </p>

          {getPostImages(selectedPost).length > 0 && (
  <div className="mt-4 flex flex-wrap gap-3">
    {getPostImages(selectedPost).map((imageItem) => (
      <button
        key={imageItem.id}
        type="button"
        onClick={() => openImageViewer(imageItem.src, imageItem.name)}
        className="block h-52 w-52 overflow-hidden rounded-3xl bg-black/20 shadow-lg hover:scale-105 transition"
        title="Ver imagen"
      >
        <img
          src={imageItem.src}
          alt={imageItem.name || selectedPost.title}
          className="h-full w-full object-cover"
        />
      </button>
    ))}
  </div>
)}

            <p className="mt-2 text-sm text-[#7a6351]">
              {formatDate(selectedPost.createdAt)}
            </p>

            <div className="mt-6">
              <h4 className="humus-font-brand text-4xl mb-3">Comentarios</h4>

              <div className="space-y-3">
                {(selectedPost.comments || []).length > 0 ? (
                  selectedPost.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                    >
                      <p className="font-bold">{comment.author}</p>

                      <p className="text-sm text-[#7a6351]">
                        {formatDate(comment.createdAt)}
                      </p>

                      <p className="mt-2 text-lg text-[#4a3425]">
                        {comment.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-lg">Todavía no hay comentarios.</p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none resize-none"
                placeholder="Escribí un comentario..."
              />

              <button
                onClick={addComment}
                className="mt-3 w-full rounded-2xl bg-[#5b9b55] px-4 py-3 humus-font-brand text-3xl text-white"
              >
                Comentar
              </button>
            </div>
          </div>
        </Modal>
      )}
    {imageViewer && (
  <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/90 px-4 py-6">
    <button
      type="button"
      onClick={() => setImageViewer(null)}
      className="absolute inset-0"
      aria-label="Cerrar visualizador"
    />

    <button
      type="button"
      onClick={() => setImageViewer(null)}
      className="absolute right-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-3xl font-bold text-black shadow-lg hover:scale-105 transition"
      aria-label="Cerrar imagen"
    >
      ✕
    </button>

    <img
      src={imageViewer.image}
      alt={imageViewer.imageName}
      className="relative z-10 max-h-[88vh] max-w-[92vw] rounded-3xl object-contain shadow-2xl"
    />
  </div>
)}
    </main>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 px-4 py-6">
      <button
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Cerrar modal"
      />

      <div className="relative z-10 w-full max-w-3xl">
        <button
          onClick={onClose}
          className="absolute -top-3 right-0 rounded-full bg-white px-4 py-2 text-2xl font-bold text-[#6b3f22] shadow-lg"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}