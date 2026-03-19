"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Printer, Search } from 'lucide-react';

export default function ImpresionMasiva() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [facturas, setFacturas] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    // Cargamos los datos globales del acueducto (Logo, NIT, etc.)
    const cargarConfig = async () => {
      const { data } = await supabase.from('acueductos').select('*').limit(1).single();
      if (data) setConfig(data);
    };
    cargarConfig();
  }, []);

  const buscarFacturas = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    
    // Buscamos todas las facturas de ese mes/año con los datos del suscriptor
    const { data } = await supabase
      .from('facturas')
      .select(`*, suscriptor:suscriptor_id (nombre_completo, documento, direccion)`)
      .eq('mes', mes)
      .eq('anio', anio);

    if (data) setFacturas(data);
    setBuscando(false);
  };

  const imprimirTodo = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-200 p-8">
      
      {/* Controles de Búsqueda (Se ocultan al imprimir gracias a print:hidden) */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-w-4xl mx-auto print:hidden">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Impresión Masiva por Lote</h2>
        <form onSubmit={buscarFacturas} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mes</label>
            <input type="number" min="1" max="12" value={mes} onChange={(e) => setMes(Number(e.target.value))} className="w-24 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Año</label>
            <input type="number" min="2020" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-32 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={buscando} className="bg-gray-800 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-black transition">
            <Search size={20} /> {buscando ? 'Buscando...' : 'Buscar Lote'}
          </button>
          
          {facturas.length > 0 && (
            <button type="button" onClick={imprimirTodo} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 font-bold ml-auto shadow-lg">
              <Printer size={20} /> Imprimir {facturas.length} Facturas
            </button>
          )}
        </form>
      </div>

      {/* Contenedor de Facturas */}
      <div className="max-w-2xl mx-auto space-y-8 print:space-y-0 print:max-w-none">
        {facturas.length === 0 && !buscando && (
          <p className="text-center text-gray-500 print:hidden">Selecciona un mes y año para cargar las facturas.</p>
        )}

        {/* Mapeamos e imprimimos cada factura */}
        {facturas.map((fac) => (
          <div key={fac.id} className="bg-white p-10 rounded shadow-xl print:shadow-none print:p-0 print:m-0 break-after-page relative overflow-hidden">
            
            {fac.estado === 'Pagado' && (
              <div className="absolute top-1/3 left-1/4 transform -rotate-45 text-green-500 opacity-20 text-8xl font-black uppercase pointer-events-none border-8 border-green-500 rounded-lg p-4">
                PAGADO
              </div>
            )}

            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-6 mb-6">
              <div className="flex items-center gap-4">
                {config?.logo_url && <img src={config.logo_url} alt="Logo" className="w-24 h-24 object-contain rounded" />}
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-800 uppercase tracking-wide">{config?.nombre}</h1>
                  <p className="text-gray-600 font-medium">NIT: {config?.nit}</p>
                </div>
              </div>
              <div className="text-right bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h2 className="text-xl font-bold text-blue-900 uppercase">Factura de Venta</h2>
                <p className="text-gray-800 font-mono mt-1 text-lg">N° {fac.id.substring(0, 6).toUpperCase()}</p>
              </div>
            </div>

            <div className="mb-8 bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Facturar a:</h3>
              <p className="text-lg font-bold text-gray-800">{fac.suscriptor.nombre_completo}</p>
              <p className="text-gray-600">CC/NIT: {fac.suscriptor.documento} | Predio: {fac.suscriptor.direccion}</p>
            </div>

            <table className="w-full text-left mb-8 border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-3 rounded-tl-lg">Descripción</th>
                  <th className="p-3 text-center">Período</th>
                  <th className="p-3 text-right rounded-tr-lg">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 text-gray-800">Servicio de Acueducto (Tarifa Fija)</td>
                  <td className="p-4 text-center text-gray-600">Mes {fac.mes} / {fac.anio}</td>
                  <td className="p-4 text-right text-gray-800">${Number(fac.monto).toLocaleString('es-CO')}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end mb-12">
              <div className="w-1/2 bg-gray-50 p-5 rounded-lg border border-gray-300">
                <div className="flex justify-between font-black text-2xl text-gray-800">
                  <span>TOTAL:</span>
                  <span className={fac.estado === 'Pagado' ? 'text-green-600' : 'text-red-600'}>
                    ${Number(fac.monto).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t-2 border-gray-200 pt-6 text-center text-gray-600 text-sm">
              <p className="font-medium italic">"{config?.mensaje_factura}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}