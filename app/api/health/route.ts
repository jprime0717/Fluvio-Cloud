import { supabase } from '@/lib/supabase';

// Endpoint de salud: confirma que la app responde y que Supabase está activo.
// Lo consumen el cron diario de Vercel (vercel.json) y el workflow de GitHub
// Actions (.github/workflows/health-check.yml). La consulta diaria también
// evita que el plan gratuito de Supabase pause el proyecto por inactividad.
//
// Seguridad: es público a propósito (lo usan monitores externos), por eso
// - solo usa la clave anon, sujeta a RLS;
// - hace un conteo HEAD: no lee ni devuelve filas;
// - responde únicamente el estado, sin detalles del error;
// - reutiliza el resultado 60 s para que no sirva para cargar la base.

const TTL_MS = 60_000;
const TIMEOUT_MS = 8_000;

let ultimo: { ok: boolean; en: number } | null = null;

async function baseDeDatosActiva(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('acueductos')
      .select('id', { count: 'exact', head: true })
      .abortSignal(AbortSignal.timeout(TIMEOUT_MS));
    if (error) console.error('[health] Supabase respondió con error:', error.message);
    return !error;
  } catch (e) {
    console.error('[health] Supabase no responde:', e);
    return false;
  }
}

export async function GET() {
  const ahora = Date.now();
  if (!ultimo || ahora - ultimo.en > TTL_MS) {
    ultimo = { ok: await baseDeDatosActiva(), en: ahora };
  }

  return Response.json(
    {
      status: ultimo.ok ? 'ok' : 'error',
      database: ultimo.ok ? 'up' : 'down',
      checkedAt: new Date(ultimo.en).toISOString(),
    },
    {
      status: ultimo.ok ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
