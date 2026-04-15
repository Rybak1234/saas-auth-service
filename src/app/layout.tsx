import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "NovaTech Docs · Gestión de Documentos",
  description: "Plataforma de notas y documentos para el equipo NovaTech — organiza, busca y colabora",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
        {children}
      </body>
    </html>
  );
}
