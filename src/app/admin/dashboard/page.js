"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getPublicUsername,
  getStoredUsers,
  getUserRoleByEmail,
  isAdminUser,
} from "../../authUtils";

const COMMUNITY_POSTS_STORAGE_KEY = "humusai-community-posts";
const ARTICLES_STORAGE_KEY = "humusai-scientific-articles";
const PARAM_RECORDS_STORAGE_KEY = "humusai-param-records";
const CUSTOM_PARAMETERS_STORAGE_KEY = "humusai-custom-parameters";
const LAB_EVENTS_STORAGE_KEY = "humusai-lab-events";
const CALENDAR_TASKS_STORAGE_KEY = "humusai-calendar-tasks";
const PLANNING_ROUTINES_STORAGE_KEY = "humusai-planning-routines";
const PLANNING_NOTES_STORAGE_KEY = "humusai-planning-notes";

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getStoredArray(key) {
  return safeParseJSON(localStorage.getItem(key), []);
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

function getPostAuthor(post) {
  if (post?.username) return post.username;
  if (post?.author) return post.author;
  return "@usuario";
}

function countPostImages(post) {
  if (Array.isArray(post.images)) {
    return post.images.length;
  }

  return post.image ? 1 : 0;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [paramRecords, setParamRecords] = useState([]);
  const [customParameters, setCustomParameters] = useState([]);
  const [labEvents, setLabEvents] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [planningRoutines, setPlanningRoutines] = useState([]);
  const [planningNotes, setPlanningNotes] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const savedUser = getCurrentUser();

    if (!savedUser) {
      router.replace("/login?redirect=/admin/dashboard");
      return;
    }

    if (!isAdminUser(savedUser)) {
      alert("Solo el administrador puede acceder al dashboard.");
      router.replace("/perfil");
      return;
    }

    setCurrentUser(savedUser);
    setUsers(getStoredUsers());
    setPosts(getStoredArray(COMMUNITY_POSTS_STORAGE_KEY));
    setArticles(getStoredArray(ARTICLES_STORAGE_KEY));
    setParamRecords(getStoredArray(PARAM_RECORDS_STORAGE_KEY));
    setCustomParameters(getStoredArray(CUSTOM_PARAMETERS_STORAGE_KEY));
    setLabEvents(getStoredArray(LAB_EVENTS_STORAGE_KEY));
    setCalendarTasks(getStoredArray(CALENDAR_TASKS_STORAGE_KEY));
    setPlanningRoutines(getStoredArray(PLANNING_ROUTINES_STORAGE_KEY));
    setPlanningNotes(getStoredArray(PLANNING_NOTES_STORAGE_KEY));
    setDataLoaded(true);
  }, [router]);

  const stats = useMemo(() => {
    const totalAdmins = users.filter(
      (user) => getStoredUserRole(user) === "admin"
    ).length;

    const totalRegularUsers = users.filter(
      (user) => getStoredUserRole(user) !== "admin"
    ).length;

    const totalComments = posts.reduce(
      (total, post) => total + (post.comments || []).length,
      0
    );

    const totalImages = posts.reduce(
      (total, post) => total + countPostImages(post),
      0
    );

    return {
      totalUsers: users.length,
      totalAdmins,
      totalRegularUsers,
      totalPosts: posts.length,
      totalComments,
      totalImages,
      totalArticles: articles.length,
      totalParamRecords: paramRecords.length,
      totalCustomParameters: customParameters.length,
      totalLabEvents: labEvents.length,
      totalCalendarTasks: calendarTasks.length,
      totalPlanningRoutines: planningRoutines.length,
      totalPlanningNotes: planningNotes.length,
    };
  }, [
    users,
    posts,
    articles,
    paramRecords,
    customParameters,
    labEvents,
    calendarTasks,
    planningRoutines,
    planningNotes,
  ]);

  const latestUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [users]);

  const latestPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [posts]);

  const latestArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => {
        const dateA = a.publishedAt || a.createdAt || 0;
        const dateB = b.publishedAt || b.createdAt || 0;

        return new Date(dateB) - new Date(dateA);
      })
      .slice(0, 5);
  }, [articles]);

  if (!dataLoaded || !currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3ebe3] humus-font-text text-2xl text-[#6b3f22]">
        Cargando dashboard administrador...
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
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="humus-font-brand text-5xl text-[#6b3f22]">
                Dashboard admin
              </h1>

              <p className="mt-2 text-xl text-[#4a3425]">
                Resumen general del prototipo HumusAI.
              </p>

              <p className="mt-1 text-base text-[#6b3f22]">
                Sesión activa:{" "}
                <strong>{getPublicUsername(currentUser)}</strong>
              </p>
            </div>

            <div className="rounded-3xl bg-[#fff3c4] px-5 py-4 text-[#8a5a00] shadow-md">
              <p className="text-lg font-bold">Modo administrador</p>
              <p className="text-sm">
                Datos cargados desde localStorage del navegador.
              </p>
            </div>
          </div>

          <section className="mt-7">
            <h2 className="text-3xl font-bold">Estadísticas generales</h2>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Usuarios registrados" value={stats.totalUsers} />
              <StatCard title="Administradores" value={stats.totalAdmins} />
              <StatCard title="Usuarios comunes" value={stats.totalRegularUsers} />
              <StatCard title="Charlas publicadas" value={stats.totalPosts} />
              <StatCard title="Comentarios" value={stats.totalComments} />
              <StatCard title="Imágenes en comunidad" value={stats.totalImages} />
              <StatCard title="Artículos científicos" value={stats.totalArticles} />
              <StatCard title="Registros de parámetros" value={stats.totalParamRecords} />
              <StatCard title="Parámetros personalizados" value={stats.totalCustomParameters} />
              <StatCard title="Eventos de laboratorio" value={stats.totalLabEvents} />
              <StatCard title="Tareas calendario" value={stats.totalCalendarTasks} />
              <StatCard title="Rutinas planificación" value={stats.totalPlanningRoutines} />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-3xl font-bold">Accesos rápidos</h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <QuickLinkCard
                href="/admin"
                title="Panel de usuarios"
                description="Ver usuarios, cambiar roles y eliminar cuentas de prueba."
              />

              <QuickLinkCard
                href="/comunidad/articulos"
                title="Artículos científicos"
                description="Agregar, editar o eliminar papers visibles para la comunidad."
              />

              <QuickLinkCard
                href="/comunidad"
                title="Comunidad"
                description="Revisar charlas, comentarios e imágenes publicadas."
              />

              <QuickLinkCard
                href="/comunidad/nueva"
                title="Mis charlas / nueva"
                description="Crear publicaciones o revisar las charlas propias."
              />

              <QuickLinkCard
                href="/laboratorio"
                title="Laboratorio"
                description="Entrar al módulo de seguimiento del vermicompostador."
              />

              <QuickLinkCard
                href="/laboratorio/parametros"
                title="Parámetros"
                description="Revisar registros de temperatura, humedad, pH y más."
              />

              <QuickLinkCard
                href="/laboratorio/calendario"
                title="Calendario"
                description="Ver tareas, eventos y recordatorios."
              />

              <QuickLinkCard
                href="/laboratorio/planificacion"
                title="Planificación"
                description="Gestionar rutinas, notas y acciones programadas."
              />
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-5">
            <MiniList title="Últimos usuarios">
              {latestUsers.length > 0 ? (
                latestUsers.map((user) => (
                  <div
                    key={user.id || user.email}
                    className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-lg font-bold">{user.name}</p>
                    <p className="text-base font-bold text-[#5b9b55]">
                      {getPublicUsername(user)}
                    </p>
                    <p className="text-sm text-[#6b3f22]">{user.email}</p>
                    <p className="mt-1 text-sm text-[#7a6351]">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyMiniList text="Todavía no hay usuarios registrados." />
              )}
            </MiniList>

            <MiniList title="Últimas charlas">
              {latestPosts.length > 0 ? (
                latestPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-base font-bold text-[#5b9b55]">
                      {getPostAuthor(post)}
                    </p>
                    <p className="text-lg font-bold">{post.title}</p>
                    <p className="text-sm text-[#4a3425]">
                      {post.content}
                    </p>
                    <p className="mt-1 text-sm text-[#7a6351]">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyMiniList text="Todavía no hay charlas publicadas." />
              )}
            </MiniList>

            <MiniList title="Últimos artículos">
              {latestArticles.length > 0 ? (
                latestArticles.map((article) => (
                  <div
                    key={article.id}
                    className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-lg font-bold">{article.title}</p>
                    <p className="text-sm text-[#4a3425]">
                      {article.authors}
                    </p>
                    <p className="mt-1 text-sm text-[#7a6351]">
                      {article.publishedAt
                        ? formatDate(article.publishedAt)
                        : formatDate(article.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyMiniList text="Todavía no hay artículos cargados." />
              )}
            </MiniList>
          </section>

          <section className="mt-6 rounded-3xl bg-[#fff7df] px-4 py-4 text-[#6b3f22] shadow-md">
            <h2 className="text-xl font-bold">Nota de prototipo</h2>

            <p className="mt-1 text-base">
              Este dashboard resume datos locales del navegador. Cuando HumusAI
              use base de datos real, estas métricas podrán calcularse de forma
              centralizada y segura.
            </p>
          </section>
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white px-5 py-4 shadow-md">
      <p className="text-4xl font-bold text-[#5b9b55]">{value}</p>
      <p className="mt-1 text-lg font-bold text-[#6b3f22]">{title}</p>
    </div>
  );
}

function QuickLinkCard({ href, title, description }) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-[#303033] px-5 py-5 text-white shadow-lg hover:scale-105 transition"
    >
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-2 text-base text-[#e8e8e8]">{description}</p>
    </Link>
  );
}

function MiniList({ title, children }) {
  return (
    <section className="rounded-3xl bg-[#f7efe6] px-4 py-4 shadow-md">
      <h2 className="text-2xl font-bold text-[#6b3f22]">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function EmptyMiniList({ text }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 text-[#6b3f22] shadow-sm">
      {text}
    </div>
  );
}