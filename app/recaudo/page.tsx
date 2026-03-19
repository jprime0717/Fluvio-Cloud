"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, CheckCircle, DollarSign } from 'lucide-react';

export default function Recaudo() {
  const [documento, setDocumento] = useState('');
  const [facturasPendientes, setFacturasPendientes] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // 1. Buscar facturas pendientes por documento
  const buscarFacturas = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    setMensaje('');
    setFacturasPendientes([]);

    // Primero buscamos al suscriptor por su documento
    const { data: suscriptor, error: errSub } = await supabase
      .from('suscriptores')
      .select('id, nombre_completo')
      .eq('documento', documento)
      .single();

    if (!suscriptor) {
      setMensaje('No se encontró ningún suscriptor con ese documento.');
      setBuscando(false);
      return;
    }

    // Luego buscamos sus facturas en estado "Pendiente"
    const { data: facturas, error: errFac } = await supabase
      .from('facturas')
      .select('*')
      .eq('suscriptor_id', suscriptor.id)
      .eq('estado', 'Pendiente')
      .order('anio', { ascending: true })
      .order('mes', { ascending: true });

    if (facturas && facturas.length > 0) {
      // Le agregamos el nombre del suscriptor a las facturas para mostrarlo
      const facturasConNombre = facturas.map(f => ({ ...f, nombre_completo: suscriptor.nombre_completo }));
      setFacturasPendientes(facturasConNombre);
    } else {
      setMensaje(`${suscriptor.nombre_completo} está al día. No tiene facturas pendientes.`);
    }

    setBuscando(false);
  };

  // 2. Marcar una factura como Pagada
  const registrarPago = async (facturaId: string) => {
    if (!confirm('¿Confirmas que recibiste el dinero y deseas marcar esta factura como PAGADA?')) return;

    const { error } = await supabase
      .from('facturas')
      .update({ estado: 'Pagado' })
      .eq('id', facturaId);

    if (!error) {
      // Quitamos la factura pagada de la lista visual
      setFacturasPendientes(facturasPendientes.filter(f => f.id !== facturaId));
      alert('Pago registrado con éxito.');
    } else {
      alert('Error al registrar el pago: ' + error.message);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
        <DollarSign className="text-green-600" /> Módulo de Recaudo
      </h2>

      {/* Buscador */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={buscarFacturas} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Buscar por Documento / Cédula del Suscriptor
            </label>
            <input
              type="text"
              required
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Ej: 1088000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={buscando}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2 font-bold"
          >
            <Search size={20} /> {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
        {mensaje && <p className="mt-4 text-blue-600 bg-blue-50 p-3 rounded">{mensaje}</p>}
      </div>

      {/* Resultados de Facturas Pendientes */}
      {facturasPendientes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-yellow-500">
          <div className="p-4 bg-yellow-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800">
              Facturas pendientes de: <span className="text-blue-600">{facturasPendientes[0].nombre_completo}</span>
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
              {facturasPendientes.length} Pendiente(s)
            </span>
          </div>
          
          <div className="p-0">
            {facturasPendientes.map((fac) => (
              <div key={fac.id} className="flex justify-between items-center p-6 border-b hover:bg-gray-50">
                <div>
                  <p className="font-bold text-gray-800 text-lg">Período: Mes {fac.mes} / Año {fac.anio}</p>
                  <p className="text-gray-500 text-sm mt-1">Total a pagar: <strong className="text-gray-800">${Number(fac.monto).toLocaleString('es-CO')}</strong></p>
                </div>
                <button
                  onClick={() => registrarPago(fac.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <CheckCircle size={18} /> Recibir Pago
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}