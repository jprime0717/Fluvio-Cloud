"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { totalFactura, cuentaEnDeuda } from '@/lib/facturas';
import { Printer, ArrowLeft, Pencil, Save, X } from 'lucide-react';
import HojaMediaCarta from '@/components/HojaMediaCarta';
import FacturaMediaCarta from '@/components/FacturaMediaCarta';
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

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeEdit, setMensajeEdit] = useState('');
  const [edicion, setEdicion] = useState({ nombre: '', apellido: '', monto: '', reconexion: '', interesMora: '', multa: '', matricula: '', mesesEnDeuda: '' });

  const cargarDatos = async () => {
    // 1. Cargamos la configuración global (Logo, NIT, etc.)
    const { data: configData } = await supabase.from('acueductos').select('*').limit(1).single();
    if (configData) setConfig(configData);

    // 2. Cargamos la factura actual y el suscriptor
    const { data: facturaData } = await supabase
      .from('facturas')
      .select(`*, suscriptor:suscriptor_id (id, nombre, apellido, nuid, numero_medidor, direccion, tipo_suscriptor)`)
      .eq('id', facturaId)
      .single();

    if (facturaData) {
      setDatos(facturaData);

      // 3. Magia: Calculamos la mora (facturas pendientes de esta persona hasta
      // el período de esta factura; los meses posteriores no son saldo anterior)
      const { data: todasPendientes } = await supabase
        .from('facturas')
        .select('mes, anio, monto, reconexion, interes_mora, multa, matricula')
        .eq('suscriptor_id', facturaData.suscriptor.id)
        .eq('estado', 'Pendiente');
      const pendientes = todasPendientes?.filter(p => cuentaEnDeuda(p, facturaData.mes, facturaData.anio));

      if (pendientes) {
        setMesesMora(pendientes.length);
        const total = pendientes.reduce((acc, curr) => acc + totalFactura(curr), 0);
        setDeudaTotal(total);
      }
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facturaId]);

  const imprimirPDF = () => {
    window.print();
  };

  const iniciarEdicion = () => {
    setEdicion({
      nombre: datos.suscriptor.nombre || '',
      apellido: datos.suscriptor.apellido || '',
      monto: String(datos.monto),
      reconexion: String(datos.reconexion || 0),
      interesMora: String(datos.interes_mora || 0),
      multa: String(datos.multa || 0),
      matricula: String(datos.matricula || 0),
      mesesEnDeuda: String(Number(datos.cobro_meses_anteriores || 0)),
    });
    setMensajeEdit('');
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setMensajeEdit('');
  };

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();

    const montoNumerico = Number(edicion.monto);
    const reconexionNumerica = Number(edicion.reconexion);
    const interesMoraNumerico = Number(edicion.interesMora);
    const multaNumerica = Number(edicion.multa);
    const matriculaNumerica = Number(edicion.matricula);
    const mesesEnDeudaNumerico = Number(edicion.mesesEnDeuda || 0);

    if (!edicion.nombre.trim() || !edicion.apellido.trim()) {
      setMensajeEdit('Error: el nombre y el apellido no pueden estar vacíos.');
      return;
    }
    const valores = [montoNumerico, reconexionNumerica, interesMoraNumerico, multaNumerica, matriculaNumerica, mesesEnDeudaNumerico];
    if (valores.some((v) => !Number.isFinite(v) || v < 0)) {
      setMensajeEdit('Error: los valores deben ser números válidos mayores o iguales a 0.');
      return;
    }
    if (mesesEnDeudaNumerico > 12) {
      setMensajeEdit('Error: los meses en deuda no pueden ser más de 12.');
      return;
    }

    // "Meses en Deuda" ahora solo guarda la cantidad de meses (informativo);
    // el valor correspondiente se ingresa manualmente en Tarifa de Acueducto.
    const cobroMesesAnterioresNumerico = mesesEnDeudaNumerico;

    setGuardando(true);
    setMensajeEdit('');

    const { error: errSus } = await supabase
      .from('suscriptores')
      .update({ nombre: edicion.nombre.trim(), apellido: edicion.apellido.trim() })
      .eq('id', datos.suscriptor.id);

    const { error: errFac } = await supabase
      .from('facturas')
      .update({
        monto: montoNumerico,
        reconexion: reconexionNumerica,
        interes_mora: interesMoraNumerico,
        multa: multaNumerica,
        matricula: matriculaNumerica,
        cobro_meses_anteriores: cobroMesesAnterioresNumerico,
      })
      .eq('id', facturaId);

    if (errSus || errFac) {
      setMensajeEdit('Error al guardar: ' + (errSus?.message || errFac?.message));
      setGuardando(false);
      return;
    }

    await cargarDatos();
    setGuardando(false);
    setEditando(false);
  };

  if (cargando) return <div className="p-8 text-center text-gray-500 font-bold">Generando documento...</div>;
  if (!datos || !config) return <div className="p-8 text-center text-red-500 font-bold">Error al cargar la factura o la configuración</div>;

  const totalEdicion = ['monto', 'reconexion', 'interesMora', 'multa', 'matricula'].reduce(
    (acc, campo) => acc + (Number(edicion[campo as keyof typeof edicion]) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-200 p-4 md:p-8 flex flex-col items-center print:block print:p-0 print:min-h-0">
      
      {/* Botonera Superior */}
      <div className="w-full max-w-2xl flex flex-wrap justify-between gap-4 mb-6 print:hidden">
        <Link href="/facturas" className="flex items-center gap-2 text-gray-700 bg-white px-4 py-2 rounded shadow hover:bg-gray-50 font-bold">
          <ArrowLeft size={20} /> Volver
        </Link>
        <div className="flex gap-3">
          {!editando && (
            <button onClick={iniciarEdicion} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded shadow hover:bg-gray-50 font-bold transition-colors">
              <Pencil size={20} /> Editar
            </button>
          )}
          <button onClick={imprimirPDF} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-bold transition-colors">
            <Printer size={20} /> Imprimir PDF
          </button>
        </div>
      </div>

      {/* Formulario de edición (no se imprime) */}
      {editando && (
        <form onSubmit={guardarEdicion} className="w-full max-w-2xl bg-white rounded shadow-xl p-6 mb-6 print:hidden border-t-4 border-yellow-500">
          <h3 className="text-lg font-extrabold text-gray-800 mb-4">Corregir datos antes de imprimir</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={edicion.nombre}
                onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Apellido</label>
              <input
                type="text"
                value={edicion.apellido}
                onChange={(e) => setEdicion({ ...edicion, apellido: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tarifa de Acueducto</label>
              <input
                type="number"
                min="0"
                step="1"
                value={edicion.monto}
                onChange={(e) => setEdicion({ ...edicion, monto: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Reconexión</label>
              <input
                type="number"
                min="0"
                step="1"
                value={edicion.reconexion}
                onChange={(e) => setEdicion({ ...edicion, reconexion: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Intereses de Mora</label>
              <input
                type="number"
                min="0"
                step="1"
                value={edicion.interesMora}
                onChange={(e) => setEdicion({ ...edicion, interesMora: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Multa</label>
              <input
                type="number"
                min="0"
                step="1"
                value={edicion.multa}
                onChange={(e) => setEdicion({ ...edicion, multa: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Matrícula</label>
              <input
                type="number"
                min="0"
                step="1"
                value={edicion.matricula}
                onChange={(e) => setEdicion({ ...edicion, matricula: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Meses en Deuda (1 a 12)</label>
              <input
                type="number"
                min="0"
                max="12"
                step="1"
                value={edicion.mesesEnDeuda}
                onChange={(e) => setEdicion({ ...edicion, mesesEnDeuda: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo indica la cantidad de meses, no suma valor. Ajusta la Tarifa de Acueducto manualmente según los meses en deuda.
              </p>
            </div>
          </div>

          <p className="text-right font-bold text-gray-700 mb-4">
            Total de esta factura: <span className="text-blue-700 text-lg">${totalEdicion.toLocaleString('es-CO')}</span>
          </p>

          {mensajeEdit && (
            <p className={`mb-4 font-bold ${mensajeEdit.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {mensajeEdit}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={guardando} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:bg-blue-400 font-bold transition-colors">
              <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={cancelarEdicion} disabled={guardando} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded shadow hover:bg-gray-50 font-bold transition-colors">
              <X size={18} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Papel de la Factura: hoja media carta (21.6 x 14 cm), igual que en
          Impresión Masiva. En pantalla se ve del tamaño real del papel. */}
      <div className="w-full print:w-auto">
        <HojaMediaCarta dependencias={[datos, config, deudaTotal, mesesMora]}>
          <FacturaMediaCarta fac={datos} config={config} deudaTotal={deudaTotal} mesesMora={mesesMora} />
        </HojaMediaCarta>
      </div>
    </div>
  );
}