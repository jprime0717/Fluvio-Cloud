"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// Agregamos Menu y X para el botón hamburguesa
import { Users, FileText, DollarSign, Settings, Printer, Grid, LogOut, UserCircle, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<{ email?: string } | null>(null);
  const [cargando, setCargando] = useState(true);
  
  // ESTADO PARA EL MENÚ MÓVIL
  const [isOpen, setIsOpen] = useState(false);

  // EFECTO DE SEGURIDAD: Comprobamos si hay sesión activa
  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (pathname !== '/login') {
          router.push('/login');
        }
      } else {
        setUsuario(session.user);
      }
      setCargando(false);
    };

    verificarSesion();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (session) {
        setUsuario(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Si estamos en la pantalla de Login, NO mostramos el menú
  if (pathname === '/login') return null;

  // Pantalla de carga (oculta en móvil para no romper diseño, visible en PC)
  if (cargando) return <aside className="hidden md:block w-64 bg-blue-900 min-h-screen"></aside>;

  const esSuperAdmin = usuario?.email?.toLowerCase().includes('super');
  const rolVisual = esSuperAdmin ? 'Superadmin' : 'Administrador';

  return (
    <>
      {/* --- BARRA SUPERIOR PARA CELULARES --- */}
      <div className="md:hidden bg-blue-900 text-white flex items-center justify-between p-4 sticky top-0 z-20 shadow-md">
        <span className="font-bold text-xl">Fluvio-Cloud</span>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-1 focus:outline-none hover:text-blue-300 transition-colors"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* --- FONDO OSCURO PARA CELULARES (Cierra el menú al tocar afuera) --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- MENÚ LATERAL PRINCIPAL --- */}
      {/* La magia responsive: fixed en móvil (fuera de pantalla), static en PC */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-blue-900 text-white p-6 min-h-screen flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 overflow-y-auto shadow-2xl md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Fluvio-Cloud</h1>
          {/* Botón de cerrar (solo móvil) */}
          <button onClick={() => setIsOpen(false)} className="md:hidden text-blue-300 hover:text-white">
            <X size={28} />
          </button>
        </div>
        
        <nav className="space-y-2 flex-1">
          <Link onClick={() => setIsOpen(false)} href="/" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
            <DollarSign size={20} /> Resumen
          </Link>
          <Link onClick={() => setIsOpen(false)} href="/suscriptores" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/suscriptores' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
            <Users size={20} /> Suscriptores
          </Link>
          <Link onClick={() => setIsOpen(false)} href="/facturacion" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/facturacion' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
            <Settings size={20} /> Generar Mes
          </Link>
          <Link onClick={() => setIsOpen(false)} href="/facturas" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/facturas' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
            <FileText size={20} /> Historial Facturas
          </Link>
          <Link onClick={() => setIsOpen(false)} href="/recaudo" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/recaudo' ? 'bg-green-600 text-white font-bold shadow' : 'text-green-300 hover:bg-green-700 hover:text-white'}`}>
            <DollarSign size={20} /> Recaudo (Pagos)
          </Link>
          
          <div className="pt-4 mt-4 border-t border-blue-800">
            <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">Reportes</p>
            <Link onClick={() => setIsOpen(false)} href="/impresion-masiva" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/impresion-masiva' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
              <Printer size={20} /> Impresión Masiva
            </Link>
            <Link onClick={() => setIsOpen(false)} href="/cartera" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/cartera' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
              <Grid size={20} /> Cartera Anual
            </Link>
          </div>
        </nav>

        {/* --- SECCIÓN DE PERFIL Y CIERRE DE SESIÓN --- */}
        <div className="mt-8 pt-4 border-t border-blue-800 shrink-0">
          
          {esSuperAdmin && (
            <Link onClick={() => setIsOpen(false)} href="/configuracion" className={`flex items-center gap-3 p-3 mb-2 rounded-lg transition-colors ${pathname === '/configuracion' ? 'bg-gray-800 text-white' : 'text-blue-200 hover:bg-gray-800 hover:text-white'}`}>
              <Settings size={20} /> Configuración
            </Link>
          )}

          {usuario && (
            <div className="bg-blue-950 p-3 rounded-lg mb-2 flex items-center gap-3">
              <UserCircle size={36} className="text-blue-300 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate" title={usuario.email}>
                  {usuario.email}
                </p>
                <p className={`text-xs font-semibold ${esSuperAdmin ? 'text-amber-400' : 'text-blue-300'}`}>
                  {rolVisual}
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={cerrarSesion} 
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-red-300 hover:bg-red-500 hover:text-white transition-colors font-bold"
          >
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}