"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, CheckCircle } from 'lucide-react';

export default function Facturacion() {
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  // Parámetros por defecto para este ejemplo (luego vendrán de la base de datos)
  const TARIFA_FIJA = 15000; 
  const MES_ACTUAL = new Date().getMonth() + 1; // 1 = Enero, 3 = Marzo
  const ANIO_ACTUAL = new Date().getFullYear();

  const generarFacturacionMasiva = async () => {
    if (!confirm(`¿Estás seguro de generar la facturación para el mes ${MES_ACTUAL}/${ANIO_ACTUAL}?`)) return;
    
    setGenerando(true);
    setMensaje('Buscando suscriptores...');

    // 1. Obtenemos todos los suscriptores activos
    const { data: suscriptores, error: errSub } = await supabase
      .from('suscriptores')
      .select('id');

    if (errSub || !suscriptores) {
      setMensaje('Error al buscar suscriptores: ' + errSub?.message);
      setGenerando(false);
      return;
    }

    if (suscriptores.length === 0) {
      setMensaje('No hay suscriptores registrados para facturar.');
      setGenerando(false);
      return;
    }

    setMensaje(`Generando ${suscriptores.length} facturas...`);

    // 2. Preparamos el bloque de datos masivo (100 facturas de golpe)
    const nuevasFacturas = suscriptores.map((sub) => ({
      suscriptor_id: sub.id,
      mes: MES_ACTUAL,
      anio: ANIO_ACTUAL,
      monto: TARIFA_FIJA,
      estado: 'Pendiente'
    }));

    // 3. Insertamos todas las facturas a la base de datos en una sola operación
    const { error: errFac } = await supabase
      .from('facturas')
      .insert(nuevasFacturas);

    if (errFac) {
      setMensaje('Error al generar facturas: ' + errFac.message);
    } else {
      setMensaje(`¡Éxito! Se generaron ${suscriptores.length} facturas correctamente.`);
    }

    setGenerando(false);
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Facturación Mensual</h2>

      <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto text-center border-t-4 border-blue-600">
        <div className="flex justify-center mb-6 text-blue-600">
          <FileText size={64} />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Período de Facturación</h3>
        <p className="text-gray-500 mb-8">
          Mes: <strong className="text-gray-800">{MES_ACTUAL}</strong> | Año: <strong className="text-gray-800">{ANIO_ACTUAL}</strong>
        </p>

        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-8 text-left text-sm">
          <strong>¿Qué hace este botón?</strong>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Busca a todos los suscriptores registrados en la base de datos.</li>
            <li>Le asigna a cada uno una factura por el valor de la tarifa fija (${TARIFA_FIJA}).</li>
            <li>Guarda el registro en el historial para control de pagos.</li>
          </ul>
        </div>

        <button
          onClick={generarFacturacionMasiva}
          disabled={generando}
          className="w-full text-lg bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-lg"
        >
          {generando ? 'Procesando en la nube...' : `Generar Facturas de ${MES_ACTUAL}/${ANIO_ACTUAL}`}
        </button>

        {/* Mensaje de éxito o error */}
        {mensaje && (
          <div className={`mt-6 p-4 rounded flex items-center justify-center gap-2 ${mensaje.includes('Éxito') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {mensaje.includes('Éxito') && <CheckCircle size={20} />}
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}