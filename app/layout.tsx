import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fluvio-Cloud",
  description: "Software de facturación para acueductos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} flex bg-gray-50 min-h-screen`}>
        {/* Aquí ponemos nuestro Menú Lateral para que esté en todas partes */}
        <Sidebar />
        {/* Aquí es donde cambiarán las páginas (Dashboard, Suscriptores, etc.) */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}