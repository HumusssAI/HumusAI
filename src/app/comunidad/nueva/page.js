"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const CURRENT_USER = "@USUARIO6";

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
    comments: [],
    saved: false,
    image: "",
    imageName: "",
    images: [],
  },
];

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getCurrentDateTimeLocal() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
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
  if (Array.isArray(post.images) && post.images.length > 0) {
    return post.images;
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

function compressImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 900;

        let width = image.width;
        let height = image.height;

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };

      image.onerror = reject;
      image.src = event.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NuevaCharlaPage() {
  const fileInputRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [imageViewer, setImageViewer] = useState(null);
  const [menuOpenPostId, setMenuOpenPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
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

    try {
      localStorage.setItem("humusai-community-posts", JSON.stringify(posts));
    } catch (error) {
      console.error("No se pudieron guardar las charlas:", error);

      alert(
        "Las imágenes son demasiado pesadas para guardar en esta versión local. Probá con menos imágenes o fotos más chicas."
      );
    }
  }, [posts, dataLoaded]);

  const myPosts = useMemo(() => {
    return posts
      .filter((post) => post.username === CURRENT_USER)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts]);

  async function handleImageChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

    try {
      const compressedImages = await Promise.all(
        selectedFiles.map(async (file) => {
          const compressedImage = await compressImageToBase64(file);

          return {
            id: `image-${Date.now()}-${file.name}-${Math.random()}`,
            src: compressedImage,
            name: file.name,
          };
        })
      );

      setImages((prevImages) => [...prevImages, ...compressedImages]);
    } catch (error) {
      console.error("No se pudieron procesar las imágenes:", error);
      alert("No se pudieron cargar las imágenes.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeImage(imageId) {
    setImages((prevImages) =>
      prevImages.filter((imageItem) => imageItem.id !== imageId)
    );
  }

  function clearImages() {
    setImages([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openImageViewer(image, imageName) {
    setImageViewer({
      image,
      imageName: imageName || "Imagen de la charla",
    });
  }
function startEditPost(post) {
  const postImages = getPostImages(post).map((imageItem, index) => ({
    id: imageItem.id || `edit-image-${Date.now()}-${index}`,
    src: imageItem.src,
    name: imageItem.name || `Imagen ${index + 1}`,
  }));

  setEditingPostId(post.id);
  setTitle(post.title || "");
  setContent(post.content || "");
  setImages(postImages);
  setMenuOpenPostId(null);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function cancelEditPost() {
  setEditingPostId(null);
  setTitle("");
  setContent("");
  clearImages();
}

  function publishPost() {
  if (!title.trim()) {
    alert("Ingresá un título para la charla.");
    return;
  }

  if (!content.trim()) {
    alert("Escribí tu pregunta o comentario.");
    return;
  }

  if (editingPostId) {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === editingPostId
          ? {
              ...post,
              title: title.trim(),
              content: content.trim(),
              images,
              image: images[0]?.src || "",
              imageName: images[0]?.name || "",
              editedAt: getCurrentDateTimeLocal(),
            }
          : post
      )
    );

    setEditingPostId(null);
    setTitle("");
    setContent("");
    clearImages();

    return;
  }

  const newPost = {
    id: `post-${Date.now()}`,
    username: CURRENT_USER,
    title: title.trim(),
    content: content.trim(),
    createdAt: getCurrentDateTimeLocal(),
    likes: 0,
    dislikes: 0,
    userVote: null,
    comments: [],
    saved: false,
    images,
    image: images[0]?.src || "",
    imageName: images[0]?.name || "",
  };

  setPosts((prevPosts) => [newPost, ...prevPosts]);

  setTitle("");
  setContent("");
  clearImages();
}

  function deleteMyPost(postId) {
  const confirmed = confirm("¿Querés eliminar esta charla?");

  if (!confirmed) return;

  setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

  if (editingPostId === postId) {
    setEditingPostId(null);
    setTitle("");
    setContent("");
    clearImages();
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
        <header className="bg-[#5b9b55] px-5 py-3 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="pt-4">
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

            <div className="pt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-bold text-[#6b3f22] shadow-lg">
                JS
              </div>
            </div>
          </div>
        </header>

        <section className="px-4 py-4 md:px-7 md:py-4">
          <div className="mx-auto grid max-w-6xl grid-cols-[76px_1fr] gap-4">
            <div className="pt-4">
              <Link
                href="/comunidad"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#777777] text-4xl text-white shadow-lg hover:scale-105 transition"
                aria-label="Volver a Comunidad"
              >
                ←
              </Link>
            </div>

            <div className="max-w-4xl">
              <section className="rounded-[1.8rem] bg-[#303033] px-5 py-4 text-white shadow-xl">
                <p className="text-xl font-bold">{CURRENT_USER}</p>

                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ingresar título..."
                  className="mt-7 w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white"
                />

                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Haz tu pregunta o cuenta lo que quieras..."
                  rows={3}
                  className="mt-7 w-full resize-none bg-transparent text-2xl text-white outline-none placeholder:text-white"
                />

                {images.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-3">
                      {images.map((imageItem) => (
                        <div
                          key={imageItem.id}
                          className="relative h-36 w-36 overflow-hidden rounded-3xl bg-black/30 shadow-lg"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openImageViewer(imageItem.src, imageItem.name)
                            }
                            className="block h-full w-full"
                            title="Ver imagen"
                          >
                            <img
                              src={imageItem.src}
                              alt={imageItem.name}
                              className="h-full w-full object-cover"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeImage(imageItem.id)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg font-bold text-black shadow-lg hover:scale-105 transition"
                            title="Quitar imagen"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white hover:scale-110 transition"
                      title="Agregar imágenes"
                    >
                      <PaperClipIcon />
                    </button>
                  </div>

                  <div className="flex items-center gap-6">
                   <button
  type="button"
  onClick={publishPost}
  className="text-white hover:scale-110 transition"
  title={editingPostId ? "Guardar cambios" : "Publicar charla"}
>
  <SendIcon />
</button>

                    <button
                      type="button"
                      onClick={() =>
                        alert("Opciones de publicación próximamente.")
                      }
                      className="pb-1 text-3xl font-bold text-white hover:scale-110 transition"
                      title="Opciones"
                    >
                      ...
                    </button>
                  </div>
                </div>
              </section>

              <section className="mt-3">
                <div className="rounded-2xl bg-[#f3ebe3] px-4 py-3 shadow-lg">
                  <h2 className="text-2xl font-bold text-[#3d2c23]">
                    Mis charlas:
                  </h2>
                </div>

                <div className="mt-1 space-y-3">
                  {myPosts.length > 0 ? (
                    myPosts.map((post) => {
                      const postImages = getPostImages(post);

                      return (
                        <article
                          key={post.id}
                          className="rounded-3x1 bg-[#303033] px-5 py-4 text-white shadow-xl"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-xl font-bold">
                                {post.username}
                              </p>

                              <h3 className="mt-6 text-2xl font-bold">
                                {post.title}
                              </h3>

                              <p className="mt-3 text-xl leading-relaxed text-[#f1f1f1]">
                                {post.content}
                              </p>

                              {postImages.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-3">
                                  {postImages.map((imageItem) => (
                                    <button
                                      key={imageItem.id}
                                      type="button"
                                      onClick={() =>
                                        openImageViewer(
                                          imageItem.src,
                                          imageItem.name
                                        )
                                      }
                                      className="block h-40 w-40 overflow-hidden rounded-3xl bg-black/20 shadow-lg hover:scale-105 transition"
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

                              <p className="mt-3 text-sm text-[#cfcfcf]">
                                {formatDate(post.createdAt)}
                              </p>
                            </div>

                           <div className="relative">
  <button
    type="button"
    onClick={() =>
      setMenuOpenPostId((prevValue) =>
        prevValue === post.id ? null : post.id
      )
    }
    className="rounded-full bg-[#777777] px-4 py-2 text-2xl font-bold text-white shadow-md hover:scale-105 transition"
    title="Opciones"
  >
    ...
  </button>

  {menuOpenPostId === post.id && (
    <div className="absolute right-0 top-12 z-30 w-40 rounded-2xl bg-white p-2 text-[#6b3f22] shadow-xl">
      <button
        type="button"
        onClick={() => startEditPost(post)}
        className="block w-full rounded-xl px-3 py-2 text-left font-bold hover:bg-[#f2ebe3]"
      >
        Editar
      </button>

      <button
        type="button"
        onClick={() => deleteMyPost(post.id)}
        className="block w-full rounded-xl px-3 py-2 text-left font-bold text-red-600 hover:bg-[#f2ebe3]"
      >
        Eliminar
      </button>
    </div>
  )}
</div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <article className="rounded-3x1 bg-[#303033] px-5 py-5 text-white shadow-xl">
                      <p className="text-xl font-bold">{CURRENT_USER}</p>
{editingPostId && (
  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-2">
    <p className="text-sm font-bold text-white">
      Estás editando una charla.
    </p>

    <button
      type="button"
      onClick={cancelEditPost}
      className="rounded-full bg-[#777777] px-3 py-1 text-sm font-bold text-white hover:scale-105 transition"
    >
      Cancelar
    </button>
  </div>
)}
                      <p className="mt-6 text-2xl font-bold">
                        Aún no tienes charlas para mostrar.
                      </p>
                    </article>
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>

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

function PaperClipIcon() {
  return (
    <svg
      width="32"
      height="42"
      viewBox="0 0 32 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow"
    >
      <path
        d="M10 28.5L20.8 12.2C23.2 8.6 28.7 11.9 26.2 15.7L13.5 34.8C9.8 40.3 1.5 35.2 5.2 29.6L19.3 8.2C24.6 0.2 36.5 7.6 31.2 15.6L18 35.4"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow"
    >
      <path
        d="M8 10L56 32L8 54L18 34L38 32L18 30L8 10Z"
        stroke="white"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}