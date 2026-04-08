"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Printer, ArrowLeft, MessageCircle, Scissors } from 'lucide-react';
import Link from 'next/link';

export default function FacturaPDF() {
  const params = useParams();
  const facturaId = params.id;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [datos, setDatos] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  const [deudaTotal, setDeudaTotal] = useState<number>(0);
  const [mesesMora, setMesesMora] = useState<number>(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      // 1. Cargamos la configuración global (Logo, NIT, etc.)
      const { data: configData } = await supabase.from('acueductos').select('*').limit(1).single();
      if (configData) setConfig(configData);

      // 2. Cargamos la factura actual y el suscriptor (¡AÑADIMOS tipo_suscriptor AQUÍ!)
      const { data: facturaData } = await supabase
        .from('facturas')
        .select(`*, suscriptor:suscriptor_id (id, nombre_completo, documento, direccion, tipo_suscriptor)`)
        .eq('id', facturaId)
        .single();

      if (facturaData) {
        setDatos(facturaData);

        // 3. Magia: Calculamos la mora (Buscamos todas las facturas pendientes de esta persona)
        const { data: pendientes } = await supabase
          .from('facturas')
          .select('monto')
          .eq('suscriptor_id', facturaData.suscriptor.id)
          .eq('estado', 'Pendiente');

        if (pendientes) {
          setMesesMora(pendientes.length);
          const total = pendientes.reduce((acc, curr) => acc + Number(curr.monto), 0);
          setDeudaTotal(total);
        }
      }
      setCargando(false);
    };

    cargarDatos();
  }, [facturaId]);

  const imprimirPDF = () => {
    window.print();
  };

  const enviarWhatsApp = () => {
    const urlFactura = window.location.href;
    const montoMostrar = datos.estado === 'Pendiente' ? deudaTotal : datos.monto;
    
    const mensaje = `Hola ${datos.suscriptor.nombre_completo}, te compartimos tu factura del ${config?.nombre || 'Acueducto'}. Total a pagar: $${montoMostrar.toLocaleString('es-CO')}. Puedes verla y descargarla aquí: ${urlFactura}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  if (cargando) return <div className="p-8 text-center text-gray-500 font-bold">Generando documento...</div>;
  if (!datos || !config) return <div className="p-8 text-center text-red-500 font-bold">Error al cargar la factura o la configuración</div>;

  const totalMostrar = datos.estado === 'Pagado' ? Number(datos.monto) : deudaTotal;

  return (
    <div className="min-h-screen bg-gray-200 p-8 flex flex-col items-center">
      
      {/* Botonera Superior */}
      <div className="w-full max-w-2xl flex flex-wrap justify-between gap-4 mb-6 print:hidden">
        <Link href="/facturas" className="flex items-center gap-2 text-gray-700 bg-white px-4 py-2 rounded shadow hover:bg-gray-50 font-bold">
          <ArrowLeft size={20} /> Volver
        </Link>
        <div className="flex gap-3">
          <button onClick={enviarWhatsApp} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 font-bold transition-colors">
            <MessageCircle size={20} /> Enviar por WhatsApp
          </button>
          <button onClick={imprimirPDF} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-bold transition-colors">
            <Printer size={20} /> Imprimir PDF
          </button>
        </div>
      </div>

      {/* Papel de la Factura */}
      <div className="bg-white w-full max-w-2xl p-10 rounded shadow-xl print:shadow-none print:p-0 relative overflow-hidden">
        
        {/* Marca de agua si está pagado */}
        {datos.estado === 'Pagado' && (
          <div className="absolute top-1/3 left-1/4 transform -rotate-45 text-green-500 opacity-20 text-8xl font-black uppercase pointer-events-none border-8 border-green-500 rounded-lg p-4">
            PAGADO
          </div>
        )}

        {/* Encabezado Personalizado */}
        <div className="flex justify-between items-start border-b-2 border-blue-900 pb-6 mb-6">
          <div className="flex items-center gap-4">
            {config.logo_url && (
              <img src={config.logo_url} alt="Logo" className="w-24 h-24 object-contain rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
            )}
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 uppercase tracking-wide">{config.nombre}</h1>
              <p className="text-gray-600 font-bold">NIT: {config.nit}</p>
              <p className="text-gray-500 text-sm font-medium">{config.direccion}</p>
              <p className="text-gray-500 text-sm font-medium">Tel: {config.telefono} | {config.email}</p>
            </div>
          </div>
          <div className="text-right bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h2 className="text-xl font-bold text-blue-900 uppercase">Factura de Venta</h2>
            <p className="text-gray-800 font-mono mt-1 text-lg font-bold">N° {datos.id.substring(0, 6).toUpperCase()}</p>
            <p className="text-gray-600 text-sm mt-1 font-bold">Emisión: {new Date(datos.fecha_emision).toLocaleDateString()}</p>
            <p className="text-gray-600 text-sm font-bold">Período: Mes {datos.mes} / {datos.anio}</p>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-xs font-black text-gray-500 uppercase mb-2">Facturar a:</h3>
            <p className="text-lg font-extrabold text-gray-800">{datos.suscriptor.nombre_completo}</p>
            <p className="text-gray-700 font-medium">CC/NIT: {datos.suscriptor.documento}</p>
            <p className="text-gray-700 font-medium">Predio: {datos.suscriptor.direccion}</p>
            
            {/* NUEVO: Etiqueta Visual del Tipo de Suscriptor */}
            <div className="mt-3">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs font-black rounded uppercase tracking-wider">
                TIPO: {datos.suscriptor.tipo_suscriptor || 'Residencial'}
              </span>
            </div>
          </div>
          
          {datos.estado === 'Pendiente' && mesesMora > 1 && (
            <div className="bg-red-50 p-4 rounded border border-red-200 flex flex-col justify-center items-center text-center">
              <h3 className="text-red-800 font-black uppercase mb-1 text-lg">¡Aviso de Mora!</h3>
              <p className="text-red-700 font-medium">Usted presenta <strong className="font-black">{mesesMora} meses</strong> pendientes de pago.</p>
              <p className="text-xs text-red-600 mt-2 font-bold">El valor total incluye toda su deuda acumulada.</p>
            </div>
          )}
        </div>

        {/* Tabla de Conceptos */}
        <table className="w-full text-left mb-8 border-collapse border border-gray-200">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="p-3 rounded-tl border-r border-blue-800 font-bold">Descripción</th>
              <th className="p-3 text-center border-r border-blue-800 font-bold">Período</th>
              <th className="p-3 text-right rounded-tr font-bold">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-4 text-gray-800 font-bold">
                Servicio de Acueducto
                {/* NUEVO: Texto explicativo automático según el tipo */}
                <span className="block text-xs text-gray-500 font-medium mt-1">
                  {datos.suscriptor.tipo_suscriptor === 'Comercial' ? '(Incluye recargo por uso comercial)' : 
                   datos.suscriptor.tipo_suscriptor === 'Industrial' ? '(Incluye recargo por uso industrial)' : 
                   '(Tarifa base residencial)'}
                </span>
              </td>
              <td className="p-4 text-center text-gray-700 font-medium">{datos.mes} / {datos.anio}</td>
              <td className="p-4 text-right text-gray-900 font-bold">${Number(datos.monto).toLocaleString('es-CO')}</td>
            </tr>
            {datos.estado === 'Pendiente' && mesesMora > 1 && (
              <tr className="border-b border-gray-200 bg-gray-50">
                <td colSpan={2} className="p-4 text-gray-800 font-bold italic">Saldos anteriores pendientes ({mesesMora - 1} meses)</td>
                <td className="p-4 text-right text-gray-900 font-bold">${(deudaTotal - Number(datos.monto)).toLocaleString('es-CO')}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end mb-8">
          <div className="w-2/3 md:w-1/2 bg-gray-50 p-5 rounded-lg border border-gray-300 shadow-sm">
            <div className="flex justify-between font-black text-2xl text-gray-800">
              <span>TOTAL:</span>
              <span className={datos.estado === 'Pagado' ? 'text-green-600' : 'text-red-600'}>
                ${totalMostrar.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="mt-3 text-right">
              <span className={`px-4 py-2 text-sm font-black uppercase tracking-wider rounded border ${datos.estado === 'Pagado' ? 'bg-green-100 text-green-900 border-green-300' : 'bg-red-100 text-red-900 border-red-300'}`}>
                ESTADO: {datos.estado}
              </span>
            </div>
          </div>
        </div>

        {/* Pie de página dinámico */}
        <div className="border-t-2 border-gray-200 pt-6 text-center text-gray-600 text-sm">
          <p className="font-bold italic">"{config.mensaje_factura}"</p>
          <p className="mt-2 text-xs text-gray-400 font-medium">Generado por Acuasoft Clone - Plataforma SaaS</p>
        </div>

        {/* --- INICIO LÍNEA DE CORTE --- */}
        <div className="relative flex items-center py-8 print:py-6 mt-4">
          <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 flex items-center gap-2">
            <Scissors size={20} className="transform -rotate-90 text-gray-400" />
            <span className="text-xs uppercase font-bold tracking-widest text-gray-400 print:text-[10px]">
              Línea de corte
            </span>
          </span>
          <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
        </div>

        {/* --- INICIO DESPRENDIBLE DE PAGO --- */}
        <div className="border-2 border-gray-800 rounded-xl p-6 bg-white print:border print:border-gray-500 print:shadow-none shadow-sm mb-4">
          <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-4">
            <div>
              <h3 className="text-xl font-extrabold text-gray-800 uppercase tracking-wide">
                Desprendible de Pago
              </h3>
              <p className="text-xs font-bold text-gray-500 mt-1 uppercase">Copia para el Acueducto</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-bold uppercase">Período</p>
              <p className="font-extrabold text-gray-900">Mes {datos.mes} / {datos.anio}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase">Suscriptor:</p>
              <p className="font-extrabold text-gray-900 text-lg">{datos.suscriptor.nombre_completo}</p>
              {/* NUEVO: Tipo en el desprendible */}
              <p className="text-xs font-bold text-blue-700 mt-1 uppercase">{datos.suscriptor.tipo_suscriptor || 'Residencial'}</p>
            </div>
            
            <div className="text-right">
              <p className="text-gray-500 text-xs font-bold uppercase">N° Factura:</p>
              <p className="font-mono font-bold text-gray-900">#{datos.id.substring(0, 6).toUpperCase()}</p>
            </div>

            <div>
              <p className="text-gray-500 text-xs font-bold uppercase">Estado:</p>
              <p className={`font-black uppercase ${datos.estado === 'Pagado' ? 'text-green-600' : 'text-red-600'}`}>
                {datos.estado}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-gray-500 text-xs font-bold uppercase">Total a Pagar:</p>
              <p className={`font-black text-2xl print:text-black ${datos.estado === 'Pagado' ? 'text-green-700' : 'text-blue-700'}`}>
                ${totalMostrar.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}