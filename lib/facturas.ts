// Total real a cobrar/pagar de una factura: tarifa base + recargos opcionales
// (reconexión, intereses de mora, multa, cobro de meses anteriores). Centralizado
// aquí porque se repite en todas las pantallas que muestran o suman montos de facturas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function totalFactura(fac: any): number {
  return (
    Number(fac.monto) +
    Number(fac.reconexion || 0) +
    Number(fac.interes_mora || 0) +
    Number(fac.multa || 0) +
    Number(fac.cobro_meses_anteriores || 0)
  );
}
