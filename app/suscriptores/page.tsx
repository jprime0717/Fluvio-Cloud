"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// 1. Definimos la interfaz para el tipado de TypeScript
interface Suscriptor {
  id: number; // o string, dependiendo de tu UUID en Supabase
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
  const [cargandoLista, setCargandoLista] = useState(true); // 2. Nuevo estado de carga

  const cargarSuscriptores = async () => {
    setCargandoLista(true);
    const { data, error } = await supabase
      .from('suscriptores')
      .select('*')
      .order('nombre_completo', { ascending: true });
    
    if (error) {
      console.error("Error cargando suscriptores:", error.message);
      // Opcional: mostrar un toast o mensaje de error en la UI
    } else if (data) {
      setSuscriptores(data as Suscriptor[]);
    }
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
        // Nota: acueducto_id lo asociaremos más adelante
      }]);

    if (!error) {
      setNombre('');
      setDocumento('');
      setDireccion('');
      await cargarSuscriptores(); 
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
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
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
                {/* 3. Renderizado condicional basado en el estado de carga */}
                {cargandoLista ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">
                      Cargando suscriptores...
                    </td>
                  </tr>
                ) : suscriptores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">
                      Aún no hay suscriptores registrados.
                    </td>
                  </tr>
                ) : (
                  suscriptores.map((sub) => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50 text-sm">
                      <td className="p-3">{sub.nombre_completo}</td>
                      <td className="p-3">{sub.documento}</td>
                      <td className="p-3">{sub.direccion}</td>
                      <td className="p-3">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
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