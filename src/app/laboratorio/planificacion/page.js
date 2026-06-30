"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const DEFAULT_CATEGORIES = [
  {
    key: "control",
    label: "Control",
    color: "#2563eb",
    system: true,
  },
  {
    key: "alimentacion",
    label: "Alimentación",
    color: "#22c55e",
    system: true,
  },
  {
    key: "humedad",
    label: "Humedecer",
    color: "#38bdf8",
    system: true,
  },
  {
    key: "inoculo",
    label: "Inóculo",
    color: "#8b5a2b",
    system: true,
  },
  {
    key: "fondo",
    label: "Revisar fondo",
    color: "#f97316",
    system: true,
  },
  {
    key: "foto",
    label: "Foto",
    color: "#a855f7",
    system: true,
  },
  {
    key: "parametros",
    label: "Parámetros",
    color: "#14b8a6",
    system: true,
  },
  {
    key: "alerta",
    label: "Alerta",
    color: "#ef4444",
    system: true,
  },
  {
    key: "tarea",
    label: "Tarea",
    color: "#6b7280",
    system: true,
  },
];

const WEEK_DAYS = [
  { value: "1", label: "Lun" },
  { value: "2", label: "Mar" },
  { value: "3", label: "Mié" },
  { value: "4", label: "Jue" },
  { value: "5", label: "Vie" },
  { value: "6", label: "Sáb" },
  { value: "0", label: "Dom" },
];

const INITIAL_ROUTINES = [
  {
    id: "routine-alimentacion",
    title: "Alimentar compostera",
    categoryKey: "alimentacion",
    time: "16:00",
    weekDays: ["1", "4"],
    observation: "Agregar restos pequeños y cartón húmedo si hace falta.",
    active: true,
  },
  {
    id: "routine-humedad",
    title: "Controlar humedad",
    categoryKey: "humedad",
    time: "18:00",
    weekDays: ["2", "6"],
    observation: "Revisar si el sustrato está seco o demasiado húmedo.",
    active: true,
  },
  {
    id: "routine-parametros",
    title: "Medir parámetros",
    categoryKey: "parametros",
    time: "17:00",
    weekDays: ["0"],
    observation: "Registrar temperatura, humedad y pH si corresponde.",
    active: true,
  },
  {
    id: "routine-fondo",
    title: "Revisar fondo",
    categoryKey: "fondo",
    time: "17:30",
    weekDays: ["5"],
    observation: "Controlar compactación, aireación y posible lixiviado.",
    active: true,
  },
];

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function getTodayKey() {
  const today = new Date();

  return `${today.getFullYear()}-${padNumber(today.getMonth() + 1)}-${padNumber(
    today.getDate()
  )}`;
}

function getDateKeyFromDate(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate()
  )}`;
}

function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function formatDate(dateKey) {
  if (!dateKey) return "";

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function mergeCategories(savedCategories) {
  if (!Array.isArray(savedCategories) || savedCategories.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  const mergedSystemCategories = DEFAULT_CATEGORIES.map((defaultCategory) => {
    const savedCategory = savedCategories.find(
      (category) => category.key === defaultCategory.key
    );

    return savedCategory
      ? {
          ...defaultCategory,
          label: savedCategory.label || defaultCategory.label,
          color: savedCategory.color || defaultCategory.color,
          system: true,
        }
      : defaultCategory;
  });

  const customCategories = savedCategories.filter(
    (category) =>
      !DEFAULT_CATEGORIES.some(
        (defaultCategory) => defaultCategory.key === category.key
      )
  );

  return [...mergedSystemCategories, ...customCategories];
}

function getCategory(categories, categoryKey) {
  return (
    categories.find((category) => category.key === categoryKey) ||
    categories.find((category) => category.key === "tarea") ||
    DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1]
  );
}

function getEmptyRoutine() {
  return {
    id: "",
    title: "Alimentar compostera",
    categoryKey: "alimentacion",
    time: "16:00",
    weekDays: ["1", "4"],
    observation: "",
    active: true,
  };
}

function getWeekDaysText(weekDays) {
  if (!weekDays || weekDays.length === 0) return "Sin días definidos";

  return WEEK_DAYS.filter((day) => weekDays.includes(day.value))
    .map((day) => day.label)
    .join(", ");
}

export default function PlanificacionPage() {
  const [routines, setRoutines] = useState(INITIAL_ROUTINES);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [notes, setNotes] = useState("");
  const [routineForm, setRoutineForm] = useState(getEmptyRoutine());
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedRoutines = safeParseJSON(
      localStorage.getItem("humusai-planning-routines"),
      null
    );

    const savedCalendarTasks = safeParseJSON(
      localStorage.getItem("humusai-calendar-tasks"),
      []
    );

    const savedCategories = safeParseJSON(
      localStorage.getItem("humusai-calendar-categories"),
      DEFAULT_CATEGORIES
    );

    const savedNotes = localStorage.getItem("humusai-planning-notes");

    if (savedRoutines && Array.isArray(savedRoutines)) {
      setRoutines(savedRoutines);
    } else {
      setRoutines(INITIAL_ROUTINES);
    }

    setCalendarTasks(savedCalendarTasks);
    setCategories(mergeCategories(savedCategories));
    setNotes(savedNotes || "");
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;

    localStorage.setItem("humusai-planning-routines", JSON.stringify(routines));
  }, [routines, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;

    localStorage.setItem(
      "humusai-calendar-tasks",
      JSON.stringify(calendarTasks)
    );
  }, [calendarTasks, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;

    localStorage.setItem("humusai-planning-notes", notes);
  }, [notes, dataLoaded]);

  const activeRoutines = useMemo(() => {
    return routines.filter((routine) => routine.active);
  }, [routines]);

  const upcomingTasks = useMemo(() => {
    const todayKey = getTodayKey();

    return [...calendarTasks]
      .filter((task) => task.date >= todayKey)
      .sort((a, b) => {
        const dateA = `${a.date}T${a.time || "00:00"}`;
        const dateB = `${b.date}T${b.time || "00:00"}`;

        return new Date(dateA) - new Date(dateB);
      })
      .slice(0, 6);
  }, [calendarTasks]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setRoutineForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  function toggleWeekDay(dayValue) {
    setRoutineForm((prevForm) => {
      const alreadySelected = prevForm.weekDays.includes(dayValue);

      return {
        ...prevForm,
        weekDays: alreadySelected
          ? prevForm.weekDays.filter((value) => value !== dayValue)
          : [...prevForm.weekDays, dayValue],
      };
    });
  }

  function resetForm() {
    setRoutineForm(getEmptyRoutine());
    setEditingRoutineId(null);
  }

  function handleRoutineSubmit(event) {
    event.preventDefault();

    if (!routineForm.title.trim()) {
      alert("Ingresá un título para la rutina.");
      return;
    }

    if (routineForm.weekDays.length === 0) {
      alert("Elegí al menos un día de la semana.");
      return;
    }

    const routineToSave = {
      id: editingRoutineId || `routine-${Date.now()}`,
      title: routineForm.title.trim(),
      categoryKey: routineForm.categoryKey,
      time: routineForm.time,
      weekDays: routineForm.weekDays,
      observation: routineForm.observation.trim(),
      active: routineForm.active,
    };

    if (editingRoutineId) {
      setRoutines((prevRoutines) =>
        prevRoutines.map((routine) =>
          routine.id === editingRoutineId ? routineToSave : routine
        )
      );

      setMessage("Rutina actualizada.");
    } else {
      setRoutines((prevRoutines) => [...prevRoutines, routineToSave]);
      setMessage("Rutina creada.");
    }

    resetForm();
  }

  function editRoutine(routine) {
    setRoutineForm({
      id: routine.id,
      title: routine.title,
      categoryKey: routine.categoryKey,
      time: routine.time || "",
      weekDays: routine.weekDays || [],
      observation: routine.observation || "",
      active: routine.active,
    });

    setEditingRoutineId(routine.id);
    setMessage("");
  }

  function deleteRoutine(routineId) {
    const confirmed = confirm("¿Querés eliminar esta rutina?");

    if (!confirmed) return;

    setRoutines((prevRoutines) =>
      prevRoutines.filter((routine) => routine.id !== routineId)
    );

    if (editingRoutineId === routineId) {
      resetForm();
    }

    setMessage("Rutina eliminada.");
  }

  function toggleRoutineActive(routineId) {
    setRoutines((prevRoutines) =>
      prevRoutines.map((routine) =>
        routine.id === routineId
          ? {
              ...routine,
              active: !routine.active,
            }
          : routine
      )
    );
  }

  function generateTasksForRoutine(routine) {
    if (!routine.weekDays || routine.weekDays.length === 0) {
      alert("Esta rutina no tiene días asignados.");
      return;
    }

    const today = new Date();
    const tasksToCreate = [];

    for (let index = 0; index < 30; index++) {
      const currentDate = addDays(today, index);
      const weekDay = String(currentDate.getDay());

      if (!routine.weekDays.includes(weekDay)) continue;

      const dateKey = getDateKeyFromDate(currentDate);

      const taskAlreadyExists = calendarTasks.some(
        (task) =>
          task.planningRoutineId === routine.id &&
          task.date === dateKey &&
          task.title === routine.title
      );

      if (taskAlreadyExists) continue;

      tasksToCreate.push({
        id: `task-${Date.now()}-${routine.id}-${dateKey}`,
        title: routine.title,
        categoryKey: routine.categoryKey,
        date: dateKey,
        time: routine.time,
        observation: routine.observation,
        done: false,
        planningRoutineId: routine.id,
      });
    }

    if (tasksToCreate.length === 0) {
      setMessage("No se crearon tareas nuevas porque ya existían en Calendario.");
      return;
    }

    setCalendarTasks((prevTasks) => [...prevTasks, ...tasksToCreate]);

    setMessage(
      `Se crearon ${tasksToCreate.length} tareas en Calendario para los próximos 30 días.`
    );
  }

  function generateTasksForAllActiveRoutines() {
    if (activeRoutines.length === 0) {
      alert("No hay rutinas activas para generar tareas.");
      return;
    }

    const today = new Date();
    const tasksToCreate = [];

    activeRoutines.forEach((routine) => {
      for (let index = 0; index < 30; index++) {
        const currentDate = addDays(today, index);
        const weekDay = String(currentDate.getDay());

        if (!routine.weekDays.includes(weekDay)) continue;

        const dateKey = getDateKeyFromDate(currentDate);

        const taskAlreadyExists = calendarTasks.some(
          (task) =>
            task.planningRoutineId === routine.id &&
            task.date === dateKey &&
            task.title === routine.title
        );

        const alreadyQueued = tasksToCreate.some(
          (task) =>
            task.planningRoutineId === routine.id &&
            task.date === dateKey &&
            task.title === routine.title
        );

        if (taskAlreadyExists || alreadyQueued) continue;

        tasksToCreate.push({
          id: `task-${Date.now()}-${routine.id}-${dateKey}`,
          title: routine.title,
          categoryKey: routine.categoryKey,
          date: dateKey,
          time: routine.time,
          observation: routine.observation,
          done: false,
          planningRoutineId: routine.id,
        });
      }
    });

    if (tasksToCreate.length === 0) {
      setMessage("No se crearon tareas nuevas porque ya existían en Calendario.");
      return;
    }

    setCalendarTasks((prevTasks) => [...prevTasks, ...tasksToCreate]);

    setMessage(
      `Se crearon ${tasksToCreate.length} tareas en Calendario para los próximos 30 días.`
    );
  }

  return (
    <main className="min-h-screen bg-[#edf4ea] text-[#57351f] humus-font-text">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-28 bg-[#5f9b5f] shadow-md">
        <div className="relative h-full flex items-center justify-center px-6 md:px-12">
          <div className="absolute left-6 md:left-12 flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition"
            >
              Inicio
            </Link>

            <Link
              href="/laboratorio"
              className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition"
            >
              Lab
            </Link>

            <Link
              href="/laboratorio/calendario"
              className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition"
            >
              Calendario
            </Link>
          </div>

          <img
            src="/icons/logohumusai.png"
            alt="Logo HumusAI"
            className="h-24 w-auto object-contain"
          />
        </div>
      </header>

      <section className="pt-36 pb-10 px-4 md:px-8 relative">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: "url('/background/fondolab.png')" }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="mb-8 ml-4 md:ml-6">
            <h1 className="humus-font-brand text-5xl md:text-6xl text-[#6b3f22]">
              Planificación
            </h1>

            <p className="text-xl md:text-2xl text-[#57351f]">
              Armá rutinas de manejo y generá tareas futuras para el calendario.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_430px] gap-6">
            {/* Rutinas */}
            <section className="rounded-4xl bg-[#e8f0e7]/95 border-4 border-[#ceddc8] shadow-lg p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="humus-font-brand text-5xl text-[#6b3f22]">
                    Rutinas
                  </h2>

                  <p className="text-xl text-[#57351f]">
                    {activeRoutines.length} activas de {routines.length} rutinas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={generateTasksForAllActiveRoutines}
                  className="rounded-full bg-[#5f9b5f] px-6 py-3 humus-font-brand text-2xl text-white shadow-md hover:scale-105 transition"
                >
                  Generar tareas activas
                </button>
              </div>

              {message && (
                <div className="mb-5 rounded-3xl bg-white px-5 py-4 text-xl text-[#3a8d43] shadow-md">
                  {message}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {routines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    categories={categories}
                    onEdit={() => editRoutine(routine)}
                    onDelete={() => deleteRoutine(routine.id)}
                    onToggleActive={() => toggleRoutineActive(routine.id)}
                    onGenerateTasks={() => generateTasksForRoutine(routine)}
                  />
                ))}
              </div>
            </section>

            {/* Formulario */}
            <aside className="rounded-4xl bg-[#e8f0e7]/95 border-4 border-[#ceddc8] shadow-lg p-5 md:p-6 h-fit">
              <h2 className="humus-font-brand text-4xl text-[#6b3f22]">
                {editingRoutineId ? "Editar rutina" : "Nueva rutina"}
              </h2>

              <form onSubmit={handleRoutineSubmit} className="mt-5">
                <FormField label="Título">
                  <input
                    type="text"
                    name="title"
                    value={routineForm.title}
                    onChange={handleFormChange}
                    className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none bg-white"
                    placeholder="Ej: Alimentar compostera"
                  />
                </FormField>

                <FormField label="Categoría">
                  <select
                    name="categoryKey"
                    value={routineForm.categoryKey}
                    onChange={handleFormChange}
                    className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none bg-white"
                  >
                    {categories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label || "Sin nombre"}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Horario">
                  <input
                    type="time"
                    name="time"
                    value={routineForm.time}
                    onChange={handleFormChange}
                    className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none bg-white"
                  />
                </FormField>

                <FormField label="Días de la semana">
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const selected = routineForm.weekDays.includes(day.value);

                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleWeekDay(day.value)}
                          className={`rounded-full px-4 py-2 text-lg font-bold shadow-sm hover:scale-105 transition ${
                            selected
                              ? "bg-[#5f9b5f] text-white"
                              : "bg-white text-[#6b3f22]"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                <FormField label="Observación">
                  <textarea
                    name="observation"
                    value={routineForm.observation}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none resize-none bg-white"
                    placeholder="Ej: Agregar restos pequeños, revisar humedad y cubrir con cartón..."
                  />
                </FormField>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-[#5f9b5f] px-5 py-3 humus-font-brand text-2xl text-white shadow-md hover:scale-105 transition"
                  >
                    Guardar
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full bg-white px-5 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
                  >
                    Limpiar
                  </button>
                </div>
              </form>

              <div className="mt-8 rounded-4xl bg-white p-5 shadow-md">
                <h3 className="humus-font-brand text-3xl text-[#6b3f22]">
                  Próximas tareas
                </h3>

                <div className="mt-4 flex flex-col gap-3">
                  {upcomingTasks.length > 0 ? (
                    upcomingTasks.map((task) => {
                      const category = getCategory(categories, task.categoryKey);

                      return (
                        <div
                          key={task.id}
                          className="rounded-3xl bg-[#f8f4ef] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-1 h-4 w-4 rounded-full shrink-0"
                              style={{ backgroundColor: category.color }}
                            />

                            <div>
                              <p className="text-lg font-bold text-[#57351f]">
                                {task.title}
                              </p>

                              <p className="text-base text-[#57351f]">
                                {formatDate(task.date)}
                                {task.time ? ` · ${task.time}` : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-lg text-[#57351f]">
                      Todavía no hay tareas futuras generadas.
                    </p>
                  )}
                </div>

                <Link
                  href="/laboratorio/calendario"
                  className="mt-5 block rounded-3xl bg-[#5f9b5f] px-5 py-4 text-center humus-font-brand text-3xl text-white shadow-md hover:scale-105 transition"
                >
                  Ver Calendario
                </Link>
              </div>
            </aside>
          </div>

          {/* Notas */}
          <section className="mt-6 rounded-4xl bg-[#e8f0e7]/95 border-4 border-[#ceddc8] shadow-lg p-5 md:p-6">
            <h2 className="humus-font-brand text-5xl text-[#6b3f22]">
              Notas generales
            </h2>

            <p className="mb-4 text-xl text-[#57351f]">
              Usá este espacio para dejar criterios de manejo, ideas o cambios
              que quieras probar.
            </p>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              className="w-full rounded-4xl border-4 border-[#d9d1c8] bg-white px-5 py-4 text-xl text-[#57351f] outline-none resize-none shadow-md"
              placeholder="Ej: Alimentar menos si hay olor, humedecer solo si el cartón se seca, revisar fondo cada 15 días..."
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function RoutineCard({
  routine,
  categories,
  onEdit,
  onDelete,
  onToggleActive,
  onGenerateTasks,
}) {
  const category = getCategory(categories, routine.categoryKey);

  return (
    <article className="rounded-4xl bg-white p-5 shadow-md border border-[#d8d0c7]">
      <div className="flex items-start gap-3">
        <span
          className="mt-2 h-5 w-5 rounded-full shrink-0"
          style={{ backgroundColor: category.color }}
        />

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="humus-font-brand text-3xl text-[#6b3f22]">
                {routine.title}
              </h3>

              <p className="text-lg text-[#57351f]">
                {category.label || "Sin nombre"}
                {routine.time ? ` · ${routine.time}` : ""}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                routine.active
                  ? "bg-[#dbe7d5] text-[#3a8d43]"
                  : "bg-[#e5ddd3] text-[#6b3f22]"
              }`}
            >
              {routine.active ? "Activa" : "Pausada"}
            </span>
          </div>

          <p className="mt-3 text-lg text-[#57351f]">
            <strong>Días:</strong> {getWeekDaysText(routine.weekDays)}
          </p>

          {routine.observation && (
            <p className="mt-3 text-lg leading-relaxed text-[#57351f]">
              {routine.observation}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGenerateTasks}
              className="rounded-full bg-[#5f9b5f] px-3 py-2 text-sm font-bold text-white shadow-sm hover:scale-105 transition"
            >
              Pasar a Calendario
            </button>

            <button
              type="button"
              onClick={onToggleActive}
              className="rounded-full bg-[#fff2cf] px-3 py-2 text-sm font-bold text-[#6b3f22] shadow-sm hover:scale-105 transition"
            >
              {routine.active ? "Pausar" : "Activar"}
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="rounded-full bg-[#dbe7d5] px-3 py-2 text-sm font-bold text-[#3a8d43] shadow-sm hover:scale-105 transition"
            >
              Editar
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="rounded-full bg-[#f3d6d6] px-3 py-2 text-sm font-bold text-[#7a2e2e] shadow-sm hover:scale-105 transition"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FormField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-lg font-bold text-[#57351f]">
        {label}
      </label>
      {children}
    </div>
  );
}