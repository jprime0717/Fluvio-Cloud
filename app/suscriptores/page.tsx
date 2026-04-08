"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Suscriptor {
  id: number; 
  nombre_completo: string;
  documento: string;
  direccion: string;
  estado: string;
}

export default function Suscriptores() {
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([]);
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [direccion, setDireccion] = useState('');
  
  const [guardando, setGuardando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);

  const cargarSuscriptores = async () => {
    setCargandoLista(true);
    const { data, error } = await supabase
      .from('suscriptores')
      .select('*')
      .order('nombre_completo', { ascending: true });
    
    if (error) console.error("Error cargando suscriptores:", error.message);
    else if (data) setSuscriptores(data as Suscriptor[]);
    
    setCargandoLista(false);
  };

  useEffect(() => {
    cargarSuscriptores();
  }, []);

  const guardarSuscriptor = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const { error } = await supabase
      .from('suscriptores')
      .insert([{ 
        nombre_completo: nombre.trim(), 
        documento: documento.trim(), 
        direccion: direccion.trim() 
      }]);

    if (!error) {
      setNombre(''); setDocumento(''); setDireccion('');
      await cargarSuscriptores(); 
    } else {
      alert('Error al guardar: ' + error.message);
    }
    
    setGuardando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Formulario */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md h-fit border border-gray-200">
          <h2 className="text-xl font-extrabold text-gray-900 mb-5">Nuevo Suscriptor</h2>
          <form onSubmit={guardarSuscriptor} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Nombre Completo</label>
              <input 
                type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-900 font-medium bg-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Documento / Cédula</label>
              <input 
                type="text" required value={documento} onChange={(e) => setDocumento(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-900 font-medium bg-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Dirección / Predio</label>
              <input 
                type="text" required value={direccion} onChange={(e) => setDireccion(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-900 font-medium bg-white" 
              />
            </div>
            <button 
              type="submit" disabled={guardando}
              className="w-full bg-blue-600 text-white font-bold p-3 rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors mt-2"
            >
              {guardando ? 'Guardando...' : 'Guardar Suscriptor'}
            </button>
          </form>
        </div>

        {/* Lista de Suscriptores */}
        <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Lista de Suscriptores ({suscriptores.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="p-3 text-sm font-bold text-gray-900">Nombre</th>
                  <th className="p-3 text-sm font-bold text-gray-900">Documento</th>
                  <th className="p-3 text-sm font-bold text-gray-900">Dirección</th>
                  <th className="p-3 text-sm font-bold text-gray-900">Estado</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {cargandoLista ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center font-medium text-gray-600">
                      Cargando suscriptores...
                    </td>
                  </tr>
                ) : suscriptores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center font-medium text-gray-600">
                      Aún no hay suscriptores registrados.
                    </td>
                  </tr>
                ) : (
                  suscriptores.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-200 hover:bg-gray-50 text-sm">
                      <td className="p-3 font-semibold">{sub.nombre_completo}</td>
                      <td className="p-3 font-medium">{sub.documento}</td>
                      <td className="p-3 font-medium">{sub.direccion}</td>
                      <td className="p-3">
                        <span className="bg-green-100 text-green-900 font-bold px-2 py-1 rounded text-xs">
                          {sub.estado || 'Activo'}
                        </span>
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