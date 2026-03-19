"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function HistorialCartera() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [suscriptores, setSuscriptores] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Envolvemos la función en useCallback. Esto le dice a Next.js que es seguro usarla.
  const cargarMatriz = useCallback(async () => {
    setCargando(true);

    // 1. Traemos todos los suscriptores
    const { data: subs } = await supabase.from('suscriptores').select('id, nombre_completo').order('nombre_completo');
    if (subs) setSuscriptores(subs);

    // 2. Traemos todas las facturas de ese año
    const { data: facs } = await supabase.from('facturas').select('suscriptor_id, mes, estado').eq('anio', anio);
    if (facs) setFacturas(facs);

    setCargando(false);
  }, [anio]); // Le decimos que dependemos de "anio"

  // Cargar por defecto al entrar a la página
  useEffect(() => {
    cargarMatriz();
  }, [cargarMatriz]);

  // Esta función maneja el clic en el botón "Ver Matriz"
  const manejarBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    cargarMatriz();
  };

  // Función para buscar el estado de un mes específico para un usuario específico
  const obtenerEstadoMes = (suscriptorId: string, numeroMes: number) => {
    const factura = facturas.find(f => f.suscriptor_id === suscriptorId && f.mes === numeroMes);
    if (!factura) return 'No Generada';
    return factura.estado;
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Historial de Cartera (Matriz Anual)</h2>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex items-center justify-between">
        {/* Cambiamos el onSubmit a la nueva función */}
        <form onSubmit={manejarBusqueda} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Año de Consulta</label>
            <input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-32 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" />
          </div>
          <button type="submit" disabled={cargando} className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition font-bold h-11">
            <Search size={20} /> {cargando ? 'Calculando...' : 'Ver Matriz'}
          </button>
        </form>

        <div className="flex gap-4 text-sm font-medium border p-3 rounded-lg bg-gray-50">
          <span className="flex items-center gap-1 text-green-600"><CheckCircle size={16}/> Pagado</span>
          <span className="flex items-center gap-1 text-red-600"><XCircle size={16}/> Pendiente (Mora)</span>
          <span className="flex items-center gap-1 text-gray-400"><MinusCircle size={16}/> No facturado</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto border border-gray-200">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-800 text-white text-sm">
              <th className="p-4 border-r border-gray-700 sticky left-0 bg-gray-900 z-10">Suscriptor</th>
              {MESES.map((mes, idx) => (
                <th key={idx} className="p-4 text-center border-r border-gray-700 w-16">{mes}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suscriptores.map((sub, index) => (
              <tr key={sub.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-4 font-bold text-gray-800 border-r border-gray-200 sticky left-0 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 truncate max-w-50">
                  {sub.nombre_completo}
                </td>
                
                {/* Columnas de los 12 meses */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((numeroMes) => {
                  const estado = obtenerEstadoMes(sub.id, numeroMes);
                  return (
                    <td key={numeroMes} className="p-4 border-r border-gray-200 text-center">
                      <div className="flex justify-center">
                        {estado === 'Pagado' && <CheckCircle className="text-green-500" size={24} />}
                        {estado === 'Pendiente' && <XCircle className="text-red-500" size={24} />}
                        {estado === 'No Generada' && <MinusCircle className="text-gray-300" size={20} />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {suscriptores.length === 0 && !cargando && (
              <tr>
                <td colSpan={13} className="p-8 text-center text-gray-500">No hay suscriptores registrados.</td>
              </tr>
            )}
            {cargando && (
              <tr>
                <td colSpan={13} className="p-8 text-center text-gray-500">Cargando matriz...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}