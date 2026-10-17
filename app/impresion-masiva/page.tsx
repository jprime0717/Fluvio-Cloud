"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { totalFactura, cuentaEnDeuda } from '@/lib/facturas';
import { compararDirecciones } from '@/lib/direccion';
import { Printer, Search } from 'lucide-react';
import HojaMediaCarta from '@/components/HojaMediaCarta';
import FacturaMediaCarta from '@/components/FacturaMediaCarta';

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
      .select(`id, numero_factura, mes, anio, monto, reconexion, interes_mora, multa, matricula, cobro_meses_anteriores, estado, suscriptor_id, suscriptor:suscriptor_id (nombre, apellido, nuid, numero_medidor, direccion)`)
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
            Se imprime una factura por hoja media carta (21.6 x 14 cm). En el diálogo de impresión deja
            la escala en &quot;Predeterminada&quot; y los márgenes en &quot;Predeterminados&quot;; si la impresora
            no toma el papel sola, elige el tamaño &quot;Statement&quot; o &quot;Media carta&quot; (5.5 x 8.5 in).
          </p>
        )}
      </div>

      {/* Contenedor de Facturas */}
      <div className="space-y-8 print:space-y-0">
        {facturas.length === 0 && !buscando && (
          <p className="text-center text-gray-500 print:hidden">Selecciona un mes y año para cargar las facturas.</p>
        )}

        {/* Una factura por hoja media carta. Si una factura no cabe entera
            (muchos recargos), HojaMediaCarta la encoge para que siga
            ocupando una sola hoja. */}
        {facturas.map((fac) => {
          // Deuda acumulada real (todas sus facturas Pendiente hasta este
          // período). Si no hay registro, solo cuenta la propia factura.
          const infoDeuda = deudaPorSuscriptor.get(fac.suscriptor_id);
          const deudaTotal = infoDeuda?.total ?? (fac.estado === 'Pendiente' ? totalFactura(fac) : 0);
          const mesesMora = infoDeuda?.cantidad ?? (fac.estado === 'Pendiente' ? 1 : 0);

          return (
            <HojaMediaCarta key={fac.id} dependencias={[fac, config, deudaTotal, mesesMora]}>
              <FacturaMediaCarta fac={fac} config={config} deudaTotal={deudaTotal} mesesMora={mesesMora} />
            </HojaMediaCarta>
          );
        })}
      </div>
    </div>
  );
}
