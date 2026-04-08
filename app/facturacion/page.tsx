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

    setMensaje('Verificando facturas existentes...');

    // 2. NUEVO PASO: Buscamos las facturas que YA se generaron este mes y año
    const { data: facturasExistentes, error: errFacExist } = await supabase
      .from('facturas')
      .select('suscriptor_id')
      .eq('mes', MES_ACTUAL)
      .eq('anio', ANIO_ACTUAL);

    if (errFacExist) {
      setMensaje('Error al verificar facturas previas: ' + errFacExist.message);
      setGenerando(false);
      return;
    }

    // Extraemos los IDs de los suscriptores que ya tienen factura
    const idsConFactura = facturasExistentes.map(f => f.suscriptor_id);

    // 3. NUEVO PASO: Filtramos para quedarnos SOLO con los que NO tienen factura
    const suscriptoresSinFactura = suscriptores.filter(
      (sub) => !idsConFactura.includes(sub.id)
    );

    // Si la lista quedó vacía, es porque todos tienen ya su factura
    if (suscriptoresSinFactura.length === 0) {
      setMensaje('¡Todo al día! Todos los suscriptores ya tienen su factura de este mes.');
      setGenerando(false);
      return;
    }

    setMensaje(`Generando ${suscriptoresSinFactura.length} facturas nuevas...`);

    // 4. Preparamos el bloque de datos masivo SOLO para los que faltan
    const nuevasFacturas = suscriptoresSinFactura.map((sub) => ({
      suscriptor_id: sub.id,
      mes: MES_ACTUAL,
      anio: ANIO_ACTUAL,
      monto: TARIFA_FIJA,
      estado: 'Pendiente'
    }));

    // 5. Insertamos las nuevas facturas a la base de datos
    const { error: errFac } = await supabase
      .from('facturas')
      .insert(nuevasFacturas);

    if (errFac) {
      setMensaje('Error al generar facturas: ' + errFac.message);
    } else {
      setMensaje(`¡Éxito! Se generaron ${suscriptoresSinFactura.length} facturas nuevas correctamente.`);
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
          <strong>¿Qué hace este botón ahora?</strong>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Busca a los suscriptores en la base de datos.</li>
            <li><strong>Revisa quiénes ya tienen factura este mes y los omite.</strong></li>
            <li>Genera facturas nuevas solo para quienes falten por facturar.</li>
          </ul>
        </div>

        <button
          onClick={generarFacturacionMasiva}
          disabled={generando}
          className="w-full text-lg bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-lg"
        >
          {generando ? 'Procesando en la nube...' : `Generar Facturas Faltantes de ${MES_ACTUAL}/${ANIO_ACTUAL}`}
        </button>

        {/* Mensaje de éxito o error */}
        {mensaje && (
          <div className={`mt-6 p-4 rounded flex items-center justify-center gap-2 ${mensaje.includes('Éxito') || mensaje.includes('Todo al día') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {(mensaje.includes('Éxito') || mensaje.includes('Todo al día')) && <CheckCircle size={20} />}
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}