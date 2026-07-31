// Total real a cobrar/pagar de una factura: tarifa base + recargos opcionales
// (reconexión, intereses de mora, multa, matrícula). Centralizado aquí porque
// se repite en todas las pantallas que muestran o suman montos de facturas.
// Nota: "cobro_meses_anteriores" ya NO se suma aquí: ahora solo guarda la
// cantidad de meses en deuda (informativo), y su valor real se ingresa
// manualmente dentro de la Tarifa de Acueducto (monto).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function totalFactura(fac: any): number {
  return (
    Number(fac.monto) +
    Number(fac.reconexion || 0) +
    Number(fac.interes_mora || 0) +
    Number(fac.multa || 0) +
    Number(fac.matricula || 0)
  );
}
