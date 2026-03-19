"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Eye, FileText } from 'lucide-react';

export default function ListaFacturas() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarFacturas = async () => {
      // Traemos las facturas y cruzamos los datos para saber el nombre y cédula del suscriptor
      const { data, error } = await supabase
        .from('facturas')
        .select(`
          id, mes, anio, monto, estado,
          suscriptor:suscriptor_id (nombre_completo, documento)
        `)
        .order('anio', { ascending: false })
        .order('mes', { ascending: false });

      if (data) setFacturas(data);
      setCargando(false);
    };

    cargarFacturas();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FileText className="text-blue-600" /> Historial de Facturas
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-gray-500">Cargando historial...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white text-sm">
                <th className="p-4">Suscriptor</th>
                <th className="p-4">Documento</th>
                <th className="p-4 text-center">Período</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((fac) => (
                <tr key={fac.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{fac.suscriptor?.nombre_completo}</td>
                  <td className="p-4 text-gray-600">{fac.suscriptor?.documento}</td>
                  <td className="p-4 text-center text-gray-600">{fac.mes} / {fac.anio}</td>
                  <td className="p-4 text-right font-bold text-gray-800">${Number(fac.monto).toLocaleString('es-CO')}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded text-xs font-bold ${fac.estado === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {fac.estado}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {/* Este botón nos lleva a la pantalla del PDF que creamos en el paso anterior */}
                    <Link 
                      href={`/factura/${fac.id}`} 
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-1 rounded"
                    >
                      <Eye size={16} /> Ver PDF
                    </Link>
                  </td>
                </tr>
              ))}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No hay facturas generadas aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}