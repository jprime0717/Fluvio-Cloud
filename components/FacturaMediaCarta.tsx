/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { totalFactura } from '@/lib/facturas';

// Factura compacta pensada para una hoja media carta (ver HojaMediaCarta).
// La usan tanto la impresión individual como la Impresión Masiva, para que
// todas las facturas salgan iguales.
// deudaTotal y mesesMora son la deuda acumulada real del suscriptor (sus
// facturas Pendiente hasta este período): si la factura está Pagada solo se
// muestra su propio valor; si sigue Pendiente, se muestra la deuda total.
export default function FacturaMediaCarta({ fac, config, deudaTotal, mesesMora }: { fac: any; config: any; deudaTotal: number; mesesMora: number }) {
  const totalFacturaActual = totalFactura(fac);
  const totalMostrar = fac.estado === 'Pagado' ? totalFacturaActual : deudaTotal;
  const medidor = fac.suscriptor?.numero_medidor;

  return (
    <div className="factura-print bg-white relative overflow-hidden text-sm">

      {fac.estado === 'Pagado' && (
        <div className="absolute top-1/3 left-1/3 transform -rotate-45 text-green-500 opacity-20 text-6xl font-black uppercase pointer-events-none border-8 border-green-500 rounded-lg p-4">
          PAGADO
        </div>
      )}

      <div className="flex justify-between items-start border-b-2 border-blue-900 pb-2 mb-2">
        <div className="flex items-center gap-3">
          {config?.logo_url && <img src={config.logo_url} alt="Logo" width={44} height={44} decoding="async" className="w-11 h-11 object-contain rounded" />}
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 uppercase tracking-wide">{config?.nombre}</h1>
            <p className="text-gray-800 font-medium text-xs">NIT: {config?.nit}</p>
          </div>
        </div>
        <div className="text-right bg-blue-50 p-2 rounded-lg border border-blue-100">
          <h2 className="text-sm font-bold text-blue-900 uppercase">Factura de Venta</h2>
          <p className="text-gray-900 font-mono mt-1 text-sm">N° {fac.numero_factura}</p>
        </div>
      </div>

      <div className="mb-2 bg-gray-50 p-2 rounded border border-gray-200">
        <h3 className="text-xs font-bold text-gray-700 uppercase mb-1">Facturar a:</h3>
        <p className="text-base font-bold text-gray-900 truncate">{fac.suscriptor.nombre} {fac.suscriptor.apellido}</p>
        <p className="text-black font-bold text-xs truncate">
          NUID: {fac.suscriptor.nuid}
          {medidor && <> | Medidor: {medidor}</>}
        </p>
        {/* DIRECCIÓN RESALTADA: dato clave para quien reparte la factura */}
        <p className="mt-1 bg-blue-50 border-2 border-blue-300 rounded px-1.5 py-1 text-black font-black text-xs leading-snug">
          <span className="text-blue-900 font-black uppercase">Predio: </span>
          {fac.suscriptor.direccion}
        </p>
      </div>

      <table className="w-full text-left mb-2 border-collapse">
        <thead>
          <tr className="bg-blue-900 text-white print:bg-white print:border-b-2 print:border-black">
            <th className="p-1.5 rounded-tl-lg text-xs">Descripción</th>
            <th className="p-1.5 text-center text-xs">Período</th>
            <th className="p-1.5 text-right rounded-tr-lg text-xs">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-1.5 text-black font-bold">Servicio de Acueducto (Tarifa Fija)</td>
            <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
            <td className="p-1.5 text-right text-gray-900">${Number(fac.monto).toLocaleString('es-CO')}</td>
          </tr>
          {Number(fac.reconexion) > 0 && (
            <tr className="border-b">
              <td className="p-1.5 text-black font-bold">Reconexión</td>
              <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
              <td className="p-1.5 text-right text-gray-900">${Number(fac.reconexion).toLocaleString('es-CO')}</td>
            </tr>
          )}
          {Number(fac.interes_mora) > 0 && (
            <tr className="border-b">
              <td className="p-1.5 text-black font-bold">Intereses de Mora</td>
              <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
              <td className="p-1.5 text-right text-gray-900">${Number(fac.interes_mora).toLocaleString('es-CO')}</td>
            </tr>
          )}
          {Number(fac.multa) > 0 && (
            <tr className="border-b">
              <td className="p-1.5 text-black font-bold">Multa</td>
              <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
              <td className="p-1.5 text-right text-gray-900">${Number(fac.multa).toLocaleString('es-CO')}</td>
            </tr>
          )}
          {Number(fac.matricula) > 0 && (
            <tr className="border-b">
              <td className="p-1.5 text-black font-bold">Matrícula</td>
              <td className="p-1.5 text-center text-black font-semibold">Mes {fac.mes} / {fac.anio}</td>
              <td className="p-1.5 text-right text-gray-900">${Number(fac.matricula).toLocaleString('es-CO')}</td>
            </tr>
          )}
          {Number(fac.cobro_meses_anteriores) > 0 && (
            <tr className="border-b">
              <td className="p-1.5 text-black font-bold">Meses en Deuda</td>
              <td className="p-1.5 text-center text-black font-semibold">
                {Math.round(Number(fac.cobro_meses_anteriores))}
              </td>
              <td className="p-1.5 text-right text-gray-700 italic">—</td>
            </tr>
          )}
          {fac.estado === 'Pendiente' && mesesMora > 1 && (
            <tr className="border-b bg-gray-50">
              <td colSpan={2} className="p-1.5 text-black font-bold italic">
                Saldos anteriores pendientes ({mesesMora - 1} meses)
              </td>
              <td className="p-1.5 text-right text-gray-900 font-bold">
                ${(deudaTotal - totalFacturaActual).toLocaleString('es-CO')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end mb-2">
        <div className="w-1/2 bg-gray-50 p-2 rounded-lg border border-gray-300">
          <div className="flex justify-between font-black text-lg text-gray-900">
            <span>TOTAL:</span>
            <span className={fac.estado === 'Pagado' ? 'text-green-700' : 'text-red-700'}>
              ${totalMostrar.toLocaleString('es-CO')}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-gray-300 pt-1.5 text-center text-gray-800 text-xs">
        <p className="font-medium italic">&quot;{config?.mensaje_factura}&quot;</p>
      </div>

      {/* --- LÍNEA DE CORTE (desprendible) --- */}
      <div className="relative flex items-center py-2 mt-1.5">
        <div className="grow border-t-4 border-dashed border-gray-700"></div>
        <span className="shrink-0 mx-3 text-[11px] uppercase font-bold tracking-widest text-gray-700">
          Línea de corte
        </span>
        <div className="grow border-t-4 border-dashed border-gray-700"></div>
      </div>

      {/* --- DESPRENDIBLE DE PAGO --- */}
      <div className="border-2 border-gray-800 rounded-xl p-2 bg-white print:border-gray-700">
        <div className="flex justify-between items-center border-b border-gray-300 pb-1.5 mb-1.5">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Desprendible de Pago</h3>
            <p className="text-[10px] font-bold text-gray-700 uppercase">Copia para el Acueducto</p>
          </div>
          <p className="font-extrabold text-gray-900 text-xs">Mes {fac.mes} / {fac.anio}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-gray-700 font-bold uppercase">Suscriptor:</p>
            <p className="font-extrabold text-gray-900 truncate">{fac.suscriptor.nombre} {fac.suscriptor.apellido}</p>
            <p className="text-gray-800 font-bold mt-0.5 leading-snug">
              NUID: {fac.suscriptor.nuid || 'N/A'} | Predio: {fac.suscriptor.direccion || 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-700 font-bold uppercase">N° Factura:</p>
            <p className="font-mono font-bold text-gray-900">#{fac.numero_factura}</p>
          </div>
          <div>
            <p className="text-gray-700 font-bold uppercase">Estado:</p>
            <p className={`font-black uppercase ${fac.estado === 'Pagado' ? 'text-green-700' : 'text-red-700'}`}>{fac.estado}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-700 font-bold uppercase">Total a Pagar:</p>
            <p className="font-black text-base text-blue-800 print:text-black">${totalMostrar.toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
