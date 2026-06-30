"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

function formatDateTime(dateString) {
  if (!dateString) return "Sin fecha";

  const date = new Date(dateString);

  return date.toLocaleString("es-AR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getLatestRecord(parameter, labEvents, parameterRecords) {
  const recordsFromEvents = parameter.eventKey
    ? labEvents
        .filter((event) => event[parameter.eventKey])
        .map((event) => ({
          value: event[parameter.eventKey],
          dateTime: event.dateTime,
        }))
    : [];

  const manualRecords = parameterRecords
    .filter((record) => record.slug === parameter.slug)
    .map((record) => ({
      value: record.value,
      dateTime: record.dateTime,
    }));

  const allRecords = [...recordsFromEvents, ...manualRecords].sort(
    (a, b) => new Date(b.dateTime) - new Date(a.dateTime)
  );

  return allRecords[0] || null;
}

export default function ParametrosPage() {
  const [labEvents, setLabEvents] = useState([]);
  const [parameterRecords, setParameterRecords] = useState([]);
  const [customParameters, setCustomParameters] = useState(
    DEFAULT_CUSTOM_PARAMETERS
  );
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
    "humusai-custom-parameters",
    JSON.stringify(customParameters)
  );
}, [customParameters, dataLoaded]);

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
    console.error("No se pudieron guardar los eventos:", error);
  }
}, [labEvents, dataLoaded]);

  const allParameters = useMemo(() => {
    return [...BASE_PARAMETERS, ...customParameters];
  }, [customParameters]);

  function configureCustomParameter(parameter) {
  const name = prompt(
    "Nombre del parámetro. Ej: Olor, Color, Actividad, Lixiviado, Alimento"
  );

  if (!name || !name.trim()) return;

  const unit = prompt("Unidad opcional. Ej: mL, g, nivel, escala 1-5") || "";

  const icon =
    prompt("Icono opcional. Podés pegar un emoji. Ej: 👃, 🎨, 🧃, 🍌") ||
    "🧬";

  setCustomParameters((prevParameters) => {
    const updatedParameters = prevParameters.map((item) =>
      item.slug === parameter.slug
        ? {
            ...item,
            name: name.trim(),
            unit: unit.trim(),
            icon: icon.trim() || "🧬",
            configured: true,
          }
        : item
    );

    localStorage.setItem(
      "humusai-custom-parameters",
      JSON.stringify(updatedParameters)
    );

    return updatedParameters;
  });
}

function editCustomParameter(parameter) {
  const name = prompt(
    "Nuevo nombre del parámetro.",
    parameter.name
  );

  if (!name || !name.trim()) return;

  const unit = prompt(
    "Unidad opcional. Ej: mL, g, nivel, escala 1-5",
    parameter.unit || ""
  );

  if (unit === null) return;

  const icon = prompt(
    "Icono opcional. Podés pegar un emoji. Ej: 👃, 🎨, 🧃, 🍌",
    parameter.icon || "🧬"
  );

  if (icon === null) return;

  setCustomParameters((prevParameters) => {
    const updatedParameters = prevParameters.map((item) =>
      item.slug === parameter.slug
        ? {
            ...item,
            name: name.trim(),
            unit: unit.trim(),
            icon: icon.trim() || "🧬",
            configured: true,
          }
        : item
    );

    localStorage.setItem(
      "humusai-custom-parameters",
      JSON.stringify(updatedParameters)
    );

    return updatedParameters;
  });
}

function resetCustomParameter(parameter) {
  const confirmed = confirm(
    `¿Querés reiniciar el parámetro "${parameter.name}"? Esto eliminará su configuración y sus registros cargados desde Parámetros.`
  );

  if (!confirmed) return;

  const defaultParameter = DEFAULT_CUSTOM_PARAMETERS.find(
    (item) => item.slug === parameter.slug
  );

  if (!defaultParameter) return;

  setCustomParameters((prevParameters) => {
    const updatedParameters = prevParameters.map((item) =>
      item.slug === parameter.slug ? { ...defaultParameter } : item
    );

    localStorage.setItem(
      "humusai-custom-parameters",
      JSON.stringify(updatedParameters)
    );

    return updatedParameters;
  });

  setParameterRecords((prevRecords) =>
    prevRecords.filter((record) => record.slug !== parameter.slug)
  );

  setLabEvents((prevEvents) =>
    prevEvents.filter((eventItem) => eventItem.parameterSlug !== parameter.slug)
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
          <div className="flex items-center gap-4 mb-6">
            
            <div>
              <h1 className="humus-font-brand text-5xl md:text-6xl text-[#6b3f22]">
                Parámetros
              </h1>

              <p className="text-xl md:text-2xl text-[#57351f]">
                Control rápido de temperatura, pH, humedad, población y variables personalizadas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allParameters.map((parameter) => {
              const latestRecord = getLatestRecord(
                parameter,
                labEvents,
                parameterRecords
              );

              return (
                <ParameterCard
                  key={parameter.slug}
                  parameter={parameter}
                  latestRecord={latestRecord}
                  onConfigure={() => configureCustomParameter(parameter)}
                  onEdit={() => editCustomParameter(parameter)}
                  onReset={() => resetCustomParameter(parameter)}
                />
              );
            })}
          </div>

          <div className="mt-8">
            <Link
              href="/laboratorio/graficos"
              className="block w-full rounded-2xl bg-[#58c895] px-8 py-5 text-center humus-font-brand text-4xl text-white shadow-lg hover:scale-[1.01] transition"
            >
              Gráficos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ParameterCard({
  parameter,
  latestRecord,
  onConfigure,
  onEdit,
  onReset,
}) {
  const isCustom = parameter.slug.includes("personalizado");
  const isCustomNotConfigured = isCustom && !parameter.configured;

  if (isCustomNotConfigured) {
    return (
      <div>
        <button
          type="button"
          onClick={onConfigure}
          className="w-full rounded-2xl bg-[#54c6d0] px-5 py-5 humus-font-brand text-3xl text-white shadow-lg hover:scale-105 transition flex items-center justify-center gap-3"
        >
          <span className="text-4xl">{parameter.icon}</span>
          <span>{parameter.name}</span>
        </button>

        <div className="mt-3 rounded-2xl bg-[#f7eee7] p-5 min-h-28 shadow-md">
          <p className="text-lg text-[#57351f]">
            Parámetro personalizable.
          </p>
          <p className="mt-2 text-xl font-bold">
            Configuralo para empezar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/laboratorio/parametros/${parameter.slug}`}
        className="w-full rounded-2xl bg-[#54c6d0] px-5 py-5 humus-font-brand text-3xl text-white shadow-lg hover:scale-105 transition flex items-center justify-center gap-3"
      >
        <span className="text-4xl">{parameter.icon}</span>
        <span>{parameter.name}</span>
      </Link>

      <div className="mt-3 rounded-2xl bg-[#f7eee7] p-5 min-h-28 shadow-md">
        <p className="text-lg text-[#57351f]">Último valor:</p>

        {latestRecord ? (
          <>
            <p className="text-lg text-[#57351f]">
              {formatDateTime(latestRecord.dateTime)}
            </p>

            <p className="mt-1 text-2xl font-bold text-black">
              {latestRecord.value}
              {parameter.unit ? ` ${parameter.unit}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-2 text-xl font-bold text-black">
            Sin registros todavía
          </p>
        )}
      </div>

      {isCustom && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-2xl bg-white px-4 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl bg-[#f3d6d6] px-4 py-3 humus-font-brand text-2xl text-[#7a2e2e] shadow-md hover:scale-105 transition"
          >
            Reiniciar
          </button>
        </div>
      )}
    </div>
  );
}