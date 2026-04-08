"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// ¡Añadimos las tijeras (Scissors) a los íconos!
import { Printer, ArrowLeft, MessageCircle, Scissors } from 'lucide-react';
import Link from 'next/link';

interface Suscriptor {
  id: string;
  nombre_completo: string;
  documento: string;
  direccion: string;
}

interface Factura {
  id: string;
  monto: number;
  estado: 'Pagado' | 'Pendiente';
  fecha_emision: string;
  mes: number;
  anio: number;
  suscriptor_id: string;
  suscriptor: Suscriptor;
}

interface Config {
  logo_url?: string;
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  mensaje_factura: string;
}

export default function FacturaPDF() {
  const params = useParams();
  const facturaId = params.id;
  
  const [datos, setDatos] = useState<Factura | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [deudaTotal, setDeudaTotal] = useState<number>(0);
  const [mesesMora, setMesesMora] = useState<number>(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      // 1. Cargamos la configuración global (Logo, NIT, etc.)
      const { data: configData } = await supabase.from('acueductos').select('*').limit(1).single();
      if (configData) setConfig(configData);

      // 2. Cargamos la factura actual y el suscriptor
      const { data: facturaData } = await supabase
        .from('facturas')
        .select(`*, suscriptor:suscriptor_id (id, nombre_completo, documento, direccion)`)
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
    // Generamos el enlace a esta misma página (cuando esté en Vercel, será un link público)
    const urlFactura = window.location.href;
    const montoMostrar = datos.estado === 'Pendiente' ? deudaTotal : datos.monto;
    
    const mensaje = `Hola ${datos.suscriptor.nombre_completo}, te compartimos tu factura del ${config?.nombre || 'Acueducto'}. Total a pagar: $${montoMostrar.toLocaleString('es-CO')}. Puedes verla y descargarla aquí: ${urlFactura}`;
    
    // Abre WhatsApp Web (o la app en celulares) para elegir el contacto y enviar el mensaje
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  if (cargando) return <div className="p-8 text-center text-gray-500">Generando documento...</div>;
  if (!datos || !config) return <div className="p-8 text-center text-red-500">Error al cargar la factura o la configuración</div>;

  // Si la factura ya está pagada, mostramos el valor de esa factura. Si está pendiente, mostramos toda la deuda.
  const totalMostrar = datos.estado === 'Pagado' ? Number(datos.monto) : deudaTotal;

  return (
    <div className="min-h-screen bg-gray-200 p-8 flex flex-col items-center">
      
      {/* Botonera Superior (print:hidden los oculta al imprimir) */}
      <div className="w-full max-w-2xl flex flex-wrap justify-between gap-4 mb-6 print:hidden">
        <Link href="/facturas" className="flex items-center gap-2 text-gray-700 bg-white px-4 py-2 rounded shadow hover:bg-gray-50">
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

      {/* Papel de la Factura (A4 simulado) */}
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
              <p className="text-gray-600 font-medium">NIT: {config.nit}</p>
              <p className="text-gray-500 text-sm">{config.direccion}</p>
              <p className="text-gray-500 text-sm">Tel: {config.telefono} | {config.email}</p>
            </div>
          </div>
          <div className="text-right bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h2 className="text-xl font-bold text-blue-900 uppercase">Factura de Venta</h2>
            <p className="text-gray-800 font-mono mt-1 text-lg">N° {datos.id.substring(0, 6).toUpperCase()}</p>
            <p className="text-gray-600 text-sm mt-1 font-semibold">Emisión: {new Date(datos.fecha_emision).toLocaleDateString()}</p>
            <p className="text-gray-600 text-sm font-semibold">Período: Mes {datos.mes} / {datos.anio}</p>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Facturar a:</h3>
            <p className="text-lg font-bold text-gray-800">{datos.suscriptor.nombre_completo}</p>
            <p className="text-gray-600">CC/NIT: {datos.suscriptor.documento}</p>
            <p className="text-gray-600">Predio: {datos.suscriptor.direccion}</p>
          </div>
          {datos.estado === 'Pendiente' && mesesMora > 1 && (
            <div className="bg-red-50 p-4 rounded border border-red-200 flex flex-col justify-center items-center text-center">
              <h3 className="text-red-800 font-bold uppercase mb-1">¡Aviso de Mora!</h3>
              <p className="text-red-600">Usted presenta <strong>{mesesMora} meses</strong> pendientes de pago.</p>
              <p className="text-xs text-red-500 mt-1">El valor total incluye toda su deuda acumulada.</p>
            </div>
          )}
        </div>

        {/* Tabla de Conceptos */}
        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="p-3 rounded-tl-lg">Descripción</th>
              <th className="p-3 text-center">Período</th>
              <th className="p-3 text-right rounded-tr-lg">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-4 text-gray-800 font-medium">Servicio de Acueducto (Tarifa Fija)</td>
              <td className="p-4 text-center text-gray-600">{datos.mes} / {datos.anio}</td>
              <td className="p-4 text-right text-gray-800">${Number(datos.monto).toLocaleString('es-CO')}</td>
            </tr>
            {datos.estado === 'Pendiente' && mesesMora > 1 && (
              <tr className="border-b bg-gray-50">
                <td colSpan={2} className="p-4 text-gray-800 italic">Saldos anteriores pendientes ({mesesMora - 1} meses)</td>
                <td className="p-4 text-right text-gray-800">${(deudaTotal - Number(datos.monto)).toLocaleString('es-CO')}</td>
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
              <span className={`px-4 py-2 text-sm font-black uppercase tracking-wider rounded ${datos.estado === 'Pagado' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`}>
                ESTADO: {datos.estado}
              </span>
            </div>
          </div>
        </div>

        {/* Pie de página dinámico */}
        <div className="border-t-2 border-gray-200 pt-6 text-center text-gray-600 text-sm">
          <p className="font-medium italic">"{config.mensaje_factura}"</p>
          <p className="mt-2 text-xs text-gray-400">Generado por Acuasoft Clone - Plataforma SaaS</p>
        </div>

        {/* ========================================= */}
        {/* --- INICIO LÍNEA DE CORTE --- */}
        {/* ========================================= */}
        <div className="relative flex items-center py-8 print:py-6 mt-4">
          <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 flex items-center gap-2">
            <Scissors size={20} className="transform -rotate-90 text-gray-400" />
            <span className="text-xs uppercase tracking-widest text-gray-400 print:text-[10px]">
              Línea de corte
            </span>
          </span>
          <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
        </div>

        {/* ========================================= */}
        {/* --- INICIO DESPRENDIBLE DE PAGO --- */}
        {/* ========================================= */}
        <div className="border-2 border-gray-800 rounded-xl p-6 bg-white print:border print:border-gray-500 print:shadow-none shadow-sm mb-4">
          <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                Desprendible de Pago
              </h3>
              <p className="text-xs font-mono text-gray-500 mt-1">Copia para el Acueducto</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Período Facturado</p>
              <p className="font-bold text-gray-800">Mes {datos.mes} / {datos.anio}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase">Suscriptor:</p>
              <p className="font-bold text-gray-800 text-lg">{datos.suscriptor.nombre_completo}</p>
            </div>
            
            <div className="text-right">
              <p className="text-gray-500 text-xs uppercase">N° Factura:</p>
              <p className="font-mono text-gray-800">#{datos.id.substring(0, 6).toUpperCase()}</p>
            </div>

            <div>
              <p className="text-gray-500 text-xs uppercase">Estado:</p>
              <p className={`font-bold ${datos.estado === 'Pagado' ? 'text-green-600' : 'text-red-600'}`}>
                {datos.estado}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-gray-500 text-xs uppercase">Total a Pagar:</p>
              <p className={`font-bold text-2xl print:text-black ${datos.estado === 'Pagado' ? 'text-green-700' : 'text-blue-700'}`}>
                ${totalMostrar.toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}