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
    // (solo las columnas que se muestran, para que la respuesta pese menos)
    const { data } = await supabase
      .from('facturas')
      .select(`id, mes, anio, monto, estado, suscriptor:suscriptor_id (nombre, apellido, nuid, direccion)`)
      .eq('mes', mes)
      .eq('anio', anio);

    if (data) setFacturas(data);
    setBuscando(false);
  };

  const imprimirTodo = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-200 p-4 md:p-8">

      {/* Controles de Búsqueda (Se ocultan al imprimir gracias a print:hidden) */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-8 max-w-4xl mx-auto print:hidden">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Impresión Masiva por Lote</h2>
        <form onSubmit={buscarFacturas} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mes</label>
            <input type="number" min="1" max="12" value={mes} onChange={(e) => setMes(Number(e.target.value))} className="w-24 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black" style={{ color: '#000000' }} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Año</label>
            <input type="number" min="2020" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-32 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black" style={{ color: '#000000' }} />
          </div>
          <button type="submit" disabled={buscando} className="bg-gray-800 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-black transition">
            <Search size={20} /> {buscando ? 'Buscando...' : 'Buscar Lote'}
          </button>

          {facturas.length > 0 && (
            <button type="button" onClick={imprimirTodo} className="w-full sm:w-auto justify-center bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 font-bold sm:ml-auto shadow-lg">
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

        {/* Mapeamos e imprimimos cada factura: todo debe caber en 1 sola hoja */}
        {facturas.map((fac) => (
          <div key={fac.id} className="bg-white p-6 print:p-0 rounded shadow-xl print:shadow-none print:m-0 break-after-page relative overflow-hidden text-sm">

            {fac.estado === 'Pagado' && (
              <div className="absolute top-1/3 left-1/4 transform -rotate-45 text-green-500 opacity-20 text-7xl font-black uppercase pointer-events-none border-8 border-green-500 rounded-lg p-4">
                PAGADO
              </div>
            )}

            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-3 mb-3">
              <div className="flex items-center gap-3">
                {config?.logo_url && <img src={config.logo_url} alt="Logo" width={56} height={56} decoding="async" className="w-14 h-14 object-contain rounded" />}
                <div>
                  <h1 className="text-lg font-extrabold text-gray-800 uppercase tracking-wide">{config?.nombre}</h1>
                  <p className="text-gray-600 font-medium text-xs">NIT: {config?.nit}</p>
                </div>
              </div>
              <div className="text-right bg-blue-50 p-2 rounded-lg border border-blue-100">
                <h2 className="text-sm font-bold text-blue-900 uppercase">Factura de Venta</h2>
                <p className="text-gray-800 font-mono mt-1 text-sm">N° {fac.id.substring(0, 6).toUpperCase()}</p>
              </div>
            </div>

            <div className="mb-3 bg-gray-50 p-3 rounded border border-gray-200">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Facturar a:</h3>
              <p className="text-base font-bold text-gray-800">{fac.suscriptor.nombre} {fac.suscriptor.apellido}</p>
              <p className="text-gray-600 text-xs">NUID: {fac.suscriptor.nuid} | Predio: {fac.suscriptor.direccion}</p>
            </div>

            <table className="w-full text-left mb-3 border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-2 rounded-tl-lg text-xs">Descripción</th>
                  <th className="p-2 text-center text-xs">Período</th>
                  <th className="p-2 text-right rounded-tr-lg text-xs">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 text-gray-800">Servicio de Acueducto (Tarifa Fija)</td>
                  <td className="p-2 text-center text-gray-600">Mes {fac.mes} / {fac.anio}</td>
                  <td className="p-2 text-right text-gray-800">${Number(fac.monto).toLocaleString('es-CO')}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end mb-3">
              <div className="w-1/2 bg-gray-50 p-3 rounded-lg border border-gray-300">
                <div className="flex justify-between font-black text-lg text-gray-800">
                  <span>TOTAL:</span>
                  <span className={fac.estado === 'Pagado' ? 'text-green-600' : 'text-red-600'}>
                    ${Number(fac.monto).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-gray-200 pt-2 text-center text-gray-600 text-xs">
              <p className="font-medium italic">&quot;{config?.mensaje_factura}&quot;</p>
            </div>

            {/* --- LÍNEA DE CORTE --- */}
            <div className="relative flex items-center py-3 mt-2">
              <div className="grow border-t-2 border-dashed border-gray-400"></div>
              <span className="shrink-0 mx-3 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                Línea de corte
              </span>
              <div className="grow border-t-2 border-dashed border-gray-400"></div>
            </div>

            {/* --- DESPRENDIBLE DE PAGO --- */}
            <div className="border-2 border-gray-800 rounded-xl p-3 bg-white print:border-gray-500">
              <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">Desprendible de Pago</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Copia para el Acueducto</p>
                </div>
                <p className="font-extrabold text-gray-900 text-xs">Mes {fac.mes} / {fac.anio}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase">Suscriptor:</p>
                  <p className="font-extrabold text-gray-900">{fac.suscriptor.nombre} {fac.suscriptor.apellido}</p>
                  <p className="text-gray-600 text-[10px] font-bold mt-0.5">NUID: {fac.suscriptor.nuid || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] font-bold uppercase">N° Factura:</p>
                  <p className="font-mono font-bold text-gray-900">#{fac.id.substring(0, 6).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase">Estado:</p>
                  <p className={`font-black uppercase ${fac.estado === 'Pagado' ? 'text-green-600' : 'text-red-600'}`}>{fac.estado}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] font-bold uppercase">Total a Pagar:</p>
                  <p className="font-black text-lg text-blue-700 print:text-black">${Number(fac.monto).toLocaleString('es-CO')}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}