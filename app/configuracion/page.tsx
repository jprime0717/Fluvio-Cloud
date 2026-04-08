"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConfiguracionGlobal() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const cargarConfiguracion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user.email?.toLowerCase().includes('super')) {
        router.push('/'); 
        return; 
      }

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
          tarifa_comercial_extra: 5000,   // <-- NUEVO VALOR POR DEFECTO
          tarifa_industrial_extra: 10000, // <-- NUEVO VALOR POR DEFECTO
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
          tarifa_comercial_extra: config.tarifa_comercial_extra,   // <-- ENVIAR A SUPABASE
          tarifa_industrial_extra: config.tarifa_industrial_extra, // <-- ENVIAR A SUPABASE
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

  if (cargando) return <div className="p-8 text-center text-gray-500 font-medium">Verificando permisos y cargando configuración...</div>;
  if (!config) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <Settings size={32} className="text-gray-900" />
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Configuración Global</h2>
          <p className="text-gray-600 font-medium">Administra la información de tu acueducto</p>
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 mb-6 rounded shadow font-bold ${mensaje.includes('Error') ? 'bg-red-100 text-red-900 border-l-4 border-red-500' : 'bg-green-100 text-green-900 border-l-4 border-green-500'}`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={guardarCambios} className="bg-white p-6 md:p-8 rounded-xl shadow-md space-y-6 border border-gray-200">
        
        {/* Sección 1: Datos Principales */}
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 border-b pb-2 mb-4">Datos Principales y Tarifas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Nombre del Acueducto</label>
              <input type="text" required value={config.nombre} onChange={(e) => setConfig({...config, nombre: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black dark:text-black font-medium" style={{ color: '#000000' }} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">NIT / RUT</label>
              <input type="text" required value={config.nit} onChange={(e) => setConfig({...config, nit: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black dark:text-black font-medium" style={{ color: '#000000' }} />
            </div>
            
            {/* --- NUEVAS TARIFAS AQUÍ --- */}
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-1">Tarifa Fija Mensual (Residencial)</label>
              <input type="number" required value={config.tarifa_fija} onChange={(e) => setConfig({...config, tarifa_fija: Number(e.target.value)})} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black dark:text-black font-bold text-lg" style={{ color: '#000000' }} />
            </div>
            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <label className="block text-sm font-bold text-blue-900 mb-1">Valor Adicional Comercial (+)</label>
              <input type="number" required value={config.tarifa_comercial_extra} onChange={(e) => setConfig({...config, tarifa_comercial_extra: Number(e.target.value)})} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black dark:text-black font-bold text-lg" style={{ color: '#000000' }} />
            </div>
            <div className="bg-purple-50 p-3 rounded border border-purple-100">
              <label className="block text-sm font-bold text-purple-900 mb-1">Valor Adicional Industrial (+)</label>
              <input type="number" required value={config.tarifa_industrial_extra} onChange={(e) => setConfig({...config, tarifa_industrial_extra: Number(e.target.value)})} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black dark:text-black font-bold text-lg" style={{ color: '#000000' }} />
            </div>
          </div>
        </div>

        {/* Sección 2: Contacto e Imagen */}
        <div>
          <h3 className="text-lg font-extrabold text-gray-900 border-b pb-2 mb-4 mt-8">Contacto e Imagen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Teléfono</label>
              <input type="text" value={config.telefono} onChange={(e) => setConfig({...config, telefono: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black dark:text-black font-medium" style={{ color: '#000000' }} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">Correo Electrónico</label>
              <input type="email" value={config.email} onChange={(e) => setConfig({...config, email: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black dark:text-black font-medium" style={{ color: '#000000' }} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-1">Dirección Física</label>
              <input type="text" value={config.direccion} onChange={(e) => setConfig({...config, direccion: e.target.value})} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black dark:text-black font-medium" style={{ color: '#000000' }} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-1">URL del Logo (Link de la imagen)</label>
              <input type="text" value={config.logo_url} onChange={(e) => setConfig({...config, logo_url: e.target.value})} placeholder="https://ejemplo.com/logo.png" className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm bg-white text-black dark:text-black" style={{ color: '#000000' }} />
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
          <h3 className="text-lg font-extrabold text-gray-900 border-b pb-2 mb-4 mt-8">Personalización de Factura</h3>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1">Mensaje al pie de la factura</label>
            <textarea value={config.mensaje_factura} onChange={(e) => setConfig({...config, mensaje_factura: e.target.value})} rows={3} className="w-full border border-gray-300 p-2.5 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black dark:text-black font-medium" style={{ color: '#000000' }}></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t mt-8">
          <button type="submit" disabled={guardando} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg disabled:bg-gray-400 transition-colors">
            <Save size={20} /> {guardando ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>

      </form>
    </div>
  );
}