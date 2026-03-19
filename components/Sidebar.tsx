"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
// Agregamos LogOut y UserCircle para el perfil
import { Users, FileText, DollarSign, Settings, Printer, Grid, LogOut, UserCircle } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  // EFECTO DE SEGURIDAD: Comprobamos si hay sesión activa
  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Si no hay sesión y no estamos en la página de login, lo expulsamos
        if (pathname !== '/login') {
          router.push('/login');
        }
      } else {
        // Si hay sesión, guardamos los datos del usuario
        setUsuario(session.user);
      }
      setCargando(false);
    };

    verificarSesion();

    // Escuchamos si el usuario inicia o cierra sesión en otra pestaña
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

  // Si estamos en la pantalla de Login, NO mostramos el menú lateral
  if (pathname === '/login') return null;

  // Pantalla de carga mientras verificamos la seguridad
  if (cargando) return <aside className="w-64 bg-blue-900 min-h-screen"></aside>;

  // Extraemos el rol. Si no definiste roles en Supabase, por defecto será 'Administrador'
  // Si tu correo tiene la palabra "super", lo marcamos visualmente como Superadmin
  const esSuperAdmin = usuario?.email?.toLowerCase().includes('super');
  const rolVisual = esSuperAdmin ? 'Superadmin' : 'Administrador';

  return (
    <aside className="w-64 bg-blue-900 text-white p-6 min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-8">Acuasoft Clone</h1>
      
      <nav className="space-y-2 flex-1">
        <Link href="/" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
          <DollarSign size={20} /> Resumen
        </Link>
        <Link href="/suscriptores" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/suscriptores' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
          <Users size={20} /> Suscriptores
        </Link>
        <Link href="/facturacion" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/facturacion' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
          <Settings size={20} /> Generar Mes
        </Link>
        <Link href="/facturas" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/facturas' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
          <FileText size={20} /> Historial Facturas
        </Link>
        <Link href="/recaudo" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/recaudo' ? 'bg-green-600 text-white font-bold shadow' : 'text-green-300 hover:bg-green-700 hover:text-white'}`}>
          <DollarSign size={20} /> Recaudo (Pagos)
        </Link>
        
        <div className="pt-4 mt-4 border-t border-blue-800">
          <p className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">Reportes</p>
          <Link href="/impresion-masiva" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/impresion-masiva' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
            <Printer size={20} /> Impresión Masiva
          </Link>
          <Link href="/cartera" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${pathname === '/cartera' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}>
            <Grid size={20} /> Cartera Anual
          </Link>
        </div>
      </nav>

      {/* --- SECCIÓN DE PERFIL Y CIERRE DE SESIÓN --- */}
      <div className="mt-auto pt-4 border-t border-blue-800">
        
        {/* Botón de configuración SOLO para Superadmin */}
        {esSuperAdmin && (
          <Link href="/configuracion" className={`flex items-center gap-3 p-3 mb-2 rounded-lg transition-colors ${pathname === '/configuracion' ? 'bg-gray-800 text-white' : 'text-blue-200 hover:bg-gray-800 hover:text-white'}`}>
            <Settings size={20} /> Configuración
          </Link>
        )}

        {/* Tarjeta del Usuario Logueado */}
        {usuario && (
          <div className="bg-blue-950 p-3 rounded-lg mb-2 flex items-center gap-3">
            <UserCircle size={36} className="text-blue-300" />
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

        {/* Botón Salir */}
        <button 
          onClick={cerrarSesion} 
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-red-300 hover:bg-red-500 hover:text-white transition-colors font-bold"
        >
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}