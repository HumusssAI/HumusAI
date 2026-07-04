"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getInitials,
  getPublicUsername,
  getStoredUsers,
  getUserRoleByEmail,
  isAdminUser,
  normalizeEmail,
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

function formatDate(dateTime) {
  if (!dateTime) return "Sin fecha";

  const date = new Date(dateTime);

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStoredUserRole(user) {
  return user.role || getUserRoleByEmail(user.email);
}

function isSameUser(userA, userB) {
  if (!userA || !userB) return false;

  const sameId = userA.id && userB.id && userA.id === userB.id;
  const sameEmail =
    userA.email &&
    userB.email &&
    normalizeEmail(userA.email) === normalizeEmail(userB.email);

  return Boolean(sameId || sameEmail);
}

function itemBelongsToUser(item, user) {
  if (!item || !user) return false;

  const sameId = item.userId && item.userId === user.id;
  const sameEmail =
    item.userEmail &&
    user.email &&
    normalizeEmail(item.userEmail) === normalizeEmail(user.email);

  return Boolean(sameId || sameEmail);
}

export default function AdminPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const savedUser = getCurrentUser();

    if (!savedUser) {
      router.replace("/login?redirect=/admin");
      return;
    }

    if (!isAdminUser(savedUser)) {
      alert("Solo el administrador puede acceder al panel de usuarios.");
      router.replace("/perfil");
      return;
    }

    const savedUsers = getStoredUsers();

    setCurrentUser(savedUser);
    setUsers(Array.isArray(savedUsers) ? savedUsers : []);
    setDataLoaded(true);
  }, [router]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return users
      .filter((user) => {
        const searchableText = `${user.name || ""} ${user.username || ""} ${
          user.email || ""
        } ${getStoredUserRole(user)}`.toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const roleA = getStoredUserRole(a);
        const roleB = getStoredUserRole(b);

        if (roleA !== roleB) {
          return roleA === "admin" ? -1 : 1;
        }

        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [users, searchText]);

  const totalAdmins = users.filter(
    (user) => getStoredUserRole(user) === "admin"
  ).length;

  const totalRegularUsers = users.filter(
    (user) => getStoredUserRole(user) !== "admin"
  ).length;

  function saveUsersState(updatedUsers) {
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
  }

  function changeUserRole(targetUser, newRole) {
    if (!currentUser) return;

    if (isSameUser(targetUser, currentUser)) {
      alert("No podés cambiar tu propio rol desde este panel.");
      return;
    }

    const actionText =
      newRole === "admin"
        ? "convertir este usuario en administrador"
        : "volver este usuario a usuario general";

    const confirmed = confirm(`¿Querés ${actionText}?`);

    if (!confirmed) return;

    const updatedUsers = users.map((user) =>
      isSameUser(user, targetUser)
        ? {
            ...user,
            role: newRole,
            updatedAt: new Date().toISOString(),
          }
        : user
    );

    saveUsersState(updatedUsers);
  }

  function removeUserCommunityContent(targetUser) {
    const savedPosts = safeParseJSON(
      localStorage.getItem(COMMUNITY_POSTS_STORAGE_KEY),
      []
    );

    if (!Array.isArray(savedPosts)) return;

    const updatedPosts = savedPosts
      .filter((post) => !itemBelongsToUser(post, targetUser))
      .map((post) => ({
        ...post,
        comments: (post.comments || []).filter(
          (comment) => !itemBelongsToUser(comment, targetUser)
        ),
      }));

    localStorage.setItem(
      COMMUNITY_POSTS_STORAGE_KEY,
      JSON.stringify(updatedPosts)
    );
  }

  function deleteUser(targetUser) {
    if (!currentUser) return;

    if (isSameUser(targetUser, currentUser)) {
      alert("No podés eliminar tu propia cuenta desde el panel admin.");
      return;
    }

    const confirmed = confirm(
      `¿Querés eliminar a ${targetUser.name || targetUser.email}? También se eliminarán sus charlas y comentarios.`
    );

    if (!confirmed) return;

    const updatedUsers = users.filter((user) => !isSameUser(user, targetUser));

    saveUsersState(updatedUsers);
    removeUserCommunityContent(targetUser);
  }

  if (!dataLoaded || !currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3ebe3] humus-font-text text-2xl text-[#6b3f22]">
        Cargando panel administrador...
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
        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/perfil"
            className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition"
          >
            Volver al perfil
          </Link>

          <img
            src="/icons/logohumusai.png"
            alt="Logo HumusAI"
            className="h-24 md:h-28 w-auto object-contain"
          />

          <Link
            href="/"
            className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition"
          >
            Inicio
          </Link>
        </header>

        <section className="mx-auto mt-8 max-w-7xl rounded-4xl bg-[#f3ebe3] px-5 py-6 shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="humus-font-brand text-5xl text-[#6b3f22]">
                Panel administrador
              </h1>

              <p className="mt-2 text-xl text-[#4a3425]">
                Gestión local de usuarios registrados en HumusAI.
              </p>

              <p className="mt-1 text-base text-[#6b3f22]">
                Estás administrando como{" "}
                <strong>{getPublicUsername(currentUser)}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-md">
                <p className="text-3xl font-bold">{users.length}</p>
                <p className="text-lg">Usuarios</p>
              </div>

              <div className="rounded-2xl bg-[#fff3c4] px-5 py-4 text-center shadow-md">
                <p className="text-3xl font-bold text-[#8a5a00]">
                  {totalAdmins}
                </p>
                <p className="text-lg text-[#8a5a00]">Admins</p>
              </div>

              <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-md">
                <p className="text-3xl font-bold">{totalRegularUsers}</p>
                <p className="text-lg">Usuarios comunes</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border-2 border-[#8f6d4e] bg-white px-4 py-3 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-4xl text-[#6b3f22]">⌕</span>

              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Buscar por nombre, @usuario, email o rol..."
                className="w-full bg-transparent text-2xl text-black outline-none placeholder:text-[#6b6b6b]"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[1.7rem] bg-[#303033] px-5 py-5 text-white shadow-xl">
            <div className="grid min-w-1000px grid-cols-[1.3fr_1fr_1.2fr_0.7fr_0.9fr_1.2fr] gap-4 border-b border-white/30 pb-3 text-lg font-bold">
              <p>Usuario</p>
              <p>@usuario</p>
              <p>Email</p>
              <p>Rol</p>
              <p>Registro</p>
              <p>Acciones</p>
            </div>

            <div className="min-w-1000px divide-y divide-white/20">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const userRole = getStoredUserRole(user);
                  const isCurrentAdminUser = isSameUser(user, currentUser);

                  return (
                    <div
                      key={user.id || user.email}
                      className="grid grid-cols-[1.3fr_1fr_1.2fr_0.7fr_0.9fr_1.2fr] gap-4 py-4 text-base"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold border-2 ${
                            userRole === "admin"
                              ? "border-[#d4a017] text-[#8a5a00]"
                              : "border-[#5f9b5f] text-[#6b3f22]"
                          }`}
                        >
                          {getInitials(user)}
                        </div>

                        <div>
                          <p className="font-bold">{user.name}</p>

                          {isCurrentAdminUser && (
                            <p className="text-sm text-[#d8d8d8]">
                              Tu cuenta
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="font-bold text-[#a7df9c]">
                        {getPublicUsername(user)}
                      </p>

                      <p className="break-all">{user.email}</p>

                      <div>
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${
                            userRole === "admin"
                              ? "bg-[#fff3c4] text-[#8a5a00]"
                              : "bg-white text-[#5b9b55]"
                          }`}
                        >
                          {userRole === "admin" ? "Admin" : "Usuario"}
                        </span>
                      </div>

                      <p>{formatDate(user.createdAt)}</p>

                      <div className="flex flex-wrap gap-2">
                        {userRole === "admin" ? (
                          <button
                            type="button"
                            onClick={() => changeUserRole(user, "user")}
                            disabled={isCurrentAdminUser}
                            className={`rounded-full px-3 py-2 text-sm font-bold shadow-md transition ${
                              isCurrentAdminUser
                                ? "cursor-not-allowed bg-[#777777] text-white opacity-60"
                                : "bg-white text-[#6b3f22] hover:scale-105"
                            }`}
                          >
                            Hacer usuario
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => changeUserRole(user, "admin")}
                            className="rounded-full bg-[#fff3c4] px-3 py-2 text-sm font-bold text-[#8a5a00] shadow-md hover:scale-105 transition"
                          >
                            Hacer admin
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteUser(user)}
                          disabled={isCurrentAdminUser}
                          className={`rounded-full px-3 py-2 text-sm font-bold shadow-md transition ${
                            isCurrentAdminUser
                              ? "cursor-not-allowed bg-[#777777] text-white opacity-60"
                              : "bg-[#b33a3a] text-white hover:scale-105"
                          }`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xl">
                  No se encontraron usuarios.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-[#fff7df] px-4 py-4 text-[#6b3f22] shadow-md">
            <h2 className="text-xl font-bold">Nota de prototipo</h2>

            <p className="mt-1 text-base">
              Este panel funciona con localStorage. Más adelante, con base de
              datos real, estos permisos deberían validarse desde el servidor
              para que sean seguros.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}