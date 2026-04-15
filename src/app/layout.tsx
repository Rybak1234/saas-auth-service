import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovaTech Docs · Gestión de Documentos",
  description: "Plataforma de notas y documentos para el equipo NovaTech — organiza, busca y colabora",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
