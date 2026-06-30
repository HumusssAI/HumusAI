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

function parseNumericValue(value) {
  if (value === null || value === undefined) return null;

  const normalizedValue = String(value)
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!normalizedValue) return null;

  const number = Number(normalizedValue);

  return Number.isFinite(number) ? number : null;
}

function formatDateShort(dateString) {
  if (!dateString) return "Sin fecha";

  const date = new Date(dateString);

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "Sin fecha";

  const date = new Date(dateString);

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRecordsForParameter(parameter, labEvents, parameterRecords) {
  const recordsFromEvents = parameter.eventKey
    ? labEvents
        .filter(
          (event) =>
            event[parameter.eventKey] !== undefined &&
            event[parameter.eventKey] !== null &&
            event[parameter.eventKey] !== "" &&
            !event.parameterRecordId
        )
        .map((event) => ({
          id: `event-${event.id}-${parameter.slug}`,
          value: event[parameter.eventKey],
          dateTime: event.dateTime,
          observation: event.observation || "",
          source: "Laboratorio",
        }))
    : [];

  const manualRecords = parameterRecords
    .filter((record) => record.slug === parameter.slug)
    .map((record) => ({
      id: record.id,
      value: record.value,
      dateTime: record.dateTime,
      observation: record.observation || "",
      source: "Parámetros",
    }));

  return [...recordsFromEvents, ...manualRecords]
    .map((record) => ({
      ...record,
      numericValue: parseNumericValue(record.value),
    }))
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
}

function getStats(records) {
  const numericRecords = records.filter((record) => record.numericValue !== null);

  if (numericRecords.length === 0) {
    return {
      count: 0,
      latest: null,
      average: null,
      min: null,
      max: null,
    };
  }

  const values = numericRecords.map((record) => record.numericValue);
  const latest = [...numericRecords].sort(
    (a, b) => new Date(b.dateTime) - new Date(a.dateTime)
  )[0];

  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    count: numericRecords.length,
    latest,
    average: total / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function formatStatValue(value, unit) {
  if (value === null || value === undefined) return "-";

  const roundedValue = Number(value.toFixed(2));

  return `${roundedValue}${unit ? ` ${unit}` : ""}`;
}

export default function GraficosPage() {
  const [labEvents, setLabEvents] = useState([]);
  const [parameterRecords, setParameterRecords] = useState([]);
  const [customParameters, setCustomParameters] = useState(
    DEFAULT_CUSTOM_PARAMETERS
  );
  const [selectedSlug, setSelectedSlug] = useState("temperatura");

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
  }, []);

  const allParameters = useMemo(() => {
    const configuredCustomParameters = customParameters.filter(
      (parameter) => parameter.configured
    );

    return [...BASE_PARAMETERS, ...configuredCustomParameters];
  }, [customParameters]);

  const selectedParameter = useMemo(() => {
    return (
      allParameters.find((parameter) => parameter.slug === selectedSlug) ||
      allParameters[0]
    );
  }, [allParameters, selectedSlug]);

  const recordsByParameter = useMemo(() => {
    return allParameters.reduce((accumulator, parameter) => {
      accumulator[parameter.slug] = getRecordsForParameter(
        parameter,
        labEvents,
        parameterRecords
      );

      return accumulator;
    }, {});
  }, [allParameters, labEvents, parameterRecords]);

  const selectedRecords = recordsByParameter[selectedParameter?.slug] || [];

  const numericRecords = selectedRecords.filter(
    (record) => record.numericValue !== null
  );

  const stats = getStats(selectedRecords);

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
              Gráficos
            </h1>

            <p className="text-xl md:text-2xl text-[#57351f]">
              Visualizá la evolución de los parámetros registrados en el laboratorio.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
            {/* Selector de parámetros */}
            <aside className="rounded-4xl bg-[#e8f0e7]/95 border-4 border-[#ceddc8] shadow-lg p-5 h-fit">
              <h2 className="humus-font-brand text-4xl text-[#6b3f22] mb-5">
                Parámetros
              </h2>

              <div className="flex flex-col gap-4">
                {allParameters.map((parameter) => {
                  const records = recordsByParameter[parameter.slug] || [];
                  const numericCount = records.filter(
                    (record) => record.numericValue !== null
                  ).length;

                  return (
                    <button
                      key={parameter.slug}
                      type="button"
                      onClick={() => setSelectedSlug(parameter.slug)}
                      className={`rounded-3xl px-5 py-4 text-left shadow-md hover:scale-[1.02] transition ${
                        selectedParameter?.slug === parameter.slug
                          ? "bg-[#5f9b5f] text-white"
                          : "bg-white text-[#6b3f22]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="humus-font-brand text-3xl">
                          {parameter.icon} {parameter.name}
                        </span>

                        <span className="rounded-full bg-white/80 px-3 py-1 text-base text-[#6b3f22]">
                          {numericCount}
                        </span>
                      </div>

                      <p className="mt-2 text-lg">
                        {numericCount === 1
                          ? "1 registro numérico"
                          : `${numericCount} registros numéricos`}
                      </p>
                    </button>
                  );
                })}
              </div>

              <Link
                href="/laboratorio/parametros"
                className="mt-6 block rounded-3xl bg-[#54c6d0] px-5 py-4 text-center humus-font-brand text-3xl text-white shadow-md hover:scale-105 transition"
              >
                Ir a Parámetros
              </Link>
            </aside>

            {/* Panel principal */}
            <section className="rounded-4xl bg-[#e8f0e7]/95 border-4 border-[#ceddc8] shadow-lg p-5 md:p-6">
              {selectedParameter ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="humus-font-brand text-5xl text-[#6b3f22]">
                        {selectedParameter.icon} {selectedParameter.name}
                      </h2>

                      <p className="text-xl text-[#57351f]">
                        Evolución histórica del parámetro seleccionado.
                      </p>
                    </div>

                    <Link
                      href={`/laboratorio/parametros/${selectedParameter.slug}`}
                      className="rounded-full bg-white px-5 py-3 humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition text-center"
                    >
                      Cargar valor
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <StatCard
                      label="Último"
                      value={
                        stats.latest
                          ? formatStatValue(
                              stats.latest.numericValue,
                              selectedParameter.unit
                            )
                          : "-"
                      }
                    />

                    <StatCard
                      label="Promedio"
                      value={formatStatValue(
                        stats.average,
                        selectedParameter.unit
                      )}
                    />

                    <StatCard
                      label="Mínimo"
                      value={formatStatValue(stats.min, selectedParameter.unit)}
                    />

                    <StatCard
                      label="Máximo"
                      value={formatStatValue(stats.max, selectedParameter.unit)}
                    />

                    <StatCard label="Registros" value={stats.count} />
                  </div>

                  <div className="rounded-4xl bg-white p-4 md:p-6 border border-[#d8d0c7] shadow-md">
                    <SimpleLineChart
                      records={numericRecords}
                      parameter={selectedParameter}
                    />
                  </div>

                  <div className="mt-6 rounded-4xl bg-white p-5 border border-[#d8d0c7] shadow-md">
                    <h3 className="humus-font-brand text-4xl text-[#6b3f22] mb-4">
                      Datos usados en el gráfico
                    </h3>

                    {selectedRecords.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-y-3">
                          <thead>
                            <tr>
                              <TableHeader>Fecha</TableHeader>
                              <TableHeader>Valor</TableHeader>
                              <TableHeader>Origen</TableHeader>
                              <TableHeader>Observación</TableHeader>
                            </tr>
                          </thead>

                          <tbody>
                            {[...selectedRecords]
                              .sort(
                                (a, b) =>
                                  new Date(b.dateTime) - new Date(a.dateTime)
                              )
                              .map((record) => (
                                <tr key={record.id}>
                                  <TableCell>
                                    {formatDateTime(record.dateTime)}
                                  </TableCell>

                                  <TableCell>
                                    {record.value}
                                    {selectedParameter.unit
                                      ? ` ${selectedParameter.unit}`
                                      : ""}
                                  </TableCell>

                                  <TableCell>{record.source}</TableCell>

                                  <TableCell>
                                    {record.observation || "-"}
                                  </TableCell>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-3xl bg-[#f7f3ee] p-8 text-center text-2xl">
                        Todavía no hay registros para este parámetro.
                      </div>
                    )}

                    {selectedRecords.length > 0 && numericRecords.length === 0 && (
                      <div className="mt-4 rounded-3xl bg-[#fff2cf] p-5 text-xl text-[#6b3f22]">
                        Este parámetro tiene registros, pero no valores numéricos.
                        Para graficarlo, cargá valores como 1, 2, 3, 6,8, etc.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-4xl bg-white p-8 text-center text-2xl shadow-md">
                  Todavía no hay parámetros disponibles.
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-white p-4 text-center shadow-md border border-[#d8d0c7]">
      <p className="text-lg text-[#57351f]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-black">{value}</p>
    </div>
  );
}

function SimpleLineChart({ records, parameter }) {
  const width = 800;
  const height = 320;
  const padding = 55;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (records.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center rounded-3xl bg-[#f7f3ee] text-center text-2xl text-[#6b3f22]">
        No hay valores numéricos para graficar todavía.
      </div>
    );
  }

  const values = records.map((record) => record.numericValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const points = records.map((record, index) => {
    const x =
      records.length === 1
        ? width / 2
        : padding + (index / (records.length - 1)) * chartWidth;

    const y =
      height -
      padding -
      ((record.numericValue - minValue) / range) * chartHeight;

    return {
      x,
      y,
      ...record,
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-180 rounded-3xl bg-[#f8f4ef]"
          role="img"
          aria-label={`Gráfico de ${parameter.name}`}
        >
          {/* Líneas guía */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#cfc6bc"
            strokeWidth="3"
          />

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#cfc6bc"
            strokeWidth="3"
          />

          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#e6ddd4"
            strokeWidth="2"
            strokeDasharray="8 8"
          />

          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#e6ddd4"
            strokeWidth="2"
            strokeDasharray="8 8"
          />

          {/* Etiquetas eje Y */}
          <text
            x={padding - 15}
            y={padding + 5}
            textAnchor="end"
            className="fill-[#6b3f22] text-lg"
          >
            {formatStatValue(maxValue, parameter.unit)}
          </text>

          <text
            x={padding - 15}
            y={height - padding + 5}
            textAnchor="end"
            className="fill-[#6b3f22] text-lg"
          >
            {formatStatValue(minValue, parameter.unit)}
          </text>

          {/* Línea principal */}
          {records.length > 1 && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#5f9b5f"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Puntos */}
          {points.map((point) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r="9"
                fill="#54c6d0"
                stroke="white"
                strokeWidth="4"
              />

              <text
                x={point.x}
                y={point.y - 18}
                textAnchor="middle"
                className="fill-[#2b231d] text-lg font-bold"
              >
                {point.numericValue}
              </text>

              <text
                x={point.x}
                y={height - padding + 32}
                textAnchor="middle"
                className="fill-[#6b3f22] text-base"
              >
                {formatDateShort(point.dateTime)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="mt-4 text-lg text-[#57351f]">
        El gráfico toma valores numéricos cargados desde Laboratorio y desde la sección Parámetros.
      </p>
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