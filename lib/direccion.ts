interface ManzanaInfo {
  manzana: string;
  casa: number;
  piso: number;
}

// Extrae manzana / casa / piso de direcciones tipo "MZ A CS 21 PISO 2, ..."
export function parseDireccion(direccion: string): ManzanaInfo | null {
  const match = direccion.match(/^MZ\s+([A-Za-z]+)\s+CS\s+(\d+)(?:\s+PISO\s+(\d+))?/i);
  if (!match) return null;
  return {
    manzana: match[1].toUpperCase(),
    casa: parseInt(match[2], 10),
    piso: match[3] ? parseInt(match[3], 10) : 0,
  };
}

// Ordena Mz A, Mz B, Mz C... y dentro de cada manzana por número de casa/piso.
// Direcciones que no siguen el formato "MZ X CS N" quedan al final, ordenadas alfabéticamente.
export function compararDirecciones(direccionA: string, direccionB: string): number {
  const da = parseDireccion(direccionA);
  const db = parseDireccion(direccionB);

  if (da && db) {
    if (da.manzana !== db.manzana) return da.manzana.localeCompare(db.manzana);
    if (da.casa !== db.casa) return da.casa - db.casa;
    if (da.piso !== db.piso) return da.piso - db.piso;
    return 0;
  }
  if (da && !db) return -1;
  if (!da && db) return 1;
  return direccionA.localeCompare(direccionB);
}
