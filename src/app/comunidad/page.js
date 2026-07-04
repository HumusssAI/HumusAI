"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getCurrentUser, getPublicUsername, isAdminUser } from "../authUtils";

const INITIAL_POSTS = [];
const COMMUNITY_POSTS_STORAGE_KEY = "humusai-community-posts";
const MAX_COMMENT_IMAGES = 3;

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

function isImageFile(file) {
  if (!file) return false;

  const hasImageMime = file.type && file.type.startsWith("image/");
  const hasImageExtension = /\.(png|jpg|jpeg|gif|webp|bmp|svg|avif)$/i.test(
    file.name || ""
  );

  return Boolean(hasImageMime || hasImageExtension);
}

function getRemovedImagePlaceholder(id, name = "Imagen removida") {
  return {
    id,
    src: "",
    name,
    removedByModerator: true,
  };
}

function getImageSrc(imageItem) {
  if (typeof imageItem === "string") return imageItem;

  return (
    imageItem?.src ||
    imageItem?.image ||
    imageItem?.url ||
    imageItem?.dataUrl ||
    ""
  );
}

function getPostImages(post) {
  const normalizedImages = [];

  if (Array.isArray(post.images)) {
    post.images.forEach((imageItem, index) => {
      const generatedId = `${post.id}-image-${index}`;

      if (typeof imageItem === "string") {
        normalizedImages.push({
          id: generatedId,
          src: imageItem,
          name: `Imagen ${index + 1}`,
          removedByModerator: false,
        });

        return;
      }

      if (imageItem?.removedByModerator) {
        normalizedImages.push({
          id: imageItem.id || generatedId,
          src: "",
          name: imageItem.name || `Imagen ${index + 1}`,
          removedByModerator: true,
        });

        return;
      }

      const imageSrc = getImageSrc(imageItem);

      if (imageSrc) {
        normalizedImages.push({
          id: imageItem.id || generatedId,
          src: imageSrc,
          name:
            imageItem.name ||
            imageItem.imageName ||
            imageItem.filename ||
            `Imagen ${index + 1}`,
          removedByModerator: false,
        });
      }
    });
  }

  if (normalizedImages.length > 0) {
    return normalizedImages;
  }

  if (post.imageRemovedByModerator) {
    return [
      {
        id: `${post.id}-legacy-image`,
        src: "",
        name: "Imagen de la charla",
        removedByModerator: true,
      },
    ];
  }

  if (post.image) {
    return [
      {
        id: `${post.id}-legacy-image`,
        src: post.image,
        name: post.imageName || "Imagen de la charla",
        removedByModerator: false,
      },
    ];
  }

  return [];
}

function getCommentImages(comment) {
  const normalizedImages = [];

  if (Array.isArray(comment.images)) {
    comment.images.forEach((imageItem, index) => {
      const generatedId = `${comment.id}-comment-image-${index}`;

      if (typeof imageItem === "string") {
        normalizedImages.push({
          id: generatedId,
          src: imageItem,
          name: `Imagen ${index + 1}`,
          removedByModerator: false,
        });

        return;
      }

      if (imageItem?.removedByModerator) {
        normalizedImages.push({
          id: imageItem.id || generatedId,
          src: "",
          name: imageItem.name || `Imagen ${index + 1}`,
          removedByModerator: true,
        });

        return;
      }

      const imageSrc = getImageSrc(imageItem);

      if (imageSrc) {
        normalizedImages.push({
          id: imageItem.id || generatedId,
          src: imageSrc,
          name:
            imageItem.name ||
            imageItem.imageName ||
            imageItem.filename ||
            `Imagen ${index + 1}`,
          removedByModerator: false,
        });
      }
    });
  }

  return normalizedImages;
}

function getActiveImageCount(images) {
  return images.filter(
    (imageItem) => !imageItem.removedByModerator && imageItem.src
  ).length;
}

function getPostAuthor(post) {
  if (post?.username) return post.username;
  if (post?.author) return post.author;
  return "@usuario";
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: `comment-image-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`,
        src: reader.result,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        removedByModerator: false,
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ComunidadPage() {
  const commentImageInputRef = useRef(null);
  const editCommentImageInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [searchText, setSearchText] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingImagesCommentId, setEditingImagesCommentId] = useState(null);
  const [editingCommentImages, setEditingCommentImages] = useState([]);
  const [menuOpenPostId, setMenuOpenPostId] = useState(null);
  const [imageViewer, setImageViewer] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const savedUser = getCurrentUser();
    setCurrentUser(savedUser);

    const savedPosts = safeParseJSON(
      localStorage.getItem(COMMUNITY_POSTS_STORAGE_KEY),
      INITIAL_POSTS
    );

    setPosts(Array.isArray(savedPosts) ? savedPosts : INITIAL_POSTS);
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;

    localStorage.setItem(COMMUNITY_POSTS_STORAGE_KEY, JSON.stringify(posts));
  }, [posts, dataLoaded]);

  const filteredPosts = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();

    return posts
      .filter((post) => {
        const searchable = `${getPostAuthor(post)} ${post.title || ""} ${
          post.content || ""
        }`.toLowerCase();

        return searchable.includes(normalized);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts, searchText]);

  const selectedPost =
    posts.find((post) => post.id === selectedPostId) || null;

  function canManagePost(post) {
    if (!currentUser || !post) return false;

    const isAdmin = isAdminUser(currentUser);

    if (isAdmin) return true;

    const isOwnerById = post.userId && post.userId === currentUser.id;
    const isOwnerByEmail =
      post.userEmail && post.userEmail === currentUser.email;

    return Boolean(isOwnerById || isOwnerByEmail);
  }

  function canManageComment(comment) {
    if (!currentUser || !comment) return false;

    const isAdmin = isAdminUser(currentUser);

    if (isAdmin) return true;

    const isOwnerById = comment.userId && comment.userId === currentUser.id;
    const isOwnerByEmail =
      comment.userEmail && comment.userEmail === currentUser.email;

    return Boolean(isOwnerById || isOwnerByEmail);
  }

  function canEditComment(comment) {
    if (!currentUser || !comment) return false;

    const isOwnerById = comment.userId && comment.userId === currentUser.id;
    const isOwnerByEmail =
      comment.userEmail && comment.userEmail === currentUser.email;

    return Boolean(isOwnerById || isOwnerByEmail);
  }

  function canModerateImages() {
    return isAdminUser(currentUser);
  }

  function openImageViewer(image, imageName) {
    setImageViewer({
      image,
      imageName: imageName || "Imagen",
    });
  }

  function openPost(postId) {
    setSelectedPostId(postId);
    setMenuOpenPostId(null);
    setEditingCommentId(null);
    setEditingCommentText("");
    setEditingImagesCommentId(null);
    setEditingCommentImages([]);
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

  function openCommentImagePicker() {
    if (commentImages.length >= MAX_COMMENT_IMAGES) {
      alert(`Podés adjuntar hasta ${MAX_COMMENT_IMAGES} imágenes por comentario.`);
      return;
    }

    commentImageInputRef.current?.click();
  }

  async function handleCommentImagesChange(event) {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(isImageFile);

    if (files.length === 0) {
      event.target.value = "";
      return;
    }

    if (imageFiles.length === 0) {
      alert("Seleccioná un archivo de imagen válido.");
      event.target.value = "";
      return;
    }

    const availableSlots = MAX_COMMENT_IMAGES - commentImages.length;

    if (availableSlots <= 0) {
      alert(`Podés adjuntar hasta ${MAX_COMMENT_IMAGES} imágenes por comentario.`);
      event.target.value = "";
      return;
    }

    const filesToRead = imageFiles.slice(0, availableSlots);

    if (imageFiles.length > availableSlots) {
      alert(
        `Solo se agregaron ${availableSlots} imagen/es. El máximo es ${MAX_COMMENT_IMAGES}.`
      );
    }

    const loadedImages = await Promise.all(filesToRead.map(readImageFile));

    setCommentImages((prevImages) => [...prevImages, ...loadedImages]);
    event.target.value = "";
  }

  function removePendingCommentImage(imageId) {
    setCommentImages((prevImages) =>
      prevImages.filter((imageItem) => imageItem.id !== imageId)
    );
  }

  function addComment() {
    if (!selectedPostId) return;

    if (!currentUser) {
      alert("Tenés que iniciar sesión para comentar.");
      return;
    }

    if (!commentText.trim() && commentImages.length === 0) {
      alert("Escribí un comentario o adjuntá una imagen.");
      return;
    }

    const newComment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      author: getPublicUsername(currentUser),
      displayName: currentUser.name,
      text: commentText.trim(),
      images: commentImages,
      createdAt: new Date().toISOString(),
      updatedAt: "",
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
    setCommentImages([]);
  }

  function startEditComment(comment) {
    if (!canEditComment(comment)) {
      alert("Solo podés editar tus propios comentarios.");
      return;
    }

    setEditingImagesCommentId(null);
    setEditingCommentImages([]);
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text || "");
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditingCommentText("");
  }

  function saveEditedComment(postId, commentId) {
    const post = posts.find((postItem) => postItem.id === postId);

    const comment = post?.comments?.find(
      (commentItem) => commentItem.id === commentId
    );

    if (!canEditComment(comment)) {
      alert("Solo podés editar tus propios comentarios.");
      return;
    }

    if (!editingCommentText.trim()) {
      alert("El comentario no puede quedar vacío.");
      return;
    }

    setPosts((prevPosts) =>
      prevPosts.map((postItem) =>
        postItem.id === postId
          ? {
              ...postItem,
              comments: (postItem.comments || []).map((commentItem) =>
                commentItem.id === commentId
                  ? {
                      ...commentItem,
                      text: editingCommentText.trim(),
                      updatedAt: new Date().toISOString(),
                    }
                  : commentItem
              ),
            }
          : postItem
      )
    );

    cancelEditComment();
  }

  function startEditCommentImages(comment) {
    if (!canEditComment(comment)) {
      alert("Solo podés editar imágenes de tus propios comentarios.");
      return;
    }

    setEditingCommentId(null);
    setEditingCommentText("");
    setEditingImagesCommentId(comment.id);
    setEditingCommentImages(getCommentImages(comment));
  }

  function cancelEditCommentImages() {
    setEditingImagesCommentId(null);
    setEditingCommentImages([]);
  }

  function openEditCommentImagePicker() {
    const activeImageCount = getActiveImageCount(editingCommentImages);

    if (activeImageCount >= MAX_COMMENT_IMAGES) {
      alert(`Podés tener hasta ${MAX_COMMENT_IMAGES} imágenes por comentario.`);
      return;
    }

    editCommentImageInputRef.current?.click();
  }

  async function handleEditCommentImagesChange(event) {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(isImageFile);

    if (files.length === 0) {
      event.target.value = "";
      return;
    }

    if (imageFiles.length === 0) {
      alert("Seleccioná un archivo de imagen válido.");
      event.target.value = "";
      return;
    }

    const activeImageCount = getActiveImageCount(editingCommentImages);
    const availableSlots = MAX_COMMENT_IMAGES - activeImageCount;

    if (availableSlots <= 0) {
      alert(`Podés tener hasta ${MAX_COMMENT_IMAGES} imágenes por comentario.`);
      event.target.value = "";
      return;
    }

    const filesToRead = imageFiles.slice(0, availableSlots);

    if (imageFiles.length > availableSlots) {
      alert(
        `Solo se agregaron ${availableSlots} imagen/es. El máximo es ${MAX_COMMENT_IMAGES}.`
      );
    }

    const loadedImages = await Promise.all(filesToRead.map(readImageFile));

    setEditingCommentImages((prevImages) => [
      ...prevImages,
      ...loadedImages,
    ]);

    event.target.value = "";
  }

  function removeEditingCommentImage(imageId) {
    setEditingCommentImages((prevImages) =>
      prevImages.filter((imageItem) => {
        if (imageItem.removedByModerator) return true;

        return imageItem.id !== imageId;
      })
    );
  }

  function saveEditedCommentImages(postId, commentId) {
    const post = posts.find((postItem) => postItem.id === postId);

    const comment = post?.comments?.find(
      (commentItem) => commentItem.id === commentId
    );

    if (!canEditComment(comment)) {
      alert("Solo podés editar imágenes de tus propios comentarios.");
      return;
    }

    const activeImageCount = getActiveImageCount(editingCommentImages);
    const commentTextValue = comment?.text?.trim() || "";

    if (!commentTextValue && activeImageCount === 0) {
      alert(
        "El comentario no puede quedar vacío. Agregá texto o al menos una imagen."
      );
      return;
    }

    setPosts((prevPosts) =>
      prevPosts.map((postItem) =>
        postItem.id === postId
          ? {
              ...postItem,
              comments: (postItem.comments || []).map((commentItem) =>
                commentItem.id === commentId
                  ? {
                      ...commentItem,
                      images: editingCommentImages,
                      updatedAt: new Date().toISOString(),
                    }
                  : commentItem
              ),
            }
          : postItem
      )
    );

    cancelEditCommentImages();
  }

  function deleteComment(postId, commentId) {
    const post = posts.find((postItem) => postItem.id === postId);

    const comment = post?.comments?.find(
      (commentItem) => commentItem.id === commentId
    );

    if (!canManageComment(comment)) {
      alert(
        "Solo podés eliminar tus propios comentarios. El administrador puede moderar todos."
      );
      return;
    }

    const confirmed = confirm("¿Querés eliminar este comentario?");

    if (!confirmed) return;

    setPosts((prevPosts) =>
      prevPosts.map((postItem) =>
        postItem.id === postId
          ? {
              ...postItem,
              comments: (postItem.comments || []).filter(
                (commentItem) => commentItem.id !== commentId
              ),
            }
          : postItem
      )
    );

    if (editingCommentId === commentId) {
      cancelEditComment();
    }

    if (editingImagesCommentId === commentId) {
      cancelEditCommentImages();
    }
  }

  function markImageAsRemoved(imageItem, fallbackId) {
    return {
      ...imageItem,
      id: imageItem?.id || fallbackId,
      src: "",
      image: "",
      url: "",
      dataUrl: "",
      removedByModerator: true,
      removedAt: new Date().toISOString(),
      removedBy: currentUser?.id || "admin",
    };
  }

  function deletePostImage(postId, imageId) {
    if (!canModerateImages()) {
      alert("Solo el administrador puede eliminar imágenes.");
      return;
    }

    const confirmed = confirm(
      "¿Querés eliminar esta imagen de la charla? El texto de la charla se conservará."
    );

    if (!confirmed) return;

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        if (imageId === `${post.id}-legacy-image`) {
          return {
            ...post,
            image: "",
            imageName: "",
            imageRemovedByModerator: true,
          };
        }

        const updatedImages = Array.isArray(post.images)
          ? post.images.map((imageItem, index) => {
              const generatedId = `${post.id}-image-${index}`;

              if (typeof imageItem === "string") {
                if (generatedId !== imageId) return imageItem;

                return getRemovedImagePlaceholder(
                  generatedId,
                  `Imagen ${index + 1}`
                );
              }

              const itemId = imageItem?.id || generatedId;

              if (itemId !== imageId) return imageItem;

              return markImageAsRemoved(imageItem, generatedId);
            })
          : post.images;

        return {
          ...post,
          images: updatedImages,
        };
      })
    );
  }

  function deleteCommentImage(postId, commentId, imageId) {
    if (!canModerateImages()) {
      alert("Solo el administrador puede eliminar imágenes.");
      return;
    }

    const confirmed = confirm(
      "¿Querés eliminar esta imagen del comentario? El texto del comentario se conservará."
    );

    if (!confirmed) return;

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        return {
          ...post,
          comments: (post.comments || []).map((comment) => {
            if (comment.id !== commentId) return comment;

            const updatedImages = Array.isArray(comment.images)
              ? comment.images.map((imageItem, index) => {
                  const generatedId = `${comment.id}-comment-image-${index}`;

                  if (typeof imageItem === "string") {
                    if (generatedId !== imageId) return imageItem;

                    return getRemovedImagePlaceholder(
                      generatedId,
                      `Imagen ${index + 1}`
                    );
                  }

                  const itemId = imageItem?.id || generatedId;

                  if (itemId !== imageId) return imageItem;

                  return markImageAsRemoved(imageItem, generatedId);
                })
              : comment.images;

            return {
              ...comment,
              images: updatedImages,
            };
          }),
        };
      })
    );
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
    const postToDelete = posts.find((post) => post.id === postId);

    if (!canManagePost(postToDelete)) {
      alert(
        "Solo podés eliminar tus propias charlas. El administrador puede moderar todas."
      );
      return;
    }

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

        <section className="px-4 py-4 md:px-5 md:py-5">
          <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 items-start">
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

            <div className="space-y-4">
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
                          <p className="text-xl font-bold">
                            {getPostAuthor(post)}
                          </p>

                          <h2 className="mt-1 text-2xl font-bold leading-snug">
                            {post.title}
                          </h2>

                          <p className="mt-2 text-xl leading-relaxed text-[#f1f1f1]">
                            {post.content}
                          </p>

                          {getPostImages(post).length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-3">
                              {getPostImages(post).map((imageItem) => (
                                <div
                                  key={imageItem.id}
                                  className="relative h-48 w-48 overflow-hidden rounded-3xl bg-black/20 shadow-lg"
                                >
                                  {imageItem.removedByModerator ? (
                                    <div className="flex h-full w-full items-center justify-center bg-[#4a4a4d] px-3 text-center text-sm font-bold text-white">
                                      Imagen removida por moderación
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openImageViewer(
                                          imageItem.src,
                                          imageItem.name
                                        )
                                      }
                                      className="block h-full w-full hover:scale-105 transition"
                                      title="Ver imagen"
                                    >
                                      <img
                                        src={imageItem.src}
                                        alt={imageItem.name || post.title}
                                        className="h-full w-full object-cover"
                                      />
                                    </button>
                                  )}

                                  {canModerateImages() &&
                                    !imageItem.removedByModerator && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          deletePostImage(post.id, imageItem.id)
                                        }
                                        className="absolute right-2 top-2 rounded-full bg-[#b33a3a] px-3 py-1 text-xs font-bold text-white shadow-md hover:scale-105 transition"
                                      >
                                        Eliminar imagen
                                      </button>
                                    )}
                                </div>
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

                              {canManagePost(post) && (
                                <button
                                  onClick={() => deletePost(post.id)}
                                  className="block w-full rounded-xl px-3 py-2 text-left text-red-600 hover:bg-[#f2ebe3]"
                                >
                                  Eliminar
                                </button>
                              )}
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

      {selectedPost && (
        <Modal
          onClose={() => {
            setSelectedPostId(null);
            cancelEditComment();
            cancelEditCommentImages();
          }}
        >
          <div className="rounded-4xl bg-[#f4ede5] p-6 text-[#6b3f22] max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-bold">
              {getPostAuthor(selectedPost)}
            </h2>

            <h3 className="mt-2 text-3xl font-bold leading-snug">
              {selectedPost.title}
            </h3>

            <p className="mt-3 text-xl leading-relaxed text-[#4a3425]">
              {selectedPost.content}
            </p>

            {getPostImages(selectedPost).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {getPostImages(selectedPost).map((imageItem) => (
                  <div
                    key={imageItem.id}
                    className="relative h-52 w-52 overflow-hidden rounded-3xl bg-black/20 shadow-lg"
                  >
                    {imageItem.removedByModerator ? (
                      <div className="flex h-full w-full items-center justify-center bg-[#4a4a4d] px-3 text-center text-sm font-bold text-white">
                        Imagen removida por moderación
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openImageViewer(imageItem.src, imageItem.name)
                        }
                        className="block h-full w-full hover:scale-105 transition"
                        title="Ver imagen"
                      >
                        <img
                          src={imageItem.src}
                          alt={imageItem.name || selectedPost.title}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    )}

                    {canModerateImages() && !imageItem.removedByModerator && (
                      <button
                        type="button"
                        onClick={() =>
                          deletePostImage(selectedPost.id, imageItem.id)
                        }
                        className="absolute right-2 top-2 rounded-full bg-[#b33a3a] px-3 py-1 text-xs font-bold text-white shadow-md hover:scale-105 transition"
                      >
                        Eliminar imagen
                      </button>
                    )}
                  </div>
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
                  (selectedPost.comments || []).map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            {comment.author || "@usuario"}
                          </p>

                          <p className="text-sm text-[#7a6351]">
                            {formatDate(comment.createdAt)}
                            {comment.updatedAt && (
                              <span className="ml-2 font-bold text-[#5b9b55]">
                                editado
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          {canEditComment(comment) &&
                            editingCommentId !== comment.id &&
                            editingImagesCommentId !== comment.id && (
                              <button
                                type="button"
                                onClick={() => startEditComment(comment)}
                                className="rounded-full bg-[#e5f4df] px-3 py-1 text-sm font-bold text-[#3a7a36] shadow-sm hover:scale-105 transition"
                              >
                                Editar
                              </button>
                            )}

                          {canEditComment(comment) &&
                            editingImagesCommentId !== comment.id &&
                            editingCommentId !== comment.id && (
                              <button
                                type="button"
                                onClick={() => startEditCommentImages(comment)}
                                className="rounded-full bg-[#eef0ff] px-3 py-1 text-sm font-bold text-[#3b438f] shadow-sm hover:scale-105 transition"
                              >
                                Editar imágenes
                              </button>
                            )}

                          {canManageComment(comment) &&
                            editingCommentId !== comment.id &&
                            editingImagesCommentId !== comment.id && (
                              <button
                                type="button"
                                onClick={() =>
                                  deleteComment(selectedPost.id, comment.id)
                                }
                                className="rounded-full bg-[#f3d6d6] px-3 py-1 text-sm font-bold text-[#7a2e2e] shadow-sm hover:scale-105 transition"
                              >
                                Eliminar
                              </button>
                            )}
                        </div>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="mt-3">
                          <textarea
                            value={editingCommentText}
                            onChange={(event) =>
                              setEditingCommentText(event.target.value)
                            }
                            rows={3}
                            className="w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none resize-none"
                          />

                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                saveEditedComment(selectedPost.id, comment.id)
                              }
                              className="rounded-full bg-[#5b9b55] px-4 py-2 text-sm font-bold text-white shadow-sm hover:scale-105 transition"
                            >
                              Guardar edición
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditComment}
                              className="rounded-full bg-[#777777] px-4 py-2 text-sm font-bold text-white shadow-sm hover:scale-105 transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-lg text-[#4a3425]">
                          {comment.text}
                        </p>
                      )}

                      {editingImagesCommentId === comment.id ? (
                        <div className="mt-4 rounded-3xl bg-[#f7efe6] px-4 py-4 shadow-inner">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-bold text-[#6b3f22]">
                                Editar imágenes del comentario
                              </p>

                              <p className="text-sm text-[#7a6351]">
                                Podés tener hasta {MAX_COMMENT_IMAGES} imágenes.
                                Las imágenes removidas por moderación no se
                                pueden borrar desde tu cuenta.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={openEditCommentImagePicker}
                              className="rounded-full bg-[#5b9b55] px-4 py-2 text-sm font-bold text-white shadow-sm hover:scale-105 transition"
                            >
                              + Agregar imagen
                            </button>

                            <input
                              ref={editCommentImageInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleEditCommentImagesChange}
                              className="hidden"
                            />
                          </div>

                          {editingCommentImages.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {editingCommentImages.map((imageItem) => (
                                <div
                                  key={imageItem.id}
                                  className="relative h-32 w-32 overflow-hidden rounded-2xl bg-black/20 shadow-md"
                                >
                                  {imageItem.removedByModerator ? (
                                    <div className="flex h-full w-full items-center justify-center bg-[#4a4a4d] px-2 text-center text-xs font-bold text-white">
                                      Imagen removida por moderación
                                    </div>
                                  ) : (
                                    <>
                                      <img
                                        src={imageItem.src}
                                        alt={imageItem.name}
                                        className="h-full w-full object-cover"
                                      />

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeEditingCommentImage(
                                            imageItem.id
                                          )
                                        }
                                        className="absolute right-1 top-1 rounded-full bg-[#b33a3a] px-2 py-1 text-xs font-bold text-white shadow-md"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-[#7a6351]">
                              Este comentario no tiene imágenes.
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                saveEditedCommentImages(
                                  selectedPost.id,
                                  comment.id
                                )
                              }
                              className="rounded-full bg-[#5b9b55] px-4 py-2 text-sm font-bold text-white shadow-sm hover:scale-105 transition"
                            >
                              Guardar imágenes
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditCommentImages}
                              className="rounded-full bg-[#777777] px-4 py-2 text-sm font-bold text-white shadow-sm hover:scale-105 transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        getCommentImages(comment).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {getCommentImages(comment).map((imageItem) => (
                              <div
                                key={imageItem.id}
                                className="relative h-40 w-40 overflow-hidden rounded-3xl bg-black/20 shadow-md"
                              >
                                {imageItem.removedByModerator ? (
                                  <div className="flex h-full w-full items-center justify-center bg-[#4a4a4d] px-3 text-center text-xs font-bold text-white">
                                    Imagen removida por moderación
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openImageViewer(
                                        imageItem.src,
                                        imageItem.name
                                      )
                                    }
                                    className="block h-full w-full hover:scale-105 transition"
                                    title="Ver imagen"
                                  >
                                    <img
                                      src={imageItem.src}
                                      alt={
                                        imageItem.name ||
                                        "Imagen de comentario"
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  </button>
                                )}

                                {canModerateImages() &&
                                  !imageItem.removedByModerator && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteCommentImage(
                                          selectedPost.id,
                                          comment.id,
                                          imageItem.id
                                        )
                                      }
                                      className="absolute right-2 top-2 rounded-full bg-[#b33a3a] px-2 py-1 text-xs font-bold text-white shadow-md hover:scale-105 transition"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-lg">Todavía no hay comentarios.</p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <div className="relative rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 shadow-sm">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  rows={4}
                  className="w-full resize-none bg-transparent pr-14 pb-8 text-lg outline-none"
                  placeholder="Escribí un comentario..."
                />

                <input
                  ref={commentImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCommentImagesChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={openCommentImagePicker}
                  className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#f3ebe3] text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
                  title="Adjuntar imagen"
                  aria-label="Adjuntar imagen al comentario"
                >
                  📎
                </button>

                {commentImages.length > 0 && (
                  <div className="absolute bottom-2 right-2 flex h-5 w-5 translate-x-1 -translate-y-8 items-center justify-center rounded-full bg-[#5b9b55] text-xs font-bold text-white">
                    {commentImages.length}
                  </div>
                )}
              </div>

              {commentImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {commentImages.map((imageItem) => (
                    <div
                      key={imageItem.id}
                      className="relative h-28 w-28 overflow-hidden rounded-2xl bg-black/20 shadow-md"
                    >
                      <img
                        src={imageItem.src}
                        alt={imageItem.name}
                        className="h-full w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removePendingCommentImage(imageItem.id)}
                        className="absolute right-1 top-1 rounded-full bg-[#b33a3a] px-2 py-1 text-xs font-bold text-white shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

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