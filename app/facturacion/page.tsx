"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { esSuperAdmin } from '@/lib/auth';
import { FileText, CheckCircle } from 'lucide-react';

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Genera las últimas `cantidad` opciones de mes/año, empezando por el mes actual.
function generarOpcionesMes(cantidad: number) {
  const hoy = new Date();
  const opciones = [];
  for (let i = 0; i < cantidad; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();
    opciones.push({ mes, anio, label: `${NOMBRES_MES[mes - 1]} ${anio}` });
  }
  return opciones;
}

export default function Facturacion() {
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [esAdminGlobal, setEsAdminGlobal] = useState(false);

  const MES_ACTUAL_HOY = new Date().getMonth() + 1; // 1 = Enero, 3 = Marzo
  const ANIO_ACTUAL_HOY = new Date().getFullYear();

  // El superadmin puede regenerar hasta 2 meses atrás (mes actual, -1, -2).
  const opcionesMes = generarOpcionesMes(3);

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(
    `${MES_ACTUAL_HOY}-${ANIO_ACTUAL_HOY}`
  );

  useEffect(() => {
    const verificarRol = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setEsAdminGlobal(esSuperAdmin(session?.user.email));
    };
    verificarRol();
  }, []);

  // Si el usuario pierde el permiso de superadmin (o nunca lo tuvo), forzamos el mes actual.
  const [MES_ACTUAL, ANIO_ACTUAL] = esAdminGlobal
    ? periodoSeleccionado.split('-').map(Number)
    : [MES_ACTUAL_HOY, ANIO_ACTUAL_HOY];

  const generarFacturacionMasiva = async () => {
    if (!confirm(`¿Estás seguro de generar la facturación para el mes ${MES_ACTUAL}/${ANIO_ACTUAL}?`)) return;

    setGenerando(true);
    setMensaje('Obteniendo configuración de tarifas...');

    // 1. Obtenemos los precios de la tabla acueductos
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

    // 2. MODIFICADO: Agregamos 'numero_medidor' a la consulta por si se necesita listar consumos en el futuro
    const { data: suscriptores, error: errSub } = await supabase
      .from('suscriptores')
      .select('id, tipo_suscriptor, numero_medidor');

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
        monto: totalFactura,
        estado: 'Pendiente'
      };
    });

    // 6. Insertamos las nuevas facturas a la base de datos.
    // Usamos upsert+ignoreDuplicates (en vez de insert) como red de seguridad:
    // si dos personas generan el mismo mes al mismo tiempo (o se hace doble clic),
    // la restricción UNIQUE(suscriptor_id, mes, anio) evita facturas duplicadas
    // en lugar de que el segundo intento falle o inserte de más.
    const { data: insertadas, error: errFac } = await supabase
      .from('facturas')
      .upsert(nuevasFacturas, { onConflict: 'suscriptor_id,mes,anio', ignoreDuplicates: true })
      .select('id');

    if (errFac) {
      setMensaje('Error al generar facturas: ' + errFac.message);
    } else {
      setMensaje(`¡Éxito! Se generaron ${insertadas?.length ?? suscriptoresSinFactura.length} facturas calculadas con sus tarifas correspondientes.`);
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

        {esAdminGlobal ? (
          <div className="mb-8 text-left max-w-xs mx-auto">
            <label htmlFor="periodo" className="block text-sm font-bold text-gray-700 mb-1">
              Período a generar (superadmin)
            </label>
            <select
              id="periodo"
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 font-medium text-gray-900"
            >
              {opcionesMes.map((op) => (
                <option key={`${op.mes}-${op.anio}`} value={`${op.mes}-${op.anio}`}>
                  {op.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Como superadmin puedes generar el mes actual o hasta 2 meses anteriores.
            </p>
          </div>
        ) : (
          <p className="text-gray-600 font-medium mb-8">
            Mes: <strong className="text-gray-900">{MES_ACTUAL}</strong> | Año: <strong className="text-gray-900">{ANIO_ACTUAL}</strong>
          </p>
        )}

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