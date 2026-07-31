"use client";

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { totalFactura } from '@/lib/facturas';
import { Printer, Search, Scissors } from 'lucide-react';

// Alto útil de una hoja carta con el margen definido en @page (globals.css:
// letter portrait, margen 10mm). 96px = 1in por convención CSS, tanto en
// pantalla como al imprimir.
const ALTO_HOJA_PX = ((279.4 - 20) / 25.4) * 96;

export default function ImpresionMasiva() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [facturas, setFacturas] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const gruposRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [escalas, setEscalas] = useState<Record<number, number>>({});

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
      .select(`id, numero_factura, mes, anio, monto, reconexion, interes_mora, multa, matricula, cobro_meses_anteriores, estado, suscriptor:suscriptor_id (nombre, apellido, nuid, direccion)`)
      .eq('mes', mes)
      .eq('anio', anio);

    // Ordenamos de menor a mayor por número de factura (numérico, no alfabético,
    // para que 10266 no quede antes que 9999 como pasaría con orden de texto).
    if (data) {
      data.sort((a, b) => Number(a.numero_factura) - Number(b.numero_factura));
      setFacturas(data);
    }
    setBuscando(false);
  };

  const imprimirTodo = () => {
    window.print();
  };

  // Agrupamos de a 2 facturas: cada grupo comparte una sola hoja carta al imprimir
  const paginas: typeof facturas[] = [];
  for (let i = 0; i < facturas.length; i += 2) {
    paginas.push(facturas.slice(i, i + 2));
  }

  // Si un grupo de 2 facturas (con recargos: reconexión, mora, multa, cobro de
  // meses anteriores) queda más alto que una hoja carta, lo encogemos justo lo
  // necesario para que las 2 facturas sigan cabiendo en una sola hoja en vez de
  // que la segunda se corra a una página aparte. Recalculamos también cuando
  // llega "config" (logo/mensaje del pie), porque ese dato puede llegar
  // después de las facturas y cambiar la altura real de cada tarjeta.
  useLayoutEffect(() => {
    const nuevasEscalas: Record<number, number> = {};
    paginas.forEach((_, idx) => {
      const el = gruposRefs.current[idx];
      if (!el) return;
      const alto = el.scrollHeight;
      nuevasEscalas[idx] = alto > ALTO_HOJA_PX ? ALTO_HOJA_PX / alto : 1;
    });
    setEscalas(nuevasEscalas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facturas, config]);

  return (
    <div className="min-h-screen bg-gray-200 p-4 md:p-8 print:p-0">

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
        {facturas.length > 0 && (
          <p className="text-xs text-gray-500 mt-3">
            Antes de imprimir, en el diálogo de impresión abre &quot;Más opciones&quot; y desactiva
            &quot;Encabezados y pies de página&quot; para que no salga la URL/IP ni la fecha en los bordes de la hoja.
          </p>
        )}
      </div>

      {/* Contenedor de Facturas */}
      <div className="max-w-2xl mx-auto space-y-8 print:space-y-0 print:max-w-none">
        {facturas.length === 0 && !buscando && (
          <p className="text-center text-gray-500 print:hidden">Selecciona un mes y año para cargar las facturas.</p>
        )}

        {/* Agrupamos de a 2: cada grupo es una hoja carta completa al imprimir.
            Si el grupo no cabe entero en una hoja (muchos recargos), el
            useLayoutEffect de arriba lo encoge (escalas[idx] < 1) para que
            las 2 facturas sigan compartiendo la misma hoja. */}
        {paginas.map((pagina, idxPagina) => {
          const escala = escalas[idxPagina] ?? 1;
          const altoMedido = gruposRefs.current[idxPagina]?.scrollHeight;
          return (
          <div
            key={idxPagina}
            className={idxPagina < paginas.length - 1 ? 'print:break-after-page' : ''}
            style={escala < 1 && altoMedido ? { height: altoMedido * escala } : undefined}
          >
            <div
              ref={(el) => { gruposRefs.current[idxPagina] = el; }}
              className="space-y-3"
              // Usamos "zoom" y no "transform: scale" porque los motores de
              // impresión de los navegadores (Chrome incluido) no reducen el
              // espacio que ocupa un elemento transformado a la hora de
              // paginar: el contenido se ve chico pero sigue "empujando" a
              // la siguiente hoja como si tuviera su tamaño original. "zoom"
              // sí reduce el tamaño real que ocupa en el flujo del documento.
              style={escala < 1 ? { zoom: escala } : undefined}
            >
            {pagina.map((fac, idxFactura) => (
              <div key={fac.id}>
                {/* Línea de corte entre las dos facturas de la misma hoja */}
                {idxFactura === 1 && (
                  <div className="relative flex items-center py-2 print:py-2">
                    <div className="grow border-t-4 border-dashed border-gray-700"></div>
                    <span className="shrink-0 mx-3 text-[11px] uppercase font-bold tracking-widest text-gray-700 flex items-center gap-1">
                      <Scissors size={16} className="rotate-90 text-gray-700" /> Línea de corte
                    </span>
                    <div className="grow border-t-4 border-dashed border-gray-700"></div>
                  </div>
                )}

                <div className="factura-print bg-white p-2 rounded shadow-xl print:shadow-none print:break-inside-avoid relative overflow-hidden text-sm">

                  {fac.estado === 'Pagado' && (
                    <div className="absolute top-1/3 left-1/4 transform -rotate-45 text-green-500 opacity-20 text-6xl font-black uppercase pointer-events-none border-8 border-green-500 rounded-lg p-4">
                      PAGADO
                    </div>
                  )}

                  <div className="flex justify-between items-start border-b-2 border-blue-900 pb-2 mb-2">
                    <div className="flex items-center gap-3">
                      {config?.logo_url && <img src={config.logo_url} alt="Logo" width={44} height={44} decoding="async" className="w-11 h-11 object-contain rounded" />}
                      <div>
                        <h1 className="text-lg font-extrabold text-gray-900 uppercase tracking-wide">{config?.nombre}</h1>
                        <p className="text-gray-800 font-medium text-xs">NIT: {config?.nit}</p>
                      </div>
                    </div>
                    <div className="text-right bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <h2 className="text-sm font-bold text-blue-900 uppercase">Factura de Venta</h2>
                      <p className="text-gray-900 font-mono mt-1 text-sm">N° {fac.numero_factura}</p>
                    </div>
                  </div>

                  <div className="mb-2 bg-gray-50 p-2 rounded border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-700 uppercase mb-1">Facturar a:</h3>
                    <p className="text-base font-bold text-gray-900 truncate">{fac.suscriptor.nombre} {fac.suscriptor.apellido}</p>
                    <p className="text-black font-bold text-xs truncate">NUID: {fac.suscriptor.nuid}</p>
                    {/* DIRECCIÓN RESALTADA: dato clave para quien reparte la factura */}
                    <p className="mt-1 bg-blue-50 border-2 border-blue-300 rounded px-1.5 py-1 text-black font-black text-xs leading-snug">
                      <span className="text-blue-900 font-black uppercase">Predio: </span>
                      {fac.suscriptor.direccion}
                    </p>
                  </div>

                  <table className="w-full text-left mb-2 border-collapse">
                    <thead>
                      <tr className="bg-blue-900 text-white print:bg-white print:border-b-2 print:border-black">
                        <th className="p-1.5 rounded-tl-lg text-xs">Descripción</th>
                        <th className="p-1.5 text-center text-xs">Período</th>
                        <th className="p-1.5 text-right rounded-tr-lg text-xs">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-1.5 text-black font-bold">Servicio de Acueducto (Tarifa Fija)</td>
                        <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
                        <td className="p-1.5 text-right text-gray-900">${Number(fac.monto).toLocaleString('es-CO')}</td>
                      </tr>
                      {Number(fac.reconexion) > 0 && (
                        <tr className="border-b">
                          <td className="p-1.5 text-black font-bold">Reconexión</td>
                          <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
                          <td className="p-1.5 text-right text-gray-900">${Number(fac.reconexion).toLocaleString('es-CO')}</td>
                        </tr>
                      )}
                      {Number(fac.interes_mora) > 0 && (
                        <tr className="border-b">
                          <td className="p-1.5 text-black font-bold">Intereses de Mora</td>
                          <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
                          <td className="p-1.5 text-right text-gray-900">${Number(fac.interes_mora).toLocaleString('es-CO')}</td>
                        </tr>
                      )}
                      {Number(fac.multa) > 0 && (
                        <tr className="border-b">
                          <td className="p-1.5 text-black font-bold">Multa</td>
                          <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
                          <td className="p-1.5 text-right text-gray-900">${Number(fac.multa).toLocaleString('es-CO')}</td>
                        </tr>
                      )}
                      {Number(fac.matricula) > 0 && (
                        <tr className="border-b">
                          <td className="p-1.5 text-black font-bold">Matrícula</td>
                          <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
                          <td className="p-1.5 text-right text-gray-900">${Number(fac.matricula).toLocaleString('es-CO')}</td>
                        </tr>
                      )}
                      {Number(fac.cobro_meses_anteriores) > 0 && (
                        <tr className="border-b">
                          <td className="p-1.5 text-black font-bold">Meses en Deuda</td>
                          <td className="p-1.5 text-center text-black font-semibold">
                            {Math.round(Number(fac.cobro_meses_anteriores))}
                          </td>
                          <td className="p-1.5 text-right text-gray-700 italic">—</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="flex justify-end mb-2">
                    <div className="w-1/2 bg-gray-50 p-2 rounded-lg border border-gray-300">
                      <div className="flex justify-between font-black text-lg text-gray-900">
                        <span>TOTAL:</span>
                        <span className={fac.estado === 'Pagado' ? 'text-green-700' : 'text-red-700'}>
                          ${totalFactura(fac).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-300 pt-1.5 text-center text-gray-800 text-xs">
                    <p className="font-medium italic">&quot;{config?.mensaje_factura}&quot;</p>
                  </div>

                  {/* --- LÍNEA DE CORTE (desprendible) --- */}
                  <div className="relative flex items-center py-2 mt-1.5">
                    <div className="grow border-t-4 border-dashed border-gray-700"></div>
                    <span className="shrink-0 mx-3 text-[11px] uppercase font-bold tracking-widest text-gray-700">
                      Línea de corte
                    </span>
                    <div className="grow border-t-4 border-dashed border-gray-700"></div>
                  </div>

                  {/* --- DESPRENDIBLE DE PAGO --- */}
                  <div className="border-2 border-gray-800 rounded-xl p-2 bg-white print:border-gray-700">
                    <div className="flex justify-between items-center border-b border-gray-300 pb-1.5 mb-1.5">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Desprendible de Pago</h3>
                        <p className="text-[10px] font-bold text-gray-700 uppercase">Copia para el Acueducto</p>
                      </div>
                      <p className="font-extrabold text-gray-900 text-xs">Mes {fac.mes} / {fac.anio}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-700 font-bold uppercase">Suscriptor:</p>
                        <p className="font-extrabold text-gray-900 truncate">{fac.suscriptor.nombre} {fac.suscriptor.apellido}</p>
                        <p className="text-gray-800 font-bold mt-0.5 truncate">NUID: {fac.suscriptor.nuid || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-700 font-bold uppercase">N° Factura:</p>
                        <p className="font-mono font-bold text-gray-900">#{fac.numero_factura}</p>
                      </div>
                      <div>
                        <p className="text-gray-700 font-bold uppercase">Estado:</p>
                        <p className={`font-black uppercase ${fac.estado === 'Pagado' ? 'text-green-700' : 'text-red-700'}`}>{fac.estado}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-700 font-bold uppercase">Total a Pagar:</p>
                        <p className="font-black text-base text-blue-800 print:text-black">${totalFactura(fac).toLocaleString('es-CO')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
