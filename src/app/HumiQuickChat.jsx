"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const initialMessages = [
  {
    id: "humi-welcome",
    sender: "humi",
    text: "Hola, soy Humi. Estoy acá para ayudarte con tu compostera, tus parámetros, alimentación, humedad, pH, temperatura o el uso de HumusAI.",
  },
];

function getHumiAnswer(userText) {
  const text = userText.toLowerCase();

  if (text.includes("humedad") || text.includes("seco") || text.includes("seca")) {
    return "Para controlar la humedad, lo ideal es que el sustrato se sienta como una esponja escurrida: húmedo, pero sin gotear. Si está seco, podés agregar cartón húmedo o pulverizar un poco de agua.";
  }

  if (text.includes("ph") || text.includes("ácido") || text.includes("acido")) {
    return "El pH ideal suele estar cerca de neutro, aproximadamente entre 6 y 8. Si notás olor ácido, exceso de frutas o mucha fermentación, conviene reducir alimento fresco y agregar cartón seco o material estructurante.";
  }

  if (text.includes("temperatura") || text.includes("frío") || text.includes("frio") || text.includes("calor")) {
    return "Las lombrices suelen trabajar mejor en temperaturas templadas. Evitá sol directo, calor extremo y frío intenso. Si hace mucho calor, ubicá la compostera a la sombra y cuidá la humedad.";
  }

  if (text.includes("aliment") || text.includes("comida") || text.includes("verdura")) {
    return "Para alimentar, conviene agregar poca cantidad, en trozos pequeños, y observar si desaparece en algunos días. Si queda comida acumulada, aparece olor fuerte o muchas mosquitas, es mejor reducir la cantidad.";
  }

  if (text.includes("lombriz") || text.includes("lombrices")) {
    return "Si las lombrices están agrupadas, escapando o aparecen muertas, puede haber exceso de humedad, falta de oxígeno, acidez, calor, compactación o alimento en mal estado. Conviene revisar olor, humedad y aireación.";
  }

  if (text.includes("olor") || text.includes("huele")) {
    return "Si hay mal olor, suele indicar exceso de comida, falta de oxígeno o demasiada humedad. Mezclá suavemente la zona compactada, agregá cartón seco y pausá la alimentación unos días.";
  }

  if (text.includes("mosca") || text.includes("mosquitas")) {
    return "Las mosquitas suelen aparecer por comida expuesta o exceso de fruta. Cubrí los restos con tierra, humus o cartón húmedo, y evitá agregar más fruta por unos días.";
  }

  if (text.includes("gráfico") || text.includes("grafico") || text.includes("parámetro") || text.includes("parametro")) {
    return "En HumusAI podés cargar temperatura, pH, humedad, población y parámetros personalizados. Luego podés ver su evolución desde la sección Gráficos.";
  }

  return "Buena pregunta. Por ahora estoy en modo rápido local, así que puedo darte una orientación general. Más adelante esta burbuja se conectará con IA real para responder con más precisión usando tus datos del laboratorio.";
}

export default function HumiQuickChat() {
  const [chatOpen, setChatOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const pathname = usePathname();

  if (pathname?.startsWith("/asistente")) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanText = inputValue.trim();

    if (!cleanText) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: cleanText,
    };

    const humiMessage = {
      id: `humi-${Date.now()}`,
      sender: "humi",
      text: getHumiAnswer(cleanText),
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      humiMessage,
    ]);

    setInputValue("");
  }

  return (
    <>
      {chatOpen && (
        <section
          className={`fixed right-6 z-110 rounded-4xl bg-[#f8f4ef] border-4 border-[#5f9b5f] shadow-2xl overflow-hidden ${
         expanded
           ? "bottom-8 w-205 max-w-[94vw] h-[68vh]"
            : "bottom-28 w-130 max-w-[92vw]"
          }`}
        >
          <div className="bg-[#5f9b5f] px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img
                  src="/icons/humi.png"
                  alt="Humi IA"
                  className="h-12 w-12 object-contain"
                />
              </div>

              <div>
                <h2 className="humus-font-brand text-3xl text-white">
                  Humi IA
                </h2>
                <p className="text-sm text-white/90">
                  Chat rápido
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded((prevValue) => !prevValue)}
                className="h-10 w-10 rounded-full bg-white humus-font-brand text-xl text-[#6b3f22] shadow-md hover:scale-105 transition"
                aria-label={expanded ? "Achicar chat" : "Ampliar chat"}
                title={expanded ? "Achicar" : "Ampliar"}
              >
                {expanded ? "↙" : "↗"}
              </button>

              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="h-10 w-10 rounded-full bg-white humus-font-brand text-2xl text-[#6b3f22] shadow-md hover:scale-105 transition"
                aria-label="Cerrar chat"
                title="Cerrar"
              >
                ×
              </button>
            </div>
          </div>

          <div
            className={`overflow-y-auto p-4 flex flex-col gap-3 ${
              expanded ? "h-[calc(68vh-170px)]" : "h-56"
            }`}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-3xl px-4 py-3 text-lg leading-relaxed shadow-sm max-w-[85%] ${
                  message.sender === "humi"
                    ? "bg-white text-[#57351f] self-start"
                    : "bg-[#dbe7d5] text-[#57351f] self-end"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t-2 border-[#d7cfc6] p-4 bg-white"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Escribí tu duda..."
                className="flex-1 rounded-full border-2 border-[#d7cfc6] px-4 py-3 text-lg outline-none"
              />

              <button
                type="submit"
                className="rounded-full bg-[#5f9b5f] px-5 py-3 humus-font-brand text-xl text-white shadow-md hover:scale-105 transition"
              >
                Enviar
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setChatOpen((prevValue) => !prevValue)}
        className="fixed bottom-6 right-6 z-100 flex items-center gap-3 rounded-full bg-white border-4 border-[#5f9b5f] px-4 py-3 shadow-2xl hover:scale-105 transition"
        title="Preguntale a Humi"
        aria-label="Abrir chat rápido con Humi"
      >
        <div className="h-16 w-16 rounded-full bg-[#edf4ea] flex items-center justify-center overflow-hidden border-2 border-[#d7e6d2]">
          <img
            src="/icons/humi.png"
            alt="Humi IA"
            className="h-14 w-14 object-contain"
          />
        </div>

        <span className="hidden md:block humus-font-brand text-2xl text-[#6b3f22] whitespace-nowrap">
          Preguntale a Humi
        </span>
      </button>
    </>
  );
}