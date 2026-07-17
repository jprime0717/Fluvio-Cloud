// Lista blanca de correos con acceso a Configuración. Reemplaza el chequeo
// anterior (email.includes('super')), que le daba superadmin a cualquier
// cuenta cuyo correo contuviera "super" en cualquier parte.
const SUPERADMIN_EMAILS = [
  'judibermudez@utp.edu.co',
  'superadmin@miacueducto.com',
];

export function esSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return SUPERADMIN_EMAILS.includes(email.toLowerCase());
}
