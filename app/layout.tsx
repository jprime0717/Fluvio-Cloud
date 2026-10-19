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
      {/* El cambio clave: flex-col en móvil, flex-row en PC */}
      <body className={`${inter.className} bg-gray-50 flex flex-col md:flex-row min-h-screen`}>
        
        {/* Nuestro Menú Lateral Responsive */}
        <Sidebar />
        
        {/* El contenido de tu app toma el resto del espacio */}
        <main className="flex-1 w-full h-full md:h-screen md:overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}