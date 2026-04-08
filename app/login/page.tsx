"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError('Correo o contraseña incorrectos.');
      setCargando(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-900 mb-2">Fluvio-Cloud</h1>
          {/* TEXTO MÁS OSCURO AQUÍ */}
          <p className="text-gray-900 font-medium">Ingresa a tu panel de administración</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={iniciarSesion} className="space-y-6">
          <div>
            {/* LABELS MÁS GRUESOS Y OSCUROS */}
            <label className="text-gray-900 text-sm font-semibold mb-1 block">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-700" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                /* INPUTS CON TEXTO OSCURO Y PLACEHOLDER VISIBLE */
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white placeholder-gray-500 font-medium"
                placeholder="admin@acueducto.com"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-900 text-sm font-semibold mb-1 block">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-700" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 bg-white placeholder-gray-500 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg flex justify-center items-center"
          >
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}