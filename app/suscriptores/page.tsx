"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { compararDirecciones } from '@/lib/direccion';

interface Suscriptor {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  nuid: string;
  numero_medidor: string;
  direccion: string;
  tipo_suscriptor: string;
  estado: string;
}

export default function Suscriptores() {
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([]);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nuid, setNuid] = useState('');
  const [numero_medidor, setNumeroMedidor] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipo, setTipo] = useState('Residencial');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true); // Ya inicia en true

  const ordenarPorManzana = (lista: Suscriptor[]) => {
    return [...lista].sort((a, b) => compararDirecciones(a.direccion, b.direccion));
  };

  // Separamos la consulta para evitar el warning de ESLint
  const obtenerDatos = async () => {
    const { data, error } = await supabase
      .from('suscriptores')
      .select('*');

    if (error) console.error("Error cargando suscriptores:", error.message);
    else if (data) setSuscriptores(ordenarPorManzana(data as Suscriptor[]));
  };

  useEffect(() => {
    const init = async () => {
      await obtenerDatos();
      setCargandoLista(false); // Solo actualizamos al terminar de cargar
    };
    init();
  }, []);

  const limpiarFormulario = () => {
    setNombre(''); setApellido(''); setTelefono(''); setNuid(''); setDireccion(''); setNumeroMedidor(''); setTipo('Residencial');
    setEditandoId(null);
  };

  const editarSuscriptor = (sub: Suscriptor) => {
    setEditandoId(sub.id);
    setNombre(sub.nombre);
    setApellido(sub.apellido);
    setTelefono(sub.telefono || '');
    setNuid(sub.nuid || '');
    setNumeroMedidor(sub.numero_medidor || '');
    setDireccion(sub.direccion);
    setTipo(sub.tipo_suscriptor || 'Residencial');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarSuscriptor = async (sub: Suscriptor) => {
    if (!confirm(`¿Estás seguro de eliminar a ${sub.nombre} ${sub.apellido}? Esta acción no se puede deshacer.`)) return;

    const { error } = await supabase
      .from('suscriptores')
      .delete()
      .eq('id', sub.id);

    if (!error) {
      if (editandoId === sub.id) limpiarFormulario();
      await obtenerDatos();
    } else {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const guardarSuscriptor = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const payload = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim() || null,
      nuid: nuid.trim() || null,
      numero_medidor: numero_medidor.trim(),
      direccion: direccion.trim(),
      tipo_suscriptor: tipo
    };

    const { error } = editandoId
      ? await supabase.from('suscriptores').update(payload).eq('id', editandoId)
      : await supabase.from('suscriptores').insert([payload]);

    if (!error) {
      limpiarFormulario();
      await obtenerDatos(); // Recargamos silenciosamente sin mostrar el spinner
    } else {
      alert('Error al guardar: ' + error.message);
    }

    setGuardando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 lg:gap-8 items-start">

        {/* Formulario */}
        <div className="w-full bg-white p-6 rounded-lg shadow-md h-fit border border-gray-200 lg:sticky lg:top-8">
          <h2 className="text-xl font-extrabold text-gray-900 mb-5">
            {editandoId ? 'Editar Suscriptor' : 'Nuevo Suscriptor'}
          </h2>
          <form onSubmit={guardarSuscriptor} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Nombre</label>
              <input
                type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-black font-medium"
                style={{ color: '#000000' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Apellido</label>
              <input
                type="text" required value={apellido} onChange={(e) => setApellido(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-black font-medium"
                style={{ color: '#000000' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Teléfono</label>
              <input
                type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-black font-medium"
                style={{ color: '#000000' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">NUID</label>
              <input
                type="text" value={nuid} onChange={(e) => setNuid(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-black font-medium"
                style={{ color: '#000000' }}
                placeholder="Ej: A-001"
              />
            </div>
            {/* CAMPO VISUAL DEL MEDIDOR */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Número de Medidor (Opcional)</label>
              <input 
                type="text" value={numero_medidor} onChange={(e) => setNumeroMedidor(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-black font-medium" 
                style={{ color: '#000000' }}
                placeholder="Ej: 1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Dirección / Predio</label>
              <input 
                type="text" required value={direccion} onChange={(e) => setDireccion(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-black font-medium" 
                style={{ color: '#000000' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Tipo de Suscriptor</label>
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-black font-medium"
                style={{ color: '#000000' }}
              >
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="submit" disabled={guardando}
                className="flex-1 bg-blue-600 text-white font-bold p-3 rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                {guardando ? 'Guardando...' : editandoId ? 'Actualizar Suscriptor' : 'Guardar Suscriptor'}
              </button>
              {editandoId && (
                <button
                  type="button" onClick={limpiarFormulario} disabled={guardando}
                  className="bg-gray-200 text-gray-800 font-bold p-3 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Suscriptores */}
        <div className="w-full min-w-0 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Lista de Suscriptores ({suscriptores.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">Suscriptor</th>
                  <th className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">NUID</th>
                  <th className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">Teléfono</th>
                  <th className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">Medidor</th>
                  <th className="px-4 py-3 text-sm font-bold text-gray-900">Dirección</th>
                  <th className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">Tipo / Estado</th>
                  <th className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-900 divide-y divide-gray-200">
                {cargandoLista ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center font-medium text-gray-600">
                      Cargando suscriptores...
                    </td>
                  </tr>
                ) : suscriptores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center font-medium text-gray-600">
                      Aún no hay suscriptores registrados.
                    </td>
                  </tr>
                ) : (
                  suscriptores.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 text-sm">
                      <td className="px-4 py-3.5 max-w-[140px] truncate" title={`${sub.nombre} ${sub.apellido}`}>
                        <p className="font-semibold text-gray-900 truncate">{sub.nombre} {sub.apellido}</p>
                      </td>
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap">{sub.nuid || 'N/A'}</td>
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap">{sub.telefono || 'N/A'}</td>
                      <td className="px-4 py-3.5 font-medium text-gray-600 whitespace-nowrap">{sub.numero_medidor || 'N/A'}</td>
                      <td className="px-4 py-3.5 font-medium max-w-[180px] truncate" title={sub.direccion}>{sub.direccion}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            sub.tipo_suscriptor === 'Comercial' ? 'bg-blue-100 text-blue-800' :
                            sub.tipo_suscriptor === 'Industrial' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sub.tipo_suscriptor || 'Residencial'}
                          </span>
                          <span className="bg-green-100 text-green-900 font-bold px-2 py-1 rounded text-xs">
                            {sub.estado || 'Activo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => editarSuscriptor(sub)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-xs px-2 py-1 rounded hover:bg-blue-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarSuscriptor(sub)}
                            className="text-red-600 hover:text-red-800 font-bold text-xs px-2 py-1 rounded hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}