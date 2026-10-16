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

// Indica si una factura Pendiente cuenta en la deuda de la factura del período
// (mes/año) dado: la propia factura de ese período, o un saldo anterior.
// Como se factura mes vencido (en octubre se cobra septiembre), el mes en
// curso y el mes anterior nunca son "saldo anterior": solo cuentan los meses
// previos a ambos (en octubre, agosto hacia atrás).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cuentaEnDeuda(fac: any, mes: number, anio: number): boolean {
  if (Number(fac.anio) === anio && Number(fac.mes) === mes) return true;
  const hoy = new Date();
  const mesVencido = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const periodo = Number(fac.anio) * 12 + Number(fac.mes);
  const limite = Math.min(anio * 12 + mes, mesVencido.getFullYear() * 12 + mesVencido.getMonth() + 1);
  return periodo < limite;
}
