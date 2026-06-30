"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const DEFAULT_CUSTOM_PARAMETERS = [
  {
    slug: "personalizado-1",
    name: "Agregar parámetro",
    unit: "",
    icon: "+",
    configured: false,
  },
  {
    slug: "personalizado-2",
    name: "Agregar parámetro",
    unit: "",
    icon: "+",
    configured: false,
  },
];

const BASE_PARAMETERS = [
  {
    slug: "temperatura",
    name: "Temperatura",
    unit: "°C",
    icon: "🌡️",
    eventKey: "temperature",
  },
  {
    slug: "ph",
    name: "pH",
    unit: "",
    icon: "🧪",
    eventKey: "ph",
  },
  {
    slug: "humedad",
    name: "Humedad",
    unit: "%",
    icon: "💧",
    eventKey: "humidity",
  },
  {
    slug: "poblacion",
    name: "Población",
    unit: "",
    icon: "🪱",
    eventKey: null,
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
  const pad = (value) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatDateTime(dateString) {
  if (!dateString) return "Sin fecha";

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

function getEmptyForm() {
  return {
    value: "",
    dateTime: getCurrentDateTimeLocal(),
    observation: "",
  };
}

function buildLabEventFromParameterRecord(record, parameter, existingEvent) {
  const valueWithUnit = `${record.value}${parameter.unit ? ` ${parameter.unit}` : ""}`;

  const baseEvent = {
    id: existingEvent?.id || record.linkedEventId || `event-from-${record.id}`,
    eventName: existingEvent?.eventName || `Registro de ${parameter.name}`,
    temperature: existingEvent?.temperature || "",
    ph: existingEvent?.ph || "",
    humidity: existingEvent?.humidity || "",
    observation:
      existingEvent?.observation ||
      `${parameter.name}: ${valueWithUnit}. Registro cargado desde Parámetros.`,
    dateTime: record.dateTime,
    image: existingEvent?.image || "",
    imageName: existingEvent?.imageName || "",
    createdFromParameter: true,
    parameterSlug: parameter.slug,
    parameterRecordId: record.id,
  };

  if (parameter.slug === "temperatura") {
    baseEvent.temperature = record.value;
  }

  if (parameter.slug === "ph") {
    baseEvent.ph = record.value;
  }

  if (parameter.slug === "humedad") {
    baseEvent.humidity = record.value;
  }

  if (
    parameter.slug === "poblacion" ||
    parameter.slug.includes("personalizado")
  ) {
    baseEvent.observation =
      existingEvent?.observation ||
      `${parameter.name}: ${valueWithUnit}. ${
        record.observation || "Registro cargado desde Parámetros."
      }`;
  }

  return baseEvent;
}

export default function ParameterDetailPage() {
  const params = useParams();
  const slug = params?.parametro;

  const [labEvents, setLabEvents] = useState([]);
  const [parameterRecords, setParameterRecords] = useState([]);
  const [customParameters, setCustomParameters] = useState(
    DEFAULT_CUSTOM_PARAMETERS
  );
  const [formData, setFormData] = useState(getEmptyForm());
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const savedEvents = safeParseJSON(
      localStorage.getItem("humusai-lab-events"),
      []
    );

    const savedRecords = safeParseJSON(
      localStorage.getItem("humusai-param-records"),
      []
    );

    const savedCustomParameters = safeParseJSON(
      localStorage.getItem("humusai-custom-parameters"),
      DEFAULT_CUSTOM_PARAMETERS
    );

    setLabEvents(savedEvents);
    setParameterRecords(savedRecords);
    setCustomParameters(savedCustomParameters);
    setDataLoaded(true);
  }, []);

  useEffect(() => {
  if (!dataLoaded) return;

  localStorage.setItem(
    "humusai-param-records",
    JSON.stringify(parameterRecords)
  );
}, [parameterRecords, dataLoaded]);

useEffect(() => {
  if (!dataLoaded) return;

  try {
    localStorage.setItem("humusai-lab-events", JSON.stringify(labEvents));
  } catch (error) {
    console.error("No se pudieron guardar los eventos del laboratorio:", error);
    alert(
      "No se pudieron sincronizar los eventos con Laboratorio. Puede haber demasiadas imágenes guardadas."
    );
  }
}, [labEvents, dataLoaded]);

  const allParameters = useMemo(() => {
    return [...BASE_PARAMETERS, ...customParameters];
  }, [customParameters]);

  const parameter = allParameters.find((item) => item.slug === slug);

  const recordsFromEvents = useMemo(() => {
    if (!parameter?.eventKey) return [];

    return labEvents
  .filter((event) => event[parameter.eventKey] && !event.parameterRecordId)
  .map((event) => ({
        id: `event-${event.id}-${parameter.slug}`,
        value: event[parameter.eventKey],
        dateTime: event.dateTime,
        observation: event.observation || "Registro cargado desde Eventos.",
        source: "Evento",
        editable: false,
      }));
  }, [labEvents, parameter]);

  const manualRecords = useMemo(() => {
    return parameterRecords
      .filter((record) => record.slug === slug)
      .map((record) => ({
        ...record,
        source: "Parámetro",
        editable: true,
      }));
  }, [parameterRecords, slug]);

  const allRecords = useMemo(() => {
    return [...recordsFromEvents, ...manualRecords].sort(
      (a, b) => new Date(b.dateTime) - new Date(a.dateTime)
    );
  }, [recordsFromEvents, manualRecords]);

  const latestRecord = allRecords[0];

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
  event.preventDefault();

  if (!formData.value.trim()) {
    alert("Ingresá un valor para guardar el registro.");
    return;
  }

  const existingRecord = parameterRecords.find(
    (record) => record.id === editingRecordId
  );

  const recordId = editingRecordId || `param-${Date.now()}`;

  const newRecord = {
    id: recordId,
    slug,
    value: formData.value.trim(),
    dateTime: formData.dateTime,
    observation: formData.observation.trim(),
    linkedEventId: existingRecord?.linkedEventId || `event-from-${recordId}`,
  };

  if (editingRecordId) {
    setParameterRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.id === editingRecordId ? newRecord : record
      )
    );
  } else {
    setParameterRecords((prevRecords) => [newRecord, ...prevRecords]);
  }

  setLabEvents((prevEvents) => {
    const existingEvent = prevEvents.find(
      (eventItem) =>
        eventItem.id === newRecord.linkedEventId ||
        eventItem.parameterRecordId === newRecord.id
    );

    const syncedEvent = buildLabEventFromParameterRecord(
      newRecord,
      parameter,
      existingEvent
    );

    if (existingEvent) {
      return prevEvents.map((eventItem) =>
        eventItem.id === existingEvent.id ? syncedEvent : eventItem
      );
    }

    return [syncedEvent, ...prevEvents];
  });

  setFormData(getEmptyForm());
  setEditingRecordId(null);
}

  function editRecord(record) {
    setFormData({
      value: record.value,
      dateTime: record.dateTime,
      observation: record.observation || "",
    });

    setEditingRecordId(record.id);
  }

  function deleteRecord(recordId) {
  const confirmed = confirm("¿Querés eliminar este registro?");

  if (!confirmed) return;

  const recordToDelete = parameterRecords.find(
    (record) => record.id === recordId
  );

  setParameterRecords((prevRecords) =>
    prevRecords.filter((record) => record.id !== recordId)
  );

  setLabEvents((prevEvents) =>
    prevEvents.filter(
      (eventItem) =>
        eventItem.parameterRecordId !== recordId &&
        eventItem.id !== recordToDelete?.linkedEventId
    )
  );
}

  function cancelEdit() {
    setFormData(getEmptyForm());
    setEditingRecordId(null);
  }

  if (!parameter) {
    return (
      <main className="min-h-screen bg-[#edf4ea] text-[#57351f] humus-font-text p-8">
        <Link
          href="/laboratorio/parametros"
          className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg"
        >
          ← Volver
        </Link>

        <h1 className="mt-8 humus-font-brand text-5xl text-[#6b3f22]">
          Parámetro no encontrado
        </h1>
      </main>
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
        href="/laboratorio/graficos"
        className="rounded-full bg-white px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-lg hover:scale-105 transition"
      >
        Gráficos
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

        <div className="relative max-w-6xl mx-auto">
          <div className="mb-6">
            <Link
              href="/laboratorio/parametros"
              className="inline-flex items-center rounded-full bg-white px-5 py-2 text-xl shadow-md hover:scale-105 transition"
            >
              ← Volver a parámetros
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
            {/* Panel de carga */}
            <aside className="rounded-4xl bg-[#e8f0e7]/95 border-4 border-[#8eb58d] p-5 shadow-lg h-fit">
              <div className="rounded-3xl bg-[#54c6d0] p-5 text-white shadow-md">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{parameter.icon}</span>

                  <div>
                    <h1 className="humus-font-brand text-4xl">
                      {parameter.name}
                    </h1>

                    <p className="text-xl">
                      Registro y control histórico
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl bg-[#f7eee7] p-5 shadow-md">
                <p className="text-lg">Último valor:</p>

                {latestRecord ? (
                  <>
                    <p className="mt-1 text-3xl font-bold text-black">
                      {latestRecord.value}
                      {parameter.unit ? ` ${parameter.unit}` : ""}
                    </p>

                    <p className="mt-2 text-lg">
                      {capitalizeText(formatDateTime(latestRecord.dateTime))}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-2xl font-bold">
                    Sin registros todavía
                  </p>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-5 rounded-3xl bg-white p-5 shadow-md"
              >
                <h2 className="humus-font-brand text-3xl text-[#6b3f22] mb-4">
                  {editingRecordId ? "Editar registro" : "Agregar registro"}
                </h2>

                <label className="block mb-2 text-xl font-semibold">
                  Valor {parameter.unit ? `(${parameter.unit})` : ""}
                </label>

                <input
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
                  placeholder={`Ej: ${
                    parameter.slug === "temperatura"
                      ? "18"
                      : parameter.slug === "ph"
                      ? "6,8"
                      : parameter.slug === "humedad"
                      ? "78"
                      : "valor"
                  }`}
                />

                <label className="block mt-4 mb-2 text-xl font-semibold">
                  Fecha y hora
                </label>

                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formData.dateTime}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none"
                />

                <label className="block mt-4 mb-2 text-xl font-semibold">
                  Observación
                </label>

                <textarea
                  name="observation"
                  value={formData.observation}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-2xl border-2 border-[#d9d1c8] px-4 py-3 text-lg outline-none resize-none"
                  placeholder="Anotá detalles del registro..."
                />

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-[#5f9b5f] px-5 py-2 humus-font-brand text-2xl text-white shadow-md hover:scale-105 transition"
                  >
                    {editingRecordId ? "Guardar" : "Agregar"}
                  </button>

                  {editingRecordId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-full bg-[#e5ddd3] px-5 py-2 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </aside>

            {/* Tabla histórica */}
            <section className="rounded-4xl bg-white/95 border-4 border-[#d7cfc6] p-5 shadow-lg">
              <h2 className="humus-font-brand text-4xl text-[#6b3f22] mb-5">
                Historial de {parameter.name}
              </h2>

              {allRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr>
                        <TableHeader>Fecha y hora</TableHeader>
                        <TableHeader>Valor</TableHeader>
                        <TableHeader>Origen</TableHeader>
                        <TableHeader>Observación</TableHeader>
                        <TableHeader>Acciones</TableHeader>
                      </tr>
                    </thead>

                    <tbody>
                      {allRecords.map((record) => (
                        <tr key={record.id}>
                          <TableCell>
                            {capitalizeText(formatDateTime(record.dateTime))}
                          </TableCell>

                          <TableCell>
                            <strong>
                              {record.value}
                              {parameter.unit ? ` ${parameter.unit}` : ""}
                            </strong>
                          </TableCell>

                          <TableCell>{record.source}</TableCell>

                          <TableCell>{record.observation || "-"}</TableCell>

                          <TableCell>
                            {record.editable ? (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => editRecord(record)}
                                  className="rounded-full bg-[#dbe7d5] px-3 py-1 text-sm hover:scale-105 transition"
                                >
                                  Editar
                                </button>

                                <button
                                  onClick={() => deleteRecord(record.id)}
                                  className="rounded-full bg-[#f3d6d6] px-3 py-1 text-sm hover:scale-105 transition"
                                >
                                  Eliminar
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm">
                                Se edita desde Eventos
                              </span>
                            )}
                          </TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-4xl bg-[#f7eee7] p-8 text-center text-2xl">
                  Todavía no hay registros para este parámetro.
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
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
