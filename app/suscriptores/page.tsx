"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Suscriptores() {
  const [suscriptores, setSuscriptores] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Función para traer los suscriptores desde Supabase
  const cargarSuscriptores = async () => {
    const { data, error } = await supabase
      .from('suscriptores')
      .select('*')
      .order('nombre_completo', { ascending: true });
    
    if (data) setSuscriptores(data);
  };

  // Se ejecuta al cargar la página
  useEffect(() => {
    cargarSuscriptores();
  }, []);

  // Función para guardar un nuevo suscriptor
  const guardarSuscriptor = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const { error } = await supabase
      .from('suscriptores')
      .insert([{ 
        nombre_completo: nombre, 
        documento: documento, 
        direccion: direccion 
        // Nota: acueducto_id lo asociaremos más adelante cuando tengamos la sesión multi-tenant lista
      }]);

    if (!error) {
      setNombre('');
      setDocumento('');
      setDireccion('');
      cargarSuscriptores(); // Recargamos la lista
    } else {
      alert('Error al guardar: ' + error.message);
    }
    setGuardando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Formulario (Lado Izquierdo) */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Nuevo Suscriptor</h2>
          <form onSubmit={guardarSuscriptor} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre Completo</label>
              <input 
                type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Documento / Cédula</label>
              <input 
                type="text" required value={documento} onChange={(e) => setDocumento(e.target.value)}
                className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Dirección / Predio</label>
              <input 
                type="text" required value={direccion} onChange={(e) => setDireccion(e.target.value)}
                className="w-full border p-2 rounded focus:border-blue-500 focus:outline-none" 
              />
            </div>
            <button 
              type="submit" disabled={guardando}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {guardando ? 'Guardando...' : 'Guardar Suscriptor'}
            </button>
          </form>
        </div>

        {/* Lista de Suscriptores (Lado Derecho) */}
        <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Lista de Suscriptores ({suscriptores.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm">
                  <th className="p-3 border-b">Nombre</th>
                  <th className="p-3 border-b">Documento</th>
                  <th className="p-3 border-b">Dirección</th>
                  <th className="p-3 border-b">Estado</th>
                </tr>
              </thead>
              <tbody>
                {suscriptores.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-3">{sub.nombre_completo}</td>
                    <td className="p-3">{sub.documento}</td>
                    <td className="p-3">{sub.direccion}</td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {sub.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {suscriptores.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">
                      Aún no hay suscriptores registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}