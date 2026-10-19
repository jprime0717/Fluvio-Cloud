"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { totalFactura } from '@/lib/facturas';
import { compararDirecciones } from '@/lib/direccion';
import { esSuperAdmin } from '@/lib/auth';
import Link from 'next/link';
import { Eye, FileText, Undo2 } from 'lucide-react';

export default function ListaFacturas() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [esAdminGlobal, setEsAdminGlobal] = useState(false);

  useEffect(() => {
    const verificarRol = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setEsAdminGlobal(esSuperAdmin(session?.user.email));
    };
    verificarRol();

    const cargarFacturas = async () => {
      // Traemos las facturas y cruzamos los datos para saber el nombre y cédula del suscriptor
      const { data } = await supabase
        .from('facturas')
        .select(`
          id, numero_factura, mes, anio, monto, reconexion, interes_mora, multa, matricula, estado,
          suscriptor:suscriptor_id (nombre, apellido, nuid, direccion)
        `);

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ordenadas = [...data].sort((a: any, b: any) => {
          const cmp = compararDirecciones(a.suscriptor?.direccion || '', b.suscriptor?.direccion || '');
          if (cmp !== 0) return cmp;
          if (a.anio !== b.anio) return b.anio - a.anio;
          return b.mes - a.mes;
        });
        setFacturas(ordenadas);
      }
      setCargando(false);
    };

    cargarFacturas();
  }, []);

  // Deshace un pago registrado por error en Recaudo: la factura vuelve a
  // Pendiente con todos sus datos, sin tener que borrarla y regenerarla.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anularPago = async (fac: any) => {
    if (!confirm(`¿Anular el pago de la factura ${fac.numero_factura} (${fac.mes}/${fac.anio}) de ${fac.suscriptor?.nombre} ${fac.suscriptor?.apellido}? Volverá a quedar Pendiente.`)) return;

    const { error } = await supabase
      .from('facturas')
      .update({ estado: 'Pendiente' })
      .eq('id', fac.id);

    if (error) {
      alert('Error al anular el pago: ' + error.message);
      return;
    }
    setFacturas(facturas.map(f => f.id === fac.id ? { ...f, estado: 'Pendiente' } : f));
  };

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
                <th className="p-4">N° Factura</th>
                <th className="p-4">Suscriptor</th>
                <th className="p-4">NUID</th>
                <th className="p-4 text-center">Período</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((fac) => (
                <tr key={fac.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-gray-800">{fac.numero_factura}</td>
                  <td className="p-4 font-medium text-gray-800">{fac.suscriptor?.nombre} {fac.suscriptor?.apellido}</td>
                  <td className="p-4 text-gray-600">{fac.suscriptor?.nuid}</td>
                  <td className="p-4 text-center text-gray-600">{fac.mes} / {fac.anio}</td>
                  <td className="p-4 text-right font-bold text-gray-800">${totalFactura(fac).toLocaleString('es-CO')}</td>
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
                    {esAdminGlobal && fac.estado === 'Pagado' && (
                      <button
                        onClick={() => anularPago(fac)}
                        className="ml-2 inline-flex items-center gap-1 text-red-600 hover:text-red-800 hover:underline bg-red-50 px-3 py-1 rounded cursor-pointer"
                      >
                        <Undo2 size={16} /> Anular pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No hay facturas generadas aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}