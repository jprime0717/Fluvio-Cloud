"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, CheckCircle } from 'lucide-react';

export default function Facturacion() {
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  const MES_ACTUAL = new Date().getMonth() + 1; // 1 = Enero, 3 = Marzo
  const ANIO_ACTUAL = new Date().getFullYear();

  const generarFacturacionMasiva = async () => {
    if (!confirm(`¿Estás seguro de generar la facturación para el mes ${MES_ACTUAL}/${ANIO_ACTUAL}?`)) return;
    
    setGenerando(true);
    setMensaje('Obteniendo configuración de tarifas...');

    // 1. NUEVO: Obtenemos los precios de la tabla acueductos
    const { data: config, error: errConfig } = await supabase
      .from('acueductos')
      .select('tarifa_fija, tarifa_comercial_extra, tarifa_industrial_extra')
      .limit(1)
      .single();

    if (errConfig || !config) {
      setMensaje('Error al obtener la configuración de tarifas: ' + errConfig?.message);
      setGenerando(false);
      return;
    }

    setMensaje('Buscando suscriptores...');

    // 2. MODIFICADO: Ahora también pedimos el 'tipo_suscriptor'
    const { data: suscriptores, error: errSub } = await supabase
      .from('suscriptores')
      .select('id, tipo_suscriptor');

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

    // 3. Buscamos las facturas que YA se generaron este mes y año
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

    const idsConFactura = facturasExistentes.map(f => f.suscriptor_id);

    // 4. Filtramos para quedarnos SOLO con los que NO tienen factura
    const suscriptoresSinFactura = suscriptores.filter(
      (sub) => !idsConFactura.includes(sub.id)
    );

    if (suscriptoresSinFactura.length === 0) {
      setMensaje('¡Todo al día! Todos los suscriptores ya tienen su factura de este mes.');
      setGenerando(false);
      return;
    }

    setMensaje(`Calculando valores y generando ${suscriptoresSinFactura.length} facturas...`);

    // 5. LA MAGIA MATEMÁTICA: Calculamos el total individualmente
    const nuevasFacturas = suscriptoresSinFactura.map((sub) => {
      // Iniciamos con la tarifa base (ej. 15000)
      let totalFactura = config.tarifa_fija;

      // Sumamos los extras si corresponde
      if (sub.tipo_suscriptor === 'Comercial') {
        totalFactura = totalFactura + (config.tarifa_comercial_extra || 0);
      } else if (sub.tipo_suscriptor === 'Industrial') {
        totalFactura = totalFactura + (config.tarifa_industrial_extra || 0);
      }

      // Devolvemos el bloque listo para insertar en la base de datos
      return {
        suscriptor_id: sub.id,
        mes: MES_ACTUAL,
        anio: ANIO_ACTUAL,
        monto: totalFactura, // <-- ¡Aquí va el monto ya sumado!
        estado: 'Pendiente'
      };
    });

    // 6. Insertamos las nuevas facturas a la base de datos
    const { error: errFac } = await supabase
      .from('facturas')
      .insert(nuevasFacturas);

    if (errFac) {
      setMensaje('Error al generar facturas: ' + errFac.message);
    } else {
      setMensaje(`¡Éxito! Se generaron ${suscriptoresSinFactura.length} facturas calculadas con sus tarifas correspondientes.`);
    }

    setGenerando(false);
  };

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Facturación Mensual</h2>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-md max-w-2xl mx-auto text-center border-t-4 border-blue-600">
        <div className="flex justify-center mb-6 text-blue-600">
          <FileText size={64} />
        </div>
        
        <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Período de Facturación</h3>
        <p className="text-gray-600 font-medium mb-8">
          Mes: <strong className="text-gray-900">{MES_ACTUAL}</strong> | Año: <strong className="text-gray-900">{ANIO_ACTUAL}</strong>
        </p>

        <div className="bg-blue-50 text-blue-900 p-4 rounded-lg mb-8 text-left text-sm font-medium border border-blue-100">
          <strong className="text-blue-950 block mb-2 text-base">¿Qué hace este proceso?</strong>
          <ul className="list-disc ml-5 space-y-1">
            <li>Obtiene las tarifas de tu configuración global.</li>
            <li>Revisa quiénes ya tienen factura este mes y los omite.</li>
            <li><strong>Detecta si el suscriptor es Comercial o Industrial y le suma el valor adicional.</strong></li>
            <li>Genera facturas nuevas solo para quienes falten por facturar.</li>
          </ul>
        </div>

        <button
          onClick={generarFacturacionMasiva}
          disabled={generando}
          className="w-full text-lg bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-lg"
        >
          {generando ? 'Calculando y guardando en la nube...' : `Generar Facturas Faltantes de ${MES_ACTUAL}/${ANIO_ACTUAL}`}
        </button>

        {/* Mensaje de éxito o error */}
        {mensaje && (
          <div className={`mt-6 p-4 rounded-lg flex items-center justify-center gap-2 font-bold shadow-sm ${mensaje.includes('Éxito') || mensaje.includes('Todo al día') ? 'bg-green-100 text-green-900 border border-green-200' : 'bg-yellow-100 text-yellow-900 border border-yellow-200'}`}>
            {(mensaje.includes('Éxito') || mensaje.includes('Todo al día')) && <CheckCircle size={20} />}
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}