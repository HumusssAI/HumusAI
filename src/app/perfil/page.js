"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getInitials,
  getPublicUsername,
  getStoredUsers,
  isAdminUser,
  logoutCurrentUser,
  normalizeUsername,
  saveCurrentUser,
  saveStoredUsers,
} from "../authUtils";

const COMMUNITY_POSTS_STORAGE_KEY = "humusai-community-posts";

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function cleanUsername(username) {
  return normalizeUsername(username).replace(/^@+/, "");
}

function getEmptyPasswordFields() {
  return {
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  };
}

function isSameUser(item, currentUser) {
  if (!item || !currentUser) return false;

  const sameId = item.userId && item.userId === currentUser.id;
  const sameEmail = item.userEmail && item.userEmail === currentUser.email;

  return Boolean(sameId || sameEmail);
}

export default function PerfilPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    ...getEmptyPasswordFields(),
  });

  useEffect(() => {
    const savedUser = getCurrentUser();

    if (!savedUser) {
      router.replace("/login?redirect=/perfil");
      return;
    }

    setCurrentUser(savedUser);
    setProfileForm({
      name: savedUser.name || "",
      username: savedUser.username || "",
      ...getEmptyPasswordFields(),
    });
    setDataLoaded(true);
  }, [router]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setProfileForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));

    setSuccessMessage("");
  }

  function startEditing() {
    if (!currentUser) return;

    setProfileForm({
      name: currentUser.name || "",
      username: currentUser.username || "",
      ...getEmptyPasswordFields(),
    });

    setSuccessMessage("");
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!currentUser) return;

    setProfileForm({
      name: currentUser.name || "",
      username: currentUser.username || "",
      ...getEmptyPasswordFields(),
    });

    setSuccessMessage("");
    setIsEditing(false);
  }

  function updateCommunityUserData(updatedUser) {
    const savedPosts = safeParseJSON(
      localStorage.getItem(COMMUNITY_POSTS_STORAGE_KEY),
      []
    );

    if (!Array.isArray(savedPosts)) return;

    const updatedPublicUsername = getPublicUsername(updatedUser);

    const updatedPosts = savedPosts.map((post) => {
      const postBelongsToUser = isSameUser(post, currentUser);

      const updatedComments = (post.comments || []).map((comment) => {
        const commentBelongsToUser = isSameUser(comment, currentUser);

        if (!commentBelongsToUser) return comment;

        return {
          ...comment,
          author: updatedPublicUsername,
          displayName: updatedUser.name,
        };
      });

      if (!postBelongsToUser) {
        return {
          ...post,
          comments: updatedComments,
        };
      }

      return {
        ...post,
        username: updatedPublicUsername,
        displayName: updatedUser.name,
        comments: updatedComments,
      };
    });

    localStorage.setItem(
      COMMUNITY_POSTS_STORAGE_KEY,
      JSON.stringify(updatedPosts)
    );
  }

  function saveProfile(event) {
    event.preventDefault();

    if (!currentUser) return;

    const cleanedName = profileForm.name.trim();
    const cleanedUsername = cleanUsername(profileForm.username);

    if (!cleanedName) {
      alert("Ingresá tu nombre y apellido.");
      return;
    }

    if (!cleanedUsername) {
      alert("Ingresá un nombre de usuario.");
      return;
    }

    if (cleanedUsername.length < 3) {
      alert("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }

    if (!/^[a-z0-9._-]+$/.test(cleanedUsername)) {
      alert(
        "El nombre de usuario solo puede tener letras, números, punto, guion bajo o guion medio. No puede tener espacios."
      );
      return;
    }

    const users = getStoredUsers();

    const storedUser = users.find(
      (user) => user.id === currentUser.id || user.email === currentUser.email
    );

    if (!storedUser) {
      alert("No se encontró tu usuario guardado. Cerrá sesión e iniciá de nuevo.");
      return;
    }

    const usernameAlreadyExists = users.some((user) => {
      const isCurrentUser =
        user.id === currentUser.id || user.email === currentUser.email;

      if (isCurrentUser) return false;

      return cleanUsername(user.username) === cleanedUsername;
    });

    if (usernameAlreadyExists) {
      alert("Ese nombre de usuario ya está en uso. Elegí otro.");
      return;
    }

    const wantsPasswordChange =
      profileForm.currentPassword.trim() ||
      profileForm.newPassword.trim() ||
      profileForm.confirmNewPassword.trim();

    let updatedPassword = storedUser.password;

    if (wantsPasswordChange) {
      if (!profileForm.currentPassword.trim()) {
        alert("Ingresá tu contraseña actual para cambiarla.");
        return;
      }

      if (profileForm.currentPassword !== storedUser.password) {
        alert("La contraseña actual no es correcta.");
        return;
      }

      if (profileForm.newPassword.length < 4) {
        alert("La nueva contraseña debe tener al menos 4 caracteres.");
        return;
      }

      if (profileForm.newPassword !== profileForm.confirmNewPassword) {
        alert("La nueva contraseña y la confirmación no coinciden.");
        return;
      }

      updatedPassword = profileForm.newPassword;
    }

    const updatedStoredUser = {
      ...storedUser,
      name: cleanedName,
      username: cleanedUsername,
      password: updatedPassword,
      updatedAt: new Date().toISOString(),
    };

    const updatedUsers = users.map((user) =>
      user.id === currentUser.id || user.email === currentUser.email
        ? updatedStoredUser
        : user
    );

    saveStoredUsers(updatedUsers);

    const updatedSessionUser = saveCurrentUser(updatedStoredUser);

    updateCommunityUserData(updatedSessionUser);

    setCurrentUser(updatedSessionUser);
    setProfileForm({
      name: updatedSessionUser.name || "",
      username: updatedSessionUser.username || "",
      ...getEmptyPasswordFields(),
    });

    setIsEditing(false);
    setSuccessMessage("Perfil actualizado correctamente.");
  }

  function handleLogout() {
    logoutCurrentUser();
    router.push("/");
  }

  if (!dataLoaded || !currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3ebe3] humus-font-text text-2xl text-[#6b3f22]">
        Cargando perfil...
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden humus-font-text text-[#6b3f22]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/background/fondomadera.png')" }}
      />

      <div className="relative z-10 min-h-screen px-4 py-8">
        <header className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition"
          >
            Inicio
          </Link>

          <img
            src="/icons/logohumusai.png"
            alt="Logo HumusAI"
            className="h-24 md:h-28 w-auto object-contain"
          />

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition"
          >
            Cerrar sesión
          </button>
        </header>

        <section className="mx-auto mt-8 max-w-3xl rounded-4xl bg-[#f3ebe3] px-6 py-7 shadow-2xl">
          <div className="text-center">
            <div
              className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white text-4xl font-bold shadow-xl border-4 ${
                isAdminUser(currentUser)
                  ? "border-[#d4a017] text-[#8a5a00]"
                  : "border-[#5f9b5f] text-[#6b3f22]"
              }`}
            >
              {getInitials(currentUser)}
            </div>

            <h1 className="mt-4 humus-font-brand text-5xl text-[#6b3f22]">
              Mi perfil
            </h1>

            {!isEditing && (
              <>
                <p className="mt-2 text-2xl font-bold">{currentUser.name}</p>

                <div className="mt-2 inline-block rounded-full bg-white px-4 py-1 text-lg font-bold text-[#5f9b5f] shadow-sm border border-[#5f9b5f]">
                  {getPublicUsername(currentUser)}
                </div>

                <p className="mt-2 text-lg text-[#4a3425]">
                  {currentUser.email}
                </p>

                <div
                  className={`mt-3 inline-block rounded-full px-4 py-1 text-lg font-bold ${
                    isAdminUser(currentUser)
                      ? "bg-[#fff3c4] text-[#8a5a00]"
                      : "bg-white text-[#5f9b5f]"
                  }`}
                >
                  {isAdminUser(currentUser)
                    ? "Administrador"
                    : "Usuario general"}
                </div>
              </>
            )}

            {successMessage && (
              <p className="mt-4 rounded-2xl bg-[#e5f4df] px-4 py-3 text-lg font-bold text-[#3a7a36]">
                {successMessage}
              </p>
            )}
          </div>

          {!isEditing ? (
            <div className="mt-7 space-y-4">
              <button
                type="button"
                onClick={startEditing}
                className="w-full rounded-2xl bg-[#5b9b55] px-4 py-3 humus-font-brand text-3xl text-white shadow-lg hover:scale-105 transition"
              >
                Editar perfil
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/laboratorio"
                  className="rounded-2xl bg-white px-4 py-4 text-center text-xl font-bold shadow-md hover:scale-105 transition"
                >
                  Ir a Laboratorio
                </Link>

                <Link
                  href="/comunidad"
                  className="rounded-2xl bg-white px-4 py-4 text-center text-xl font-bold shadow-md hover:scale-105 transition"
                >
                  Ir a Comunidad
                </Link>

                {isAdminUser(currentUser) && (
                  <Link
                    href="/comunidad/articulos"
                    className="md:col-span-2 rounded-2xl bg-[#fff3c4] px-4 py-4 text-center text-xl font-bold text-[#8a5a00] shadow-md hover:scale-105 transition"
                  >
                    Administrar artículos científicos
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={saveProfile} className="mt-7 space-y-5">
              <div>
                <label className="text-lg font-bold">Nombre y apellido</label>

                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                  placeholder="Nombre y apellido"
                />
              </div>

              <div>
                <label className="text-lg font-bold">Nombre de usuario</label>

                <div className="mt-1 flex items-center rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3">
                  <span className="text-xl font-bold text-[#5f9b5f]">@</span>

                  <input
                    type="text"
                    name="username"
                    value={profileForm.username}
                    onChange={handleFormChange}
                    className="ml-1 w-full bg-transparent text-lg outline-none"
                    placeholder="usuario"
                  />
                </div>

                <p className="mt-2 text-sm text-[#6b3f22]">
                  Usá letras, números, punto, guion bajo o guion medio. Si lo
                  cambiás, también se actualizarán tus charlas y comentarios.
                </p>
              </div>

              <div className="rounded-3xl bg-white px-4 py-4 shadow-md">
                <h2 className="text-2xl font-bold text-[#6b3f22]">
                  Cambiar contraseña
                </h2>

                <p className="mt-1 text-sm text-[#6b3f22]">
                  Dejá estos campos vacíos si no querés cambiarla.
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-lg font-bold">
                      Contraseña actual
                    </label>

                    <input
                      type="password"
                      name="currentPassword"
                      value={profileForm.currentPassword}
                      onChange={handleFormChange}
                      className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                      placeholder="Contraseña actual"
                    />
                  </div>

                  <div>
                    <label className="text-lg font-bold">
                      Nueva contraseña
                    </label>

                    <input
                      type="password"
                      name="newPassword"
                      value={profileForm.newPassword}
                      onChange={handleFormChange}
                      className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                      placeholder="Nueva contraseña"
                    />
                  </div>

                  <div>
                    <label className="text-lg font-bold">
                      Confirmar nueva contraseña
                    </label>

                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={profileForm.confirmNewPassword}
                      onChange={handleFormChange}
                      className="mt-1 w-full rounded-2xl border-2 border-[#d7c4b5] bg-white px-4 py-3 text-lg outline-none"
                      placeholder="Repetir nueva contraseña"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-[#fff7df] px-4 py-4 text-[#6b3f22] shadow-md">
                <h3 className="text-xl font-bold">¿Olvidaste tu contraseña?</h3>

                <p className="mt-1 text-base">
                  Esta función conviene activarla más adelante, cuando HumusAI
                  tenga base de datos real y recuperación por email.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="w-full rounded-2xl bg-[#777777] px-4 py-3 humus-font-brand text-3xl text-white shadow-lg hover:scale-105 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#5b9b55] px-4 py-3 humus-font-brand text-3xl text-white shadow-lg hover:scale-105 transition"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}