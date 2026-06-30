import "./globals.css";
import HumiQuickChat from "./HumiQuickChat.jsx";

export const metadata = {
  title: "HumusAI",
  description: "Plataforma inteligente para vermicompostaje",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
        <HumiQuickChat />
      </body>
    </html>
  );
}