"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const initialChat = {
  id: "chat-1",
  title: "Nuevo chat con Humi",
  messages: [
    {
      role: "humi",
      text: "¡Hola! Soy Humi, tu asistente de vermicompostaje. Puedo ayudarte a diseñar composteras, identificar lombrices, planificar alimentación y resolver problemas de humedad, pH o temperatura.",
    },
  ],
};

export default function AsistentePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([initialChat]);
  const [activeChatId, setActiveChatId] = useState(initialChat.id);
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    const savedChats = localStorage.getItem("humusai-humi-chats");
    const savedActiveChatId = localStorage.getItem("humusai-active-chat-id");

    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);

      if (savedActiveChatId) {
        setActiveChatId(savedActiveChatId);
      } else if (parsedChats.length > 0) {
        setActiveChatId(parsedChats[0].id);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("humusai-humi-chats", JSON.stringify(chats));
    localStorage.setItem("humusai-active-chat-id", activeChatId);
  }, [chats, activeChatId]);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0];

  function updateActiveChatMessages(newMessages) {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === activeChatId ? { ...chat, messages: newMessages } : chat
      )
    );
  }

  function sendMessage(text) {
    const messageText = text || input;

    if (!messageText.trim() && selectedFiles.length === 0) return;

    const filesText =
      selectedFiles.length > 0
        ? `\n\nArchivos adjuntos: ${selectedFiles
            .map((file) => file.name)
            .join(", ")}`
        : "";

    const userMessage = {
      role: "user",
      text: `${messageText || "Adjunté archivos para analizar."}${filesText}`,
    };

    const humiResponse = {
      role: "humi",
      text: "Por ahora soy una versión inicial de Humi. Más adelante voy a poder analizar tus fotos, documentos y registros con IA real. Esta estructura ya deja preparada la experiencia para trabajar con imágenes, diseños de composteras, alimentación y seguimiento del sistema.",
    };

    const updatedMessages = [...activeChat.messages, userMessage, humiResponse];

    updateActiveChatMessages(updatedMessages);
    setInput("");
    setSelectedFiles([]);
  }

  function createNewChat() {
    const newChat = {
      id: `chat-${Date.now()}`,
      title: "Nuevo chat",
      messages: [
        {
          role: "humi",
          text: "¡Hola! Soy Humi. Contame qué querés hacer hoy: diseñar una compostera, identificar una lombriz, planificar alimentación o revisar un problema de tu sistema.",
        },
      ],
    };

    setChats((prevChats) => [newChat, ...prevChats]);
    setActiveChatId(newChat.id);
    setSidebarOpen(true);
  }

  function renameChat(chatId) {
    const newTitle = prompt("Nuevo nombre del chat:");

    if (!newTitle || !newTitle.trim()) return;

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
      )
    );
  }

  function deleteChat(chatId) {
    const confirmed = confirm("¿Querés eliminar este chat?");

    if (!confirmed) return;

    setChats((prevChats) => {
      const filteredChats = prevChats.filter((chat) => chat.id !== chatId);

      if (filteredChats.length === 0) {
        setActiveChatId(initialChat.id);
        return [initialChat];
      }

      if (activeChatId === chatId) {
        setActiveChatId(filteredChats[0].id);
      }

      return filteredChats;
    });
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] text-[#6b3f22] humus-font-text">
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

      <section className="pt-36 px-4 md:px-10 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="humus-font-brand text-5xl md:text-6xl text-[#7a4828]">
              Asistente IA Humi
            </h1>

            <p className="mt-3 text-2xl text-[#6b3f22]">
              Diseñá, registrá y resolvé dudas sobre tu vermicompostera.
            </p>
          </div>

          <div
            className={`grid gap-6 transition-all ${
              sidebarOpen
                ? "grid-cols-1 lg:grid-cols-[320px_1fr]"
                : "grid-cols-1 lg:grid-cols-[80px_1fr]"
            }`}
          >
            {/* Menú de conversaciones */}
            <aside className="rounded-4xl bg-[#dce8dc] border-4 border-[#6aa96a] shadow-lg overflow-hidden h-fit lg:sticky lg:top-36">
              <div className="flex items-center justify-between p-4 border-b-4 border-[#6aa96a]">
                {sidebarOpen && (
                  <h2 className="humus-font-brand text-3xl text-[#7a4828]">
                    Chats
                  </h2>
                )}

                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="h-12 w-12 rounded-full bg-white border-4 border-[#3a8d43] text-[#3a8d43] shadow-md text-2xl hover:scale-105 transition"
                  aria-label="Abrir o cerrar menú de chats"
                >
                  {sidebarOpen ? "←" : "☰"}
                </button>
              </div>

              {sidebarOpen ? (
                <div className="p-4">
                  <button
                    onClick={createNewChat}
                    className="w-full rounded-2xl bg-white px-4 py-3 humus-font-brand text-2xl text-[#7a4828] shadow-md hover:scale-105 transition"
                  >
                    + Nuevo chat
                  </button>

                  <div className="mt-5 space-y-3">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`rounded-2xl p-3 shadow-sm border-2 ${
                          chat.id === activeChatId
                            ? "bg-[#efe5dc] border-[#7a4828]"
                            : "bg-white border-transparent"
                        }`}
                      >
                        <button
                          onClick={() => setActiveChatId(chat.id)}
                          className="w-full text-left text-lg text-[#5f3b24]"
                        >
                          {chat.title}
                        </button>

                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => renameChat(chat.id)}
                            className="rounded-full bg-[#dce8dc] px-3 py-1 text-sm text-[#5f3b24] hover:scale-105 transition"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => deleteChat(chat.id)}
                            className="rounded-full bg-[#f3d6d6] px-3 py-1 text-sm text-[#5f3b24] hover:scale-105 transition"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 flex flex-col items-center gap-3">
                  <button
                    onClick={createNewChat}
                    className="h-12 w-12 rounded-full bg-white text-3xl text-[#7a4828] shadow-md hover:scale-105 transition"
                    title="Nuevo chat"
                  >
                    +
                  </button>

                  <img
                    src="/icons/humi.png"
                    alt="Humi"
                    className="h-12 w-12 object-contain"
                  />
                </div>
              )}
            </aside>

            {/* Chat principal */}
            <section className="rounded-4xl bg-white border-4 border-[#7a4828] shadow-xl overflow-hidden min-h-162.5 flex flex-col">
              <div className="bg-[#efe5dc] px-6 py-4 border-b-4 border-[#7a4828] flex items-center gap-4">
                <img
                  src="/icons/humi.png"
                  alt="Humi"
                  className="h-14 w-14 object-contain"
                />

                <div>
                  <h2 className="humus-font-brand text-3xl text-[#7a4828]">
                    {activeChat?.title || "Chat con Humi"}
                  </h2>
                  <p className="text-lg text-[#5f3b24]">
                    Asistente especializado en vermicompostaje.
                  </p>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-5 overflow-y-auto">
                {activeChat?.messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    role={message.role}
                    text={message.text}
                  />
                ))}

                {activeChat?.messages.length === 1 && (
                  <QuickActions sendMessage={sendMessage} />
                )}
              </div>

              {selectedFiles.length > 0 && (
                <div className="px-6 py-3 bg-[#fff8ef] border-t-2 border-[#e0d1c2]">
                  <p className="text-lg text-[#5f3b24]">
                    Archivos seleccionados:{" "}
                    {selectedFiles.map((file) => file.name).join(", ")}
                  </p>
                </div>
              )}

              <div className="p-5 bg-[#efe5dc] border-t-4 border-[#7a4828]">
                <div className="flex items-center gap-3 rounded-full bg-white border-4 border-[#7a4828] px-4 py-3">
                  <label
                    className="cursor-pointer rounded-full bg-[#dce8dc] h-11 w-11 flex items-center justify-center text-2xl shadow-md hover:scale-105 transition"
                    title="Adjuntar archivo"
                  >
                    📎
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>

                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        sendMessage();
                      }
                    }}
                    className="flex-1 bg-transparent outline-none text-xl text-[#5f3b24] placeholder:text-[#5f3b24]/60"
                    placeholder="Escribí tu consulta para Humi..."
                  />

                  <button
                    onClick={() => sendMessage()}
                    className="rounded-full bg-[#5f9b5f] px-5 py-2 humus-font-brand text-2xl text-white shadow-md hover:scale-105 transition"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickActions({ sendMessage }) {
  return (
    <div className="ml-12 mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
      <ActionCard
        title="Diseñar compostera"
        text="Planificar un sistema casero, vertical, modular o reciclado."
        onClick={() =>
          sendMessage(
            "Quiero diseñar una vermicompostera. Ayudame a elegir materiales, tamaño, ventilación, drenaje y niveles."
          )
        }
      />

      <ActionCard
        title="Identificar lombriz"
        text="Analizar características, fotos o diferencias entre especies."
        onClick={() =>
          sendMessage(
            "Quiero identificar una especie de lombriz para vermicompostaje. ¿Qué datos o fotos necesitás?"
          )
        }
      />

      <ActionCard
        title="Planificar alimentación"
        text="Organizar cantidades, frecuencia y tipos de residuos."
        onClick={() =>
          sendMessage(
            "Quiero planificar la alimentación de mis lombrices según el tamaño de mi compostera y la población aproximada."
          )
        }
      />
    </div>
  );
}

function ActionCard({ title, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-3xl bg-[#fff8ef] border-2 border-[#e0d1c2] p-4 text-left shadow-md hover:scale-[1.02] transition"
    >
      <h3 className="humus-font-brand text-2xl text-[#7a4828]">{title}</h3>
      <p className="mt-2 text-lg leading-snug text-[#5f3b24]">{text}</p>
    </button>
  );
}

function ChatMessage({ role, text }) {
  const isHumi = role === "humi";

  return (
    <div className={`flex ${isHumi ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[82%] rounded-3xl px-5 py-4 shadow-md ${
          isHumi
            ? "bg-[#dce8dc] text-[#4f321f] border-2 border-[#6aa96a]"
            : "bg-[#5f9b5f] text-white"
        }`}
      >
        {isHumi && (
          <div className="flex items-center gap-2 mb-2">
            <img
              src="/icons/humi.png"
              alt="Humi"
              className="h-8 w-8 object-contain"
            />
            <span className="humus-font-brand text-xl text-[#7a4828]">
              Humi
            </span>
          </div>
        )}

        <p className="text-xl leading-relaxed whitespace-pre-line">{text}</p>
      </div>
    </div>
  );
}