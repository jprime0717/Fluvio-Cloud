"use client";

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { totalFactura, cuentaEnDeuda } from '@/lib/facturas';
import { compararDirecciones } from '@/lib/direccion';
import { Printer, Search, Scissors } from 'lucide-react';
import FacturaImpresa from '@/components/FacturaImpresa';

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
  // Deuda acumulada real por suscriptor (suma de sus facturas en estado
  // Pendiente hasta el período impreso). Se recalcula en cada búsqueda
  // a partir del estado real de la base de datos, igual que en la vista de
  // una factura individual, así que nunca duplica un cobro: en cuanto una
  // factura vieja se marca Pagada, deja de sumar aquí automáticamente.
  const [deudaPorSuscriptor, setDeudaPorSuscriptor] = useState<Map<string, { total: number; cantidad: number }>>(new Map());
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
      .select(`id, numero_factura, mes, anio, monto, reconexion, interes_mora, multa, matricula, cobro_meses_anteriores, estado, suscriptor_id, suscriptor:suscriptor_id (nombre, apellido, nuid, direccion)`)
      .eq('mes', mes)
      .eq('anio', anio);

    // Ordenamos por dirección (Mz A, Mz B, Mz C... y dentro de cada manzana
    // por número de casa) para que salgan en orden al repartirlas.
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.sort((a: any, b: any) => compararDirecciones(a.suscriptor?.direccion || '', b.suscriptor?.direccion || ''));
      setFacturas(data);

      // Traemos, en una sola consulta, las facturas Pendiente de los
      // suscriptores de este lote hasta el período impreso (los meses
      // posteriores no son saldo anterior) para sumar su deuda acumulada real.
      const idsSuscriptores = [...new Set(data.map((f) => f.suscriptor_id))];
      const nuevaDeuda = new Map<string, { total: number; cantidad: number }>();
      if (idsSuscriptores.length > 0) {
        const { data: pendientes } = await supabase
          .from('facturas')
          .select('suscriptor_id, mes, anio, monto, reconexion, interes_mora, multa, matricula')
          .in('suscriptor_id', idsSuscriptores)
          .eq('estado', 'Pendiente');

        (pendientes || []).filter((p) => cuentaEnDeuda(p, mes, anio)).forEach((p) => {
          const actual = nuevaDeuda.get(p.suscriptor_id) || { total: 0, cantidad: 0 };
          nuevaDeuda.set(p.suscriptor_id, {
            total: actual.total + totalFactura(p),
            cantidad: actual.cantidad + 1,
          });
        });
      }
      setDeudaPorSuscriptor(nuevaDeuda);
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
  }, [facturas, config, deudaPorSuscriptor]);

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
            {pagina.map((fac, idxFactura) => {
              // Deuda acumulada real (todas sus facturas Pendiente que cuentan
              // como saldo de este período), igual que en la vista individual.
              const infoDeuda = deudaPorSuscriptor.get(fac.suscriptor_id);
              const totalFacturaActual = totalFactura(fac);
              const deudaTotal = infoDeuda?.total ?? (fac.estado === 'Pendiente' ? totalFacturaActual : 0);
              const mesesMora = infoDeuda?.cantidad ?? (fac.estado === 'Pendiente' ? 1 : 0);

              return (
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

                <FacturaImpresa fac={fac} config={config} deudaTotal={deudaTotal} mesesMora={mesesMora} />
              </div>
              );
            })}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
