"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save } from 'lucide-react';
// PASO A: Importamos useRouter
import { useRouter } from 'next/navigation';

export default function ConfiguracionGlobal() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  // PASO B: Inicializamos el router para poder redireccionar
  const router = useRouter();

  useEffect(() => {
    const cargarConfiguracion = async () => {
      // --- PASO C: EL CANDADO DE SEGURIDAD ---
      const { data: { session } } = await supabase.auth.getSession();
      
      // Si no hay sesión o el correo NO tiene la palabra "super", lo sacamos de aquí
      if (!session || !session.user.email?.toLowerCase().includes('super')) {
        router.push('/'); // Lo enviamos a la página de inicio (Resumen)
        return; // Detenemos la ejecución del código para que no cargue nada más
      }
      // ----------------------------------------

      // Si pasa la seguridad (es superadmin), cargamos los datos normalmente:
      const { data } = await supabase
        .from('acueductos')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setConfig(data);
      } else {
        setConfig({
          nombre: 'Mi Acueducto Veredal',
          nit: '900.000.000-1',
          email: 'contacto@miacueducto.com',
          telefono: '300 000 0000',
          direccion: 'Vereda Central, Lote 4',
          tarifa_fija: 15000,
          logo_url: 'https://via.placeholder.com/150x50?text=Logo+Acueducto',
          mensaje_factura: 'Por favor realice su pago antes de fin de mes.'
        });
      }
      setCargando(false);
    };

    cargarConfiguracion();
  }, [router]);

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');

    if (config.id) {
      const { error } = await supabase
        .from('acueductos')
        .update({
          nombre: config.nombre,
          nit: config.nit,
          email: config.email,
          telefono: config.telefono,
          direccion: config.direccion,
          tarifa_fija: config.tarifa_fija,
          logo_url: config.logo_url,
          mensaje_factura: config.mensaje_factura
        })
        .eq('id', config.id);

      if (error) setMensaje('Error al guardar: ' + error.message);
      else setMensaje('¡Configuración guardada exitosamente!');
    } else {
       const { error } = await supabase.from('acueductos').insert([config]);
       if (error) setMensaje('Error al guardar: ' + error.message);
       else setMensaje('¡Configuración creada exitosamente!');
    }
    
    setGuardando(false);
  };

  if (cargando) return <div className="p-8 text-center text-gray-500">Verificando permisos y cargando configuración...</div>;
  if (!config) return null; // Previene errores si config es null después de cargar

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <Settings size={32} className="text-gray-700" />
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Configuración Global</h2>
          <p className="text-gray-500">Administra la información de tu acueducto</p>
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 mb-6 rounded shadow ${mensaje.includes('Error') ? 'bg-red-100 text-red-800 border-l-4 border-red-500' : 'bg-green-100 text-green-800 border-l-4 border-green-500'}`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={guardarCambios} className="bg-white p-8 rounded-xl shadow-md space-y-6">
        
        {/* Sección 1: Datos Principales */}
        <div>
          <h3 className="text-lg font-bold text-gray-700 border-b pb-2 mb-4">Datos Principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nombre del Acueducto</label>
              <input type="text" required value={config.nombre} onChange={(e) => setConfig({...config, nombre: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">NIT / RUT</label>
              <input type="text" required value={config.nit} onChange={(e) => setConfig({...config, nit: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Tarifa Fija Mensual ($)</label>
              <input type="number" required value={config.tarifa_fija} onChange={(e) => setConfig({...config, tarifa_fija: Number(e.target.value)})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Sección 2: Contacto e Imagen */}
        <div>
          <h3 className="text-lg font-bold text-gray-700 border-b pb-2 mb-4 mt-8">Contacto e Imagen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Teléfono</label>
              <input type="text" value={config.telefono} onChange={(e) => setConfig({...config, telefono: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Correo Electrónico</label>
              <input type="email" value={config.email} onChange={(e) => setConfig({...config, email: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Dirección Física</label>
              <input type="text" value={config.direccion} onChange={(e) => setConfig({...config, direccion: e.target.value})} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 mb-1">URL del Logo (Link de la imagen)</label>
              <input type="text" value={config.logo_url} onChange={(e) => setConfig({...config, logo_url: e.target.value})} placeholder="https://ejemplo.com/logo.png" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" />
              {config.logo_url && (
                <div className="mt-2 p-2 bg-gray-50 border rounded inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.logo_url} alt="Vista previa del logo" className="h-12 object-contain" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150x50?text=Error+en+URL')} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección 3: Factura */}
        <div>
          <h3 className="text-lg font-bold text-gray-700 border-b pb-2 mb-4 mt-8">Personalización de Factura</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Mensaje al pie de la factura</label>
            <textarea value={config.mensaje_factura} onChange={(e) => setConfig({...config, mensaje_factura: e.target.value})} rows={3} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t mt-8">
          <button type="submit" disabled={guardando} className="flex items-center gap-2 bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-black font-bold shadow-lg disabled:bg-gray-400">
            <Save size={20} /> {guardando ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>

      </form>
    </div>
  );
}