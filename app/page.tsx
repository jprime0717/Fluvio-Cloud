"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, FileText, DollarSign, Clock, TrendingUp } from 'lucide-react';

export default function ResumenDashboard() {
  // Estados para guardar los datos reales
  const [totalSuscriptores, setTotalSuscriptores] = useState<number>(0);
  const [metricasMes, setMetricasMes] = useState({ facturado: 0, pagado: 0, pendiente: 0 });
  const [mesActualLabel, setMesActualLabel] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      setCargando(true);

      // Obtenemos el mes y año actual automáticamente
      const fechaActual = new Date();
      const numeroMes = fechaActual.getMonth() + 1;
      const anioActual = fechaActual.getFullYear();
      
      const nombreMes = fechaActual.toLocaleString('es-ES', { month: 'long' });
      setMesActualLabel(`${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${anioActual}`);

      try {
        // 1. Consulta Real: Contar Total de Suscriptores
        const { count, error: errCount } = await supabase
          .from('suscriptores')
          .select('*', { count: 'exact', head: true });
        
        if (count) setTotalSuscriptores(count);
        if (errCount) console.error("Error contando suscriptores:", errCount);

        // 2. Consulta Real: Obtener todas las facturas del MES ACTUAL
        const { data: facturasMes, error: errFacs } = await supabase
          .from('facturas')
          .select('monto, estado')
          .eq('mes', numeroMes)
          .eq('anio', anioActual);

        if (errFacs) console.error("Error cargando facturas del mes:", errFacs);

        // 3. Magia: Calculamos los totales usando reduce()
        if (facturasMes) {
          const totales = facturasMes.reduce((acc, fac) => {
            const monto = Number(fac.monto);
            acc.facturado += monto;
            if (fac.estado === 'Pagado') acc.pagado += monto;
            if (fac.estado === 'Pendiente') acc.pendiente += monto;
            return acc;
          }, { facturado: 0, pagado: 0, pendiente: 0 });

          setMetricasMes(totales);
        }

      } catch (error) {
        console.error("Error en el Dashboard:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosDashboard();
  }, []);

  // Función auxiliar para formatear dinero en Pesos Colombianos
  const formatearDinero = (monto: number) => {
    return `$${monto.toLocaleString('es-CO')}`;
  };

  if (cargando) {
    return <div className="p-8 text-center text-gray-500 text-lg">Cargando resumen real...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-10 border-b pb-6">
        <TrendingUp size={36} className="text-blue-600" />
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800">Resumen Operativo</h1>
          <p className="text-gray-500 text-lg mt-1">Estado actual de la asociación de acueducto</p>
        </div>
      </div>

      {/* 1. KPI Principal: Total Usuarios */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-10 flex items-center gap-6">
        <div className="bg-blue-100 text-blue-700 p-5 rounded-full">
          <Users size={40} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Suscriptores Registrados</p>
          <p className="text-6xl font-black text-gray-900 mt-1">{totalSuscriptores.toLocaleString()}</p>
          <p className="text-blue-600 font-medium mt-1">Familias activas en el sistema</p>
        </div>
      </div>

      {/* 2. Sección del Mes Actual */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 bg-gray-800 text-white p-4 rounded-lg shadow">
          <Clock size={24} />
          <h2 className="text-2xl font-bold">Estado Financiero: <span className="text-amber-400">{mesActualLabel}</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card: Total Facturado */}
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-gray-400">
            <div className="flex justify-between items-start mb-4">
              <p className="font-bold text-gray-600">Total Facturado</p>
              <FileText className="text-gray-400" size={24} />
            </div>
            <p className="text-3xl font-black text-gray-800">{formatearDinero(metricasMes.facturado)}</p>
            <p className="text-sm text-gray-500 mt-1">Monto total generado en recibos</p>
          </div>

          {/* Card: Total Recaudado (Verde) */}
          <div className="bg-green-50 p-6 rounded-xl shadow-md borderborder border border-green-200 border-l-4 border-l-green-500">
            <div className="flex justify-between items-start mb-4">
              <p className="font-bold text-green-800">Recaudado (Pagado)</p>
              <DollarSign className="text-green-500" size={24} />
            </div>
            <p className="text-3xl font-black text-green-700">{formatearDinero(metricasMes.pagado)}</p>
            <p className="text-sm text-green-600 mt-1">Dinero real ingresado a caja</p>
          </div>

          {/* Card: Total Pendiente (Rojo) */}
          <div className="bg-red-50 p-6 rounded-xl shadow-md borderborder border-red-200 border-l-4 border-l-red-500">
            <div className="flex justify-between items-start mb-4">
              <p className="font-bold text-red-800">Cartera Pendiente (Mora)</p>
              <Clock className="text-red-500" size={24} />
            </div>
            <p className="text-3xl font-black text-red-700">{formatearDinero(metricasMes.pendiente)}</p>
            <p className="text-sm text-red-600 mt-1">Dinero por cobrar este mes</p>
          </div>
        </div>
      </div>
      
      {/* Mensaje de bienvenida profesional */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100 text-center">
          <h3 className="text-xl font-bold text-gray-800">Bienvenido al Panel de Control de Fluvio-Cloud</h3>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">Utiliza el menú lateral para gestionar suscriptores, generar la facturación del mes, registrar pagos y visualizar reportes de cartera. Toda la información mostrada aquí es en tiempo real.</p>
      </div>

    </div>
  );
}