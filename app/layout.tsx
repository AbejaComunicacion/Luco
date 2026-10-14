import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUCO Estudio | Escuela de Patronaje y Confección en Granada",
  description:
    "Escuela de patronaje y confección en Granada. Aprende a coser con grupos reducidos, atención personalizada y formación práctica junto a Diana Luco.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
