import "./globals.css";

export const metadata = {
  title: "HumusAI",
  description: "Plataforma inteligente para vermicompostaje",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}