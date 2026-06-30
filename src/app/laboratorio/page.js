"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

function getCurrentDateTimeLocal() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function getEmptyForm() {
  return {
    eventName: "Control",
    temperature: "",
    ph: "",
    humidity: "",
    observation: "",
    dateTime: getCurrentDateTimeLocal(),
    image: "",
    imageName: "",
  };
}

function compressImageToBase64(file, maxWidth = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFullDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function capitalizeText(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeCSV(value) {
  const safeValue = `${value ?? ""}`.replace(/"/g, '""');
  return `"${safeValue}"`;
}

function formatDateForExcel(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeForExcel(dateString) {
  const date = new Date(dateString);

  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createUtf16LeBlob(text) {
  const buffer = new ArrayBuffer(text.length * 2);
  const view = new Uint16Array(buffer);

  for (let i = 0; i < text.length; i++) {
    view[i] = text.charCodeAt(i);
  }

  return new Blob([buffer], {
    type: "text/csv;charset=utf-16le;",
  });
}

const DEFAULT_EVENT_NAME_OPTIONS = [
  "Control",
  "Alimentación",
  "Humedecer",
  "Inóculo",
  "Agregar lombrices",
  "Revisar fondo",
  "Foto",
  "Parámetros",
  "Alerta",
  "Muerte",
  "Aireación",
  "Lixiviado",
  "Cosecha de humus",
  "Cambio de cama",
];

function getEventNameOptions(calendarCategories) {
  const categoryLabels = Array.isArray(calendarCategories)
    ? calendarCategories
        .map((category) => category.label)
        .filter(Boolean)
    : [];

  return [...new Set([...DEFAULT_EVENT_NAME_OPTIONS, ...categoryLabels])];
}

const initialEvents = [
  {
    id: "1",
    eventName: "Control",
    temperature: "17",
    ph: "6,8",
    humidity: "78",
    observation: "Sin olor. Comida oscura. Agrupación cerca de la comida.",
    dateTime: "2026-06-06T14:30",
    image: "",
    imageName: "",
  },
  {
    id: "2",
    eventName: "Control",
    temperature: "15",
    ph: "6,9",
    humidity: "74",
    observation: "Buen aspecto general. Sin exceso de humedad.",
    dateTime: "2026-06-05T14:30",
    image: "",
    imageName: "",
  },
];

export default function LaboratorioPage() {
  const [events, setEvents] = useState(initialEvents);
  const [activeView, setActiveView] = useState("events");
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formData, setFormData] = useState(getEmptyForm());
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [calendarCategories, setCalendarCategories] = useState([]);

useEffect(() => {
  const savedEvents = localStorage.getItem("humusai-lab-events");
  const savedCalendarCategories = localStorage.getItem(
    "humusai-calendar-categories"
  );

  if (savedEvents) {
    try {
      setEvents(JSON.parse(savedEvents));
    } catch (error) {
      console.error("No se pudieron cargar los eventos:", error);
      setEvents(initialEvents);
    }
  } else {
    setEvents(initialEvents);
  }

  if (savedCalendarCategories) {
    try {
      setCalendarCategories(JSON.parse(savedCalendarCategories));
    } catch (error) {
      console.error("No se pudieron cargar las categorías:", error);
      setCalendarCategories([]);
    }
  }

  setDataLoaded(true);
}, []);

  useEffect(() => {
  if (!dataLoaded) return;

  try {
    localStorage.setItem("humusai-lab-events", JSON.stringify(events));
  } catch (error) {
    console.error("No se pudieron guardar los eventos:", error);

    alert(
      "La imagen es demasiado pesada para guardarla en esta versión local. Probá con una imagen más chica o comprimida."
    );
  }
}, [events, dataLoaded]);

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.dateTime) - new Date(a.dateTime)
    );
  }, [events]);

  const photoEvents = useMemo(() => {
    return sortedEvents.filter((event) => event.image);
  }, [sortedEvents]);

  const eventNameOptions = useMemo(() => {
  return getEventNameOptions(calendarCategories);
}, [calendarCategories]);

  function resetForm() {
    setFormData(getEmptyForm());
    setEditingEventId(null);
  }

  function openNewForm() {
    resetForm();
    setShowForm(true);
    setActiveView("events");
  }

  function openEditForm(event) {
    setFormData({
      eventName: event.eventName,
      temperature: event.temperature,
      ph: event.ph,
      humidity: event.humidity,
      observation: event.observation,
      dateTime: event.dateTime,
      image: event.image || "",
      imageName: event.imageName || "",
    });

    setEditingEventId(event.id);
    setShowForm(true);
    setActiveView("events");
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const base64Image = await compressImageToBase64(file);

    setFormData((prev) => ({
      ...prev,
      image: base64Image,
      imageName: file.name,
    }));
  }

  function removeImage() {
    setFormData((prev) => ({
      ...prev,
      image: "",
      imageName: "",
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newEvent = {
      id: editingEventId || `event-${Date.now()}`,
      eventName: formData.eventName.trim() || "Control",
      temperature: formData.temperature,
      ph: formData.ph,
      humidity: formData.humidity,
      observation: formData.observation.trim(),
      dateTime: formData.dateTime,
      image: formData.image,
      imageName: formData.imageName,
    };

    if (editingEventId) {
      setEvents((prevEvents) =>
        prevEvents.map((item) =>
          item.id === editingEventId ? newEvent : item
        )
      );
    } else {
      setEvents((prevEvents) => [newEvent, ...prevEvents]);
    }

    setShowForm(false);
    resetForm();
  }

  function deleteEvent(eventId) {
    const confirmed = confirm("¿Querés eliminar este evento?");

    if (!confirmed) return;

    setEvents((prevEvents) =>
      prevEvents.filter((item) => item.id !== eventId)
    );
  }

 function downloadCSV() {
  const headers = [
    "Fecha",
    "Hora",
    "Evento",
    "T (°C)",
    "pH",
    "%H",
    "Observación",
  ];

  const rows = sortedEvents.map((event) => [
    formatDateForExcel(event.dateTime),
    formatTimeForExcel(event.dateTime),
    event.eventName,
    event.temperature,
    event.ph,
    event.humidity,
    event.observation,
  ]);

  const separator = ";";

  const csvContent = [
    headers.map(escapeCSV).join(separator),
    ...rows.map((row) => row.map(escapeCSV).join(separator)),
  ].join("\r\n");

  const excelContent = `sep=;\r\n${csvContent}`;

  const blob = createUtf16LeBlob(excelContent);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "humusai-parametros-historicos.csv";
  link.click();

  URL.revokeObjectURL(url);
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
    </div>

    <img
      src="/icons/logohumusai.png"
      alt="Logo HumusAI"
      className="h-24 w-auto object-contain"
    />
  </div>
</header>

      <section className="pt-36 pb-10 px-3 md:px-6 relative">
        <div
          className="absolute inset-0 opacity-12 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: "url('/background/fondolab.png')" }}
        />

        <div className="relative max-w-7xl mx-auto">
         
          {/* Contenido principal */}
          <section className="rounded-4xl bg-[#e8f0e7]/95 border-4 border-[#ceddc8] shadow-lg p-4 md:p-6">
            {/* Botones superiores */}
            <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-center mb-6">
              <TopActionButton onClick={openNewForm}>
                Agregar nuevo
              </TopActionButton>

              <TopActionButton
                onClick={() => {
                  setActiveView("history");
                  setShowForm(false);
                }}
              >
                Parámetros históricos
              </TopActionButton>

              <TopActionButton
                onClick={() => {
                  setActiveView("photos");
                  setShowForm(false);
                }}
              >
                Todas las fotos
              </TopActionButton>
            </div>

            {/* Volver a eventos */}
            {activeView !== "events" && (
              <div className="mb-4">
                <button
                  onClick={() => setActiveView("events")}
                  className="rounded-full bg-white px-4 py-2 text-lg shadow-md hover:scale-105 transition"
                >
                  ← Volver a eventos
                </button>
              </div>
            )}

            {/* Formulario */}
            {showForm && (
              <form
                onSubmit={handleSubmit}
                className="mb-8 rounded-4xl bg-white border-4 border-[#d7cfc6] p-5 shadow-lg"
              >
                <h3 className="humus-font-brand text-4xl text-[#6b3f22] mb-5">
                  {editingEventId ? "Editar evento" : "Nuevo evento"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <FormField label="Evento">
  <select
    value={
      eventNameOptions.includes(formData.eventName)
        ? formData.eventName
        : "__custom__"
    }
    onChange={(event) => {
      const selectedValue = event.target.value;

      setFormData((prev) => ({
        ...prev,
        eventName: selectedValue === "__custom__" ? "" : selectedValue,
      }));
    }}
    className="mb-3 w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none bg-white"
  >
    {eventNameOptions.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}

    <option value="__custom__">Otro / escribir manualmente</option>
  </select>

  <input
    type="text"
    name="eventName"
    value={formData.eventName}
    onChange={handleInputChange}
    className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
    placeholder="Elegí una opción o escribí otro nombre..."
  />
</FormField>

                  <FormField label="Temperatura (°C)">
                    <input
                      type="text"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
                      placeholder="Ej: 17"
                    />
                  </FormField>

                  <FormField label="pH">
                    <input
                      type="text"
                      name="ph"
                      value={formData.ph}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
                      placeholder="Ej: 6,8"
                    />
                  </FormField>

                  <FormField label="Humedad (%)">
                    <input
                      type="text"
                      name="humidity"
                      value={formData.humidity}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
                      placeholder="Ej: 78"
                    />
                  </FormField>

                  <FormField label="Fecha y hora">
                    <input
                      type="datetime-local"
                      name="dateTime"
                      value={formData.dateTime}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
                    />
                  </FormField>

                  <FormField label="Imagen del evento">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none bg-white"
                    />
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField label="Observación">
                    <textarea
                      name="observation"
                      value={formData.observation}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none resize-none"
                      placeholder="Escribí observaciones del control..."
                    />
                  </FormField>
                </div>

                {formData.image && (
                  <div className="mt-4 rounded-3xl bg-[#f7f2ec] p-4">
                    <p className="mb-3 text-lg">
                      Imagen cargada: {formData.imageName || "Sin nombre"}
                    </p>

                    <img
                      src={formData.image}
                      alt="Vista previa del evento"
                      className="h-40 w-auto rounded-2xl border-2 border-[#d9d1c8]"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                      className="mt-3 rounded-full bg-[#f3d6d6] px-4 py-2 text-lg hover:scale-105 transition"
                    >
                      Quitar imagen
                    </button>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-[#5f9b5f] px-6 py-3 humus-font-brand text-2xl text-white shadow-md hover:scale-105 transition"
                  >
                    {editingEventId ? "Guardar cambios" : "Guardar evento"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="rounded-full bg-[#e5ddd3] px-6 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Vista eventos */}
            {activeView === "events" && (
              <div>
                <SectionHeaderRow />

                <div className="mt-4 flex flex-col gap-6">
                  {sortedEvents.map((eventItem) => (
                    <div key={eventItem.id}>
                      <div className="rounded-full bg-[#ede3d9] px-6 py-4 text-center text-2xl md:text-3xl font-semibold shadow-sm">
                        {capitalizeText(formatFullDate(eventItem.dateTime))}
                      </div>

                      <div className="mt-3 rounded-4xl bg-white/95 p-4 shadow-lg border border-[#d8d0c7]">
                        <div className="grid grid-cols-1 lg:grid-cols-[160px_100px_100px_100px_1fr_120px] gap-3 items-stretch">
                          <CellBox>{eventItem.eventName}</CellBox>
                          <CellBox centered>{eventItem.temperature}</CellBox>
                          <CellBox centered>{eventItem.ph}</CellBox>
                          <CellBox centered>{eventItem.humidity}</CellBox>
                          <CellBox>{eventItem.observation || "-"}</CellBox>

                          <div className="rounded-3xl bg-[#f6f1ea] p-3 flex items-center justify-center border border-[#ddd2c6]">
                            {eventItem.image ? (
  <button
    onClick={() => setSelectedPhoto(eventItem)}
    className="hover:scale-105 transition"
    title="Ver imagen"
  >
    <img
      src={eventItem.image}
      alt={`Evento ${eventItem.eventName}`}
      className="h-20 w-20 object-cover rounded-2xl"
    />
  </button>
) : (
  <span className="text-4xl">🖼️</span>
)}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-end gap-3">
                          <button
                            onClick={() => openEditForm(eventItem)}
                            className="rounded-full bg-[#dbe7d5] px-4 py-2 text-lg hover:scale-105 transition"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => deleteEvent(eventItem.id)}
                            className="rounded-full bg-[#f3d6d6] px-4 py-2 text-lg hover:scale-105 transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sortedEvents.length === 0 && (
                    <div className="rounded-4xl bg-white p-8 text-center text-2xl shadow-md">
                      Aún no hay eventos registrados.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vista histórico */}
            {activeView === "history" && (
              <div className="rounded-4xl bg-white p-5 shadow-lg border border-[#d8d0c7]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <h3 className="humus-font-brand text-4xl text-[#6b3f22]">
                    Parámetros históricos
                  </h3>

                  <button
                    onClick={downloadCSV}
                    className="rounded-full bg-[#5f9b5f] px-5 py-2 humus-font-brand text-2xl text-white shadow-md hover:scale-105 transition"
                  >
                    Descargar CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr>
                        <TableHeader>Fecha y hora</TableHeader>
                        <TableHeader>Evento</TableHeader>
                        <TableHeader>T (°C)</TableHeader>
                        <TableHeader>pH</TableHeader>
                        <TableHeader>%H</TableHeader>
                        <TableHeader>Observación</TableHeader>
                      </tr>
                    </thead>

                    <tbody>
                      {sortedEvents.map((eventItem) => (
                        <tr key={eventItem.id}>
                          <TableCell>
                            {capitalizeText(formatFullDate(eventItem.dateTime))}
                          </TableCell>
                          <TableCell>{eventItem.eventName}</TableCell>
                          <TableCell>{eventItem.temperature}</TableCell>
                          <TableCell>{eventItem.ph}</TableCell>
                          <TableCell>{eventItem.humidity}</TableCell>
                          <TableCell>{eventItem.observation || "-"}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vista fotos */}
            {activeView === "photos" && (
              <div className="rounded-4xl bg-white p-5 shadow-lg border border-[#d8d0c7]">
                <h3 className="humus-font-brand text-4xl text-[#6b3f22] mb-5">
                  Todas las fotos
                </h3>

                {photoEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {photoEvents.map((eventItem) => (
                      <div
                        key={eventItem.id}
                        className="rounded-4xl bg-[#f7f3ee] p-4 border border-[#ddd2c6] shadow-sm"
                      >
                        <button
  onClick={() => setSelectedPhoto(eventItem)}
  className="w-full hover:scale-[1.02] transition"
  title="Ver imagen"
>
  <img
    src={eventItem.image}
    alt={`Foto del evento ${eventItem.eventName}`}
    className="w-full h-56 object-cover rounded-3xl"
  />
</button>

                        <div className="mt-4">
                          <h4 className="humus-font-brand text-2xl text-[#6b3f22]">
                            {eventItem.eventName}
                          </h4>

                          <p className="mt-2 text-lg">
                            {capitalizeText(formatFullDate(eventItem.dateTime))}
                          </p>

                          <p className="mt-2 text-lg text-[#5e4331]">
                            {eventItem.observation || "Sin observación"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-4xl bg-[#f7f3ee] p-8 text-center text-2xl">
                    Todavía no hay fotos guardadas.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    {selectedPhoto && (
  <PhotoModal
    photo={selectedPhoto}
    onClose={() => setSelectedPhoto(null)}
  />
)}
    </main>
  );
}

function TopActionButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-[#d6ddd0] px-8 py-4 humus-font-brand text-3xl text-[#2b231d] shadow-md hover:scale-105 transition"
    >
      {children}
    </button>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block mb-2 text-xl font-semibold">{label}</label>
      {children}
    </div>
  );
}

function SectionHeaderRow() {
  return (
    <div className="hidden lg:grid lg:grid-cols-[160px_100px_100px_100px_1fr_120px] gap-3 mb-4">
      <HeaderChip>Evento</HeaderChip>
      <HeaderChip>T (°C)</HeaderChip>
      <HeaderChip>pH</HeaderChip>
      <HeaderChip>%H</HeaderChip>
      <HeaderChip>Observación</HeaderChip>
      <HeaderChip>Imagen</HeaderChip>
    </div>
  );
}

function HeaderChip({ children }) {
  return (
    <div className="rounded-3xl bg-[#e6ddd4] px-4 py-4 text-center text-2xl font-semibold shadow-sm">
      {children}
    </div>
  );
}

function CellBox({ children, centered = false }) {
  return (
    <div
      className={`rounded-3xl bg-[#f6f1ea] p-4 border border-[#ddd2c6] text-xl ${
        centered ? "flex items-center justify-center text-center" : ""
      }`}
    >
      {children}
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th className="rounded-2xl bg-[#e6ddd4] px-4 py-3 text-left text-xl">
      {children}
    </th>
  );
}

function TableCell({ children }) {
  return (
    <td className="rounded-2xl bg-[#f8f4ef] px-4 py-3 text-lg align-top">
      {children}
    </td>
  );
}

function PhotoModal({ photo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6">
      <button
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Cerrar imagen"
      />

      <div className="relative max-w-4xl w-full max-h-[90vh] rounded-4xl bg-[#f8f4ef] p-4 md:p-5 shadow-2xl border-4 border-white overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="humus-font-brand text-3xl md:text-4xl text-[#6b3f22]">
            {photo.eventName}
          </h3>

          <button
            onClick={onClose}
            className="h-12 w-12 shrink-0 rounded-full bg-white border-4 border-[#7a4828] humus-font-brand text-3xl text-[#7a4828] shadow-lg hover:scale-105 transition"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="max-h-[55vh] flex items-center justify-center overflow-hidden rounded-3xl bg-black/10">
          <img
            src={photo.image}
            alt={`Foto ampliada de ${photo.eventName}`}
            className="max-h-[55vh] max-w-full object-contain rounded-3xl"
          />
        </div>

        <div className="mt-4">
          <p className="text-lg md:text-xl text-[#5f3b24]">
            {capitalizeText(formatFullDate(photo.dateTime))}
          </p>

          {photo.observation && (
            <p className="mt-3 text-lg md:text-xl leading-relaxed text-[#5f3b24]">
              {photo.observation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}