"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const WEEK_DAYS = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

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

const CUSTOM_COLORS = [
  "#84cc16",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#64748b",
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

function getCurrentDateTimeLocal() {
  const now = new Date();

  return `${now.getFullYear()}-${padNumber(now.getMonth() + 1)}-${padNumber(
    now.getDate()
  )}T${padNumber(now.getHours())}:${padNumber(now.getMinutes())}`;
}

function getDateKey(dateString) {
  if (!dateString) return "";

  if (String(dateString).includes("T")) {
    return String(dateString).split("T")[0];
  }

  const date = new Date(dateString);

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate()
  )}`;
}

function getTodayKey() {
  return getDateKey(getCurrentDateTimeLocal());
}

function formatMonthTitle(date) {
  return date.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function formatFullDate(dateKey) {
  if (!dateKey) return "";

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function capitalizeText(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getMonthDays(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstDayIndex = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const calendarCells = [];

  for (let index = 0; index < firstDayIndex; index++) {
    const date = new Date(year, month, 1 - (firstDayIndex - index));

    calendarCells.push({
      day: date.getDate(),
      dateKey: `${date.getFullYear()}-${padNumber(
        date.getMonth() + 1
      )}-${padNumber(date.getDate())}`,
      currentMonth: false,
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateKey = `${year}-${padNumber(month + 1)}-${padNumber(day)}`;

    calendarCells.push({
      day,
      dateKey,
      currentMonth: true,
    });
  }

  while (calendarCells.length < 42) {
    const lastCell = calendarCells[calendarCells.length - 1];
    const [cellYear, cellMonth, cellDay] = lastCell.dateKey
      .split("-")
      .map(Number);

    const nextDate = new Date(cellYear, cellMonth - 1, cellDay + 1);

    calendarCells.push({
      day: nextDate.getDate(),
      dateKey: `${nextDate.getFullYear()}-${padNumber(
        nextDate.getMonth() + 1
      )}-${padNumber(nextDate.getDate())}`,
      currentMonth: false,
    });
  }

  return calendarCells;
}

function getCategory(categories, categoryKey) {
  return (
    categories.find((category) => category.key === categoryKey) ||
    categories.find((category) => category.key === "tarea") ||
    DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1]
  );
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

function inferEventCategories(eventItem, categories = DEFAULT_CATEGORIES) {
  const detectedCategories = [];
  const eventName = eventItem.eventName?.toLowerCase() || "";
  const observation = eventItem.observation?.toLowerCase() || "";
  const searchableText = `${eventName} ${observation}`;

  if (eventName.includes("aliment") || observation.includes("aliment")) {
    detectedCategories.push("alimentacion");
  }

  if (
    eventName.includes("humed") ||
    observation.includes("humed") ||
    observation.includes("seco")
  ) {
    detectedCategories.push("humedad");
  }

  if (
    eventName.includes("inóculo") ||
    eventName.includes("inoculo") ||
    eventName.includes("siembra") ||
    eventName.includes("lombriz") ||
    observation.includes("inóculo") ||
    observation.includes("inoculo") ||
    observation.includes("siembra") ||
    observation.includes("lombriz") ||
    eventItem.parameterSlug === "poblacion"
  ) {
    detectedCategories.push("inoculo");
  }

  if (
    eventName.includes("fondo") ||
    observation.includes("fondo") ||
    observation.includes("compact")
  ) {
    detectedCategories.push("fondo");
  }

  if (eventItem.image) {
    detectedCategories.push("foto");
  }

  if (eventItem.parameterSlug) {
    detectedCategories.push("parametros");
  }

  if (eventItem.temperature || eventItem.ph || eventItem.humidity) {
    detectedCategories.push("control");
  }

  if (
    eventName.includes("alerta") ||
    eventName.includes("muerte") ||
    eventName.includes("muert") ||
    observation.includes("alerta") ||
    observation.includes("problema") ||
    observation.includes("olor") ||
    observation.includes("muerte") ||
    observation.includes("muert")
  ) {
    detectedCategories.push("alerta");
  }

  categories.forEach((category) => {
    const label = category.label?.toLowerCase().trim();

    if (!label || label.length < 3) return;

    if (searchableText.includes(label)) {
      detectedCategories.push(category.key);
    }
  });

  if (detectedCategories.length === 0) {
    detectedCategories.push("control");
  }

  return [...new Set(detectedCategories)];
}

function getEmptyTask(selectedDateKey = getTodayKey()) {
  return {
    id: "",
    title: "Alimentar",
    categoryKey: "alimentacion",
    date: selectedDateKey,
    time: "16:00",
    observation: "",
    done: false,
  };
}

function buildLabEventFromTask(taskItem, categories) {
  const category = getCategory(categories, taskItem.categoryKey);
  const dateTime = `${taskItem.date}T${taskItem.time || "12:00"}`;

  return {
    id: `event-from-${taskItem.id}`,
    eventName: taskItem.title || category.label || "Tarea realizada",
    temperature: "",
    ph: "",
    humidity: "",
    observation: taskItem.observation
      ? `${category.label}: ${taskItem.observation}`
      : `${category.label}: tarea registrada desde Calendario.`,
    dateTime,
    image: "",
    imageName: "",
    createdFromTask: true,
    calendarTaskId: taskItem.id,
    calendarCategoryKey: taskItem.categoryKey,
  };
}

export default function CalendarioPage() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(getTodayKey());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState(getEmptyTask());
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const savedEvents = safeParseJSON(
      localStorage.getItem("humusai-lab-events"),
      []
    );

    const savedTasks = safeParseJSON(
      localStorage.getItem("humusai-calendar-tasks"),
      []
    );

    const savedCategories = safeParseJSON(
      localStorage.getItem("humusai-calendar-categories"),
      DEFAULT_CATEGORIES
    );

    setEvents(savedEvents);
    setTasks(savedTasks);
    setCategories(mergeCategories(savedCategories));
    setDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;

    localStorage.setItem("humusai-calendar-tasks", JSON.stringify(tasks));
  }, [tasks, dataLoaded]);

  useEffect(() => {
  if (!dataLoaded) return;

  try {
    localStorage.setItem("humusai-lab-events", JSON.stringify(events));
  } catch (error) {
    console.error("No se pudieron guardar los eventos:", error);

    alert(
      "No se pudo registrar el evento en Laboratorio. Puede que haya demasiados datos guardados en esta versión local."
    );
  }
}, [events, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;

    localStorage.setItem(
      "humusai-calendar-categories",
      JSON.stringify(categories)
    );
  }, [categories, dataLoaded]);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );
  }, [events]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const dateA = `${a.date}T${a.time || "00:00"}`;
      const dateB = `${b.date}T${b.time || "00:00"}`;

      return new Date(dateA) - new Date(dateB);
    });
  }, [tasks]);

  const eventsByDate = useMemo(() => {
    return sortedEvents.reduce((accumulator, eventItem) => {
      const dateKey = getDateKey(eventItem.dateTime);

      if (!dateKey) return accumulator;

      if (!accumulator[dateKey]) {
        accumulator[dateKey] = [];
      }

      accumulator[dateKey].push(eventItem);

      return accumulator;
    }, {});
  }, [sortedEvents]);

  const tasksByDate = useMemo(() => {
    return sortedTasks.reduce((accumulator, taskItem) => {
      if (!taskItem.date) return accumulator;

      if (!accumulator[taskItem.date]) {
        accumulator[taskItem.date] = [];
      }

      accumulator[taskItem.date].push(taskItem);

      return accumulator;
    }, {});
  }, [sortedTasks]);

  const monthDays = useMemo(() => {
    return getMonthDays(currentMonth);
  }, [currentMonth]);

  const selectedEvents = eventsByDate[selectedDateKey] || [];
  const selectedTasks = tasksByDate[selectedDateKey] || [];

  const monthItemsCount = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const monthPrefix = `${year}-${padNumber(month)}`;

    const eventCount = sortedEvents.filter((eventItem) =>
      getDateKey(eventItem.dateTime).startsWith(monthPrefix)
    ).length;

    const taskCount = sortedTasks.filter((taskItem) =>
      taskItem.date?.startsWith(monthPrefix)
    ).length;

    return eventCount + taskCount;
  }, [currentMonth, sortedEvents, sortedTasks]);

  function goToPreviousMonth() {
    setCurrentMonth(
      (prevMonth) =>
        new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      (prevMonth) =>
        new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1)
    );
  }

  function goToToday() {
    const today = new Date();

    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(getTodayKey());
  }

  function openNewTaskForm() {
    setTaskForm(getEmptyTask(selectedDateKey));
    setEditingTaskId(null);
    setShowTaskForm(true);
  }

  function openEditTaskForm(taskItem) {
    setTaskForm({
      id: taskItem.id,
      title: taskItem.title,
      categoryKey: taskItem.categoryKey,
      date: taskItem.date,
      time: taskItem.time || "",
      observation: taskItem.observation || "",
      done: taskItem.done || false,
    });

    setEditingTaskId(taskItem.id);
    setShowTaskForm(true);
  }

  function handleTaskFormChange(event) {
    const { name, value } = event.target;

    setTaskForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  }

  function handleTaskSubmit(event) {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      alert("Ingresá un título para la tarea.");
      return;
    }

    if (!taskForm.date) {
      alert("Elegí una fecha para la tarea.");
      return;
    }

    const newTask = {
      id: editingTaskId || `task-${Date.now()}`,
      title: taskForm.title.trim(),
      categoryKey: taskForm.categoryKey,
      date: taskForm.date,
      time: taskForm.time,
      observation: taskForm.observation.trim(),
      done: taskForm.done || false,
    };

    if (editingTaskId) {
      setTasks((prevTasks) =>
        prevTasks.map((taskItem) =>
          taskItem.id === editingTaskId ? newTask : taskItem
        )
      );
    } else {
      setTasks((prevTasks) => [...prevTasks, newTask]);
    }

    setSelectedDateKey(newTask.date);
    setCurrentMonth(() => {
      const [year, month] = newTask.date.split("-").map(Number);
      return new Date(year, month - 1, 1);
    });

    setShowTaskForm(false);
    setEditingTaskId(null);
    setTaskForm(getEmptyTask(newTask.date));
  }

  function toggleTaskDone(taskId) {
    setTasks((prevTasks) =>
      prevTasks.map((taskItem) =>
        taskItem.id === taskId
          ? { ...taskItem, done: !taskItem.done }
          : taskItem
      )
    );
  }

  function deleteTask(taskId) {
    const confirmed = confirm("¿Querés eliminar esta tarea del calendario?");

    if (!confirmed) return;

    setTasks((prevTasks) =>
      prevTasks.filter((taskItem) => taskItem.id !== taskId)
    );
  }

  function convertTaskToLabEvent(taskItem) {
  if (!taskItem.date) {
    alert("La tarea no tiene fecha asignada.");
    return;
  }

  const alreadyConverted = events.some(
    (eventItem) => eventItem.calendarTaskId === taskItem.id
  );

  if (alreadyConverted) {
    alert("Esta tarea ya fue registrada en Laboratorio.");
    return;
  }

  const labEvent = buildLabEventFromTask(taskItem, categories);

  setEvents((prevEvents) => [...prevEvents, labEvent]);

  setTasks((prevTasks) =>
    prevTasks.map((currentTask) =>
      currentTask.id === taskItem.id
        ? {
            ...currentTask,
            done: true,
            convertedToEvent: true,
            linkedEventId: labEvent.id,
          }
        : currentTask
    )
  );

  alert("La tarea fue marcada como realizada y registrada en Laboratorio.");
}

  function updateCategory(categoryKey, field, value) {
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.key === categoryKey
          ? {
              ...category,
              [field]: value,
            }
          : category
      )
    );
  }

  function addCustomCategory() {
    const nextIndex =
      categories.filter((category) => !category.system).length %
      CUSTOM_COLORS.length;

    const newCategory = {
      key: `custom-${Date.now()}`,
      label: "Nueva categoría",
      color: CUSTOM_COLORS[nextIndex],
      system: false,
    };

    setCategories((prevCategories) => [...prevCategories, newCategory]);
    setShowCategoryEditor(true);
  }

  function deleteCustomCategory(categoryKey) {
    const category = categories.find((item) => item.key === categoryKey);

    if (!category || category.system) return;

    const confirmed = confirm(
      `¿Querés eliminar la categoría "${category.label}"? Las tareas que usen esta categoría pasarán a "Tarea".`
    );

    if (!confirmed) return;

    setCategories((prevCategories) =>
      prevCategories.filter((item) => item.key !== categoryKey)
    );

    setTasks((prevTasks) =>
      prevTasks.map((taskItem) =>
        taskItem.categoryKey === categoryKey
          ? { ...taskItem, categoryKey: "tarea" }
          : taskItem
      )
    );
  }

  function restoreDefaultCategories() {
    const confirmed = confirm(
      "¿Querés restaurar las referencias por defecto? Se perderán los colores, nombres modificados y categorías personalizadas."
    );

    if (!confirmed) return;

    setCategories(DEFAULT_CATEGORIES);

    setTasks((prevTasks) =>
      prevTasks.map((taskItem) => {
        const categoryExists = DEFAULT_CATEGORIES.some(
          (category) => category.key === taskItem.categoryKey
        );

        return categoryExists
          ? taskItem
          : {
              ...taskItem,
              categoryKey: "tarea",
            };
      })
    );
  }

  function closeCategoryEditor() {
    setCategories((prevCategories) =>
      prevCategories.map((category) => ({
        ...category,
        label: category.label.trim() || "Sin nombre",
      }))
    );

    setShowCategoryEditor(false);
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
              Calendario
            </h1>

            <p className="text-xl md:text-2xl text-[#57351f]">
              Planificá tareas futuras y visualizá los eventos registrados por día.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
            {/* Calendario mensual */}
            <section className="rounded-4xl bg-[#e8f0e7]/95 border-4 border-[#ceddc8] shadow-lg p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="humus-font-brand text-5xl text-[#6b3f22] capitalize">
                    {formatMonthTitle(currentMonth)}
                  </h2>

                  <p className="text-xl text-[#57351f]">
                    {monthItemsCount === 1
                      ? "1 marca en este mes"
                      : `${monthItemsCount} marcas en este mes`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="rounded-full bg-white px-5 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={goToToday}
                    className="rounded-full bg-[#5f9b5f] px-5 py-3 humus-font-brand text-2xl text-white shadow-md hover:scale-105 transition"
                  >
                    Hoy
                  </button>

                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="rounded-full bg-white px-5 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-4 border-black bg-white">
                {WEEK_DAYS.map((dayName) => (
                  <div
                    key={dayName}
                    className="border-b border-r border-[#d8d0c7] px-2 py-3 text-left text-lg font-semibold"
                  >
                    {dayName}
                  </div>
                ))}

                {monthDays.map((dayItem) => {
                  const dayEvents = eventsByDate[dayItem.dateKey] || [];
                  const dayTasks = tasksByDate[dayItem.dateKey] || [];
                  const isSelected = selectedDateKey === dayItem.dateKey;
                  const isToday = getTodayKey() === dayItem.dateKey;

                  const eventCategoryKeys = dayEvents.flatMap((eventItem) =>
                    inferEventCategories(eventItem, categories)
                  );

                  const taskCategoryKeys = dayTasks.map(
                    (taskItem) => taskItem.categoryKey
                  );

                  const markers = [
                    ...new Set([...eventCategoryKeys, ...taskCategoryKeys]),
                  ];

                  return (
                    <button
                      key={dayItem.dateKey}
                      type="button"
                      onClick={() => setSelectedDateKey(dayItem.dateKey)}
                      className={`min-h-24 border-r border-b border-[#d8d0c7] p-2 text-left transition hover:bg-[#eef7ed] ${
                        isSelected ? "bg-[#e2f5e1]" : "bg-white"
                      } ${!dayItem.currentMonth ? "text-gray-400" : "text-black"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-lg font-bold">
                          {dayItem.day}
                        </span>

                        {isToday && (
                          <span className="rounded-full bg-[#5f9b5f] px-2 py-1 text-xs text-white">
                            Hoy
                          </span>
                        )}
                      </div>

                      {markers.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {markers.slice(0, 6).map((categoryKey) => {
                            const category = getCategory(
                              categories,
                              categoryKey
                            );

                            return (
                              <span
                                key={categoryKey}
                                className="h-4 w-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                                title={category.label}
                              />
                            );
                          })}
                        </div>
                      )}

                      {(dayEvents.length > 0 || dayTasks.length > 0) && (
                        <p className="mt-2 text-xs text-[#57351f]">
                          {dayEvents.length + dayTasks.length} marca
                          {dayEvents.length + dayTasks.length === 1 ? "" : "s"}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              <Legend
                categories={categories}
                showCategoryEditor={showCategoryEditor}
                onToggleEditor={() =>
                  setShowCategoryEditor((prevValue) => !prevValue)
                }
                onCloseEditor={closeCategoryEditor}
                onUpdateCategory={updateCategory}
                onAddCategory={addCustomCategory}
                onDeleteCategory={deleteCustomCategory}
                onRestoreDefaults={restoreDefaultCategories}
              />

              <div className="mt-6 flex flex-col md:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={openNewTaskForm}
                  className="rounded-full bg-[#5f9b5f] px-6 py-3 humus-font-brand text-2xl text-white shadow-md hover:scale-105 transition"
                >
                  Agregar tarea
                </button>

                <button
                  type="button"
                  className="rounded-full bg-gray-400 px-6 py-3 humus-font-brand text-2xl text-white shadow-md opacity-80"
                  title="Próximamente"
                >
                  Conectar con Google Calendar
                </button>
              </div>
            </section>

            {/* Panel del día seleccionado */}
            <aside className="rounded-4xl bg-[#e8f0e7]/95 border-4 border-[#ceddc8] shadow-lg p-5 md:p-6 h-fit">
              <h2 className="humus-font-brand text-4xl text-[#6b3f22]">
                {capitalizeText(formatFullDate(selectedDateKey))}
              </h2>

              <p className="mt-2 text-xl text-[#57351f]">
                {selectedEvents.length + selectedTasks.length === 1
                  ? "1 marca en este día"
                  : `${selectedEvents.length + selectedTasks.length} marcas en este día`}
              </p>

              {showTaskForm && (
                <TaskForm
                  taskForm={taskForm}
                  categories={categories}
                  editingTaskId={editingTaskId}
                  onChange={handleTaskFormChange}
                  onSubmit={handleTaskSubmit}
                  onCancel={() => {
                    setShowTaskForm(false);
                    setEditingTaskId(null);
                    setTaskForm(getEmptyTask(selectedDateKey));
                  }}
                />
              )}

              {!showTaskForm && (
                <button
                  type="button"
                  onClick={openNewTaskForm}
                  className="mt-5 w-full rounded-3xl bg-[#5f9b5f] px-5 py-4 text-center humus-font-brand text-3xl text-white shadow-md hover:scale-105 transition"
                >
                  Agregar tarea a este día
                </button>
              )}

              <div className="mt-5 flex flex-col gap-4">
                {selectedTasks.length > 0 && (
                  <div>
                    <h3 className="humus-font-brand text-3xl text-[#6b3f22] mb-3">
                      Tareas planificadas
                    </h3>

                    <div className="flex flex-col gap-4">
                      {selectedTasks.map((taskItem) => (
                       <CalendarTaskCard
                          key={taskItem.id}
                          taskItem={taskItem}
                          categories={categories}
                          onToggleDone={() => toggleTaskDone(taskItem.id)}
                          onConvertToEvent={() => convertTaskToLabEvent(taskItem)}
                          onEdit={() => openEditTaskForm(taskItem)}
                          onDelete={() => deleteTask(taskItem.id)}
                      />
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvents.length > 0 && (
                  <div>
                    <h3 className="humus-font-brand text-3xl text-[#6b3f22] mb-3">
                      Eventos registrados
                    </h3>

                    <div className="flex flex-col gap-4">
                      {selectedEvents.map((eventItem) => (
                        <CalendarEventCard
                          key={eventItem.id}
                          eventItem={eventItem}
                          categories={categories}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvents.length === 0 && selectedTasks.length === 0 && (
                  <div className="rounded-4xl bg-white p-6 text-center text-xl shadow-md">
                    No hay eventos ni tareas en este día.
                  </div>
                )}
              </div>

              <Link
                href="/laboratorio"
                className="mt-6 block rounded-3xl bg-white px-5 py-4 text-center humus-font-brand text-3xl text-[#6b3f22] shadow-md hover:scale-105 transition"
              >
                Ir a Laboratorio
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function Legend({
  categories,
  showCategoryEditor,
  onToggleEditor,
  onCloseEditor,
  onUpdateCategory,
  onAddCategory,
  onDeleteCategory,
  onRestoreDefaults,
}) {
  return (
    <div className="mt-4 rounded-4xl bg-[#fff4ea] px-5 py-4 shadow-md border border-[#e4d6c8]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="humus-font-brand text-3xl text-[#6b3f22]">
          Referencias
        </h3>

        <button
          type="button"
          onClick={onToggleEditor}
          className="rounded-full bg-white px-4 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
        >
          {showCategoryEditor ? "Cerrar editor" : "Editar referencias"}
        </button>
      </div>

      <div className="flex flex-wrap gap-x-7 gap-y-3">
        {categories.map((category) => (
          <div key={category.key} className="flex items-center gap-2">
            <span
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-xl font-bold text-[#57351f]">
              {category.label || "Sin nombre"}
            </span>
          </div>
        ))}
      </div>

      {showCategoryEditor && (
        <div className="mt-5 rounded-4xl bg-white p-5 shadow-md border border-[#d8d0c7]">
          <div className="flex flex-col gap-4">
            {categories.map((category) => (
              <div
                key={category.key}
                className="grid grid-cols-1 md:grid-cols-[1fr_90px_auto] gap-3 items-center rounded-3xl bg-[#f8f4ef] p-3"
              >
                <input
                  type="text"
                  value={category.label}
                  onChange={(event) =>
                    onUpdateCategory(
                      category.key,
                      "label",
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none bg-white"
                />

                <input
                  type="color"
                  value={category.color}
                  onChange={(event) =>
                    onUpdateCategory(
                      category.key,
                      "color",
                      event.target.value
                    )
                  }
                  className="h-12 w-full cursor-pointer rounded-2xl border-2 border-[#d9d1c8] bg-white"
                  title="Elegir color"
                />

                {category.system ? (
                  <span className="rounded-full bg-[#dbe7d5] px-4 py-2 text-center text-sm font-bold text-[#3a8d43]">
                    Base
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(category.key)}
                    className="rounded-full bg-[#f3d6d6] px-4 py-2 text-sm font-bold text-[#7a2e2e] shadow-sm hover:scale-105 transition"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onAddCategory}
              className="rounded-full bg-[#5f9b5f] px-5 py-3 humus-font-brand text-2xl text-white shadow-md hover:scale-105 transition"
            >
              + Agregar categoría
            </button>

            <button
              type="button"
              onClick={onRestoreDefaults}
              className="rounded-full bg-[#e5ddd3] px-5 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
            >
              Restaurar por defecto
            </button>

            <button
              type="button"
              onClick={onCloseEditor}
              className="rounded-full bg-white px-5 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
            >
              Guardar y cerrar
            </button>
          </div>

          <p className="mt-4 text-lg text-[#57351f]">
            Las categorías base se pueden renombrar y cambiar de color, pero no
            eliminar. Las categorías nuevas sí se pueden eliminar.
          </p>
        </div>
      )}
    </div>
  );
}

function TaskForm({
  taskForm,
  categories,
  editingTaskId,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-5 rounded-4xl bg-white p-5 shadow-md border border-[#d8d0c7]"
    >
      <h3 className="humus-font-brand text-3xl text-[#6b3f22] mb-4">
        {editingTaskId ? "Editar tarea" : "Nueva tarea"}
      </h3>

      <FormField label="Título">
        <input
          type="text"
          name="title"
          value={taskForm.title}
          onChange={onChange}
          className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
          placeholder="Ej: Alimentar"
        />
      </FormField>

      <FormField label="Categoría">
        <select
          name="categoryKey"
          value={taskForm.categoryKey}
          onChange={onChange}
          className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none bg-white"
        >
          {categories.map((category) => (
            <option key={category.key} value={category.key}>
              {category.label || "Sin nombre"}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha">
          <input
            type="date"
            name="date"
            value={taskForm.date}
            onChange={onChange}
            className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
          />
        </FormField>

        <FormField label="Hora">
          <input
            type="time"
            name="time"
            value={taskForm.time}
            onChange={onChange}
            className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
          />
        </FormField>
      </div>

      <FormField label="Observación">
        <textarea
          name="observation"
          value={taskForm.observation}
          onChange={onChange}
          rows={3}
          className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none resize-none"
          placeholder="Ej: Agregar restos pequeños y cartón húmedo..."
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
          onClick={onCancel}
          className="rounded-full bg-[#e5ddd3] px-5 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function CalendarTaskCard({
  taskItem,
  categories,
  onToggleDone,
  onConvertToEvent,
  onEdit,
  onDelete,
}) {
  const category = getCategory(categories, taskItem.categoryKey);

  return (
    <div className="rounded-4xl bg-white p-5 shadow-md border border-[#d8d0c7]">
      <div className="flex items-start gap-3">
        <span
          className="mt-2 h-5 w-5 rounded-full shrink-0"
          style={{ backgroundColor: category.color }}
        />

        <div className="flex-1">
          <h3
            className={`humus-font-brand text-3xl ${
              taskItem.done ? "text-gray-400 line-through" : "text-[#6b3f22]"
            }`}
          >
            {taskItem.title}
          </h3>

          <p className="text-lg text-[#57351f]">
            {category.label || "Sin nombre"}
            {taskItem.time ? ` · ${taskItem.time}` : ""}
          </p>

          {taskItem.observation && (
            <p className="mt-3 text-lg leading-relaxed text-[#57351f]">
              {taskItem.observation}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
  <button
    type="button"
    onClick={onToggleDone}
    className={`rounded-full px-3 py-2 text-sm font-bold shadow-sm hover:scale-105 transition ${
      taskItem.done
        ? "bg-[#dbe7d5] text-[#3a8d43]"
        : "bg-[#fff2cf] text-[#6b3f22]"
    }`}
  >
    {taskItem.done ? "Realizada" : "Pendiente"}
  </button>

  {taskItem.convertedToEvent ? (
    <span className="rounded-full bg-[#dbe7d5] px-3 py-2 text-sm font-bold text-[#3a8d43] shadow-sm">
      Registrada en Lab
    </span>
  ) : (
    <button
      type="button"
      onClick={onConvertToEvent}
      className="rounded-full bg-[#5f9b5f] px-3 py-2 text-sm font-bold text-white shadow-sm hover:scale-105 transition"
    >
      {taskItem.done ? "Registrar en Lab" : "Realizar y registrar"}
    </button>
  )}

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
    </div>
  );
}

function CalendarEventCard({ eventItem, categories }) {
  const categoryKeys = inferEventCategories(eventItem, categories);

  return (
    <div className="rounded-4xl bg-white p-5 shadow-md border border-[#d8d0c7]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="humus-font-brand text-3xl text-[#6b3f22]">
            {eventItem.eventName || "Evento"}
          </h3>

          <p className="text-lg text-[#57351f]">
            {formatTime(eventItem.dateTime)}
          </p>
        </div>

        {eventItem.image && (
          <img
            src={eventItem.image}
            alt={`Foto de ${eventItem.eventName}`}
            className="h-16 w-16 rounded-2xl object-cover border-2 border-[#d8d0c7]"
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categoryKeys.map((categoryKey) => {
          const category = getCategory(categories, categoryKey);

          return (
            <span
              key={categoryKey}
              className="rounded-full px-3 py-1 text-sm font-bold text-white"
              style={{ backgroundColor: category.color }}
            >
              {category.label || "Sin nombre"}
            </span>
          );
        })}
      </div>

      {(eventItem.temperature || eventItem.ph || eventItem.humidity) && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniParam label="T" value={eventItem.temperature} unit="°C" />
          <MiniParam label="pH" value={eventItem.ph} unit="" />
          <MiniParam label="H" value={eventItem.humidity} unit="%" />
        </div>
      )}

      {eventItem.observation && (
        <p className="mt-4 text-lg leading-relaxed text-[#57351f]">
          {eventItem.observation}
        </p>
      )}
    </div>
  );
}

function MiniParam({ label, value, unit }) {
  return (
    <div className="rounded-2xl bg-[#f7f3ee] px-3 py-2 text-center">
      <p className="text-sm text-[#57351f]">{label}</p>
      <p className="text-lg font-bold text-black">
        {value || "-"}
        {value && unit ? ` ${unit}` : ""}
      </p>
    </div>
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