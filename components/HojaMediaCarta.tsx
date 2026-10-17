"use client";

import { useLayoutEffect, useRef, useState } from 'react';

// Medidas de la hoja media carta (8.5in x 5.5in ≈ 21.6cm x 14cm, horizontal)
// y su margen interno. Deben coincidir con las clases .hoja-media-carta de
// globals.css. 96px = 1in por convención CSS, tanto en pantalla como al imprimir.
const PX_POR_MM = 96 / 25.4;
const MARGEN_MM = 7;
const ANCHO_UTIL_PX = (215.9 - MARGEN_MM * 2) * PX_POR_MM;
// Se resta 1mm extra al alto (la hoja mide 139mm en vez de 139.7mm en
// globals.css) para que el redondeo del navegador nunca genere una hoja en blanco.
const ALTO_UTIL_PX = (139 - MARGEN_MM * 2) * PX_POR_MM;

// Una hoja media carta: en pantalla se ve del tamaño real del papel (vista
// previa) y al imprimir ocupa exactamente una página. Si el contenido (por
// ejemplo una factura con muchos recargos) queda más alto que la hoja, se
// encoge con "zoom" justo lo necesario para que quepa entero, y se ensancha en
// la misma proporción para que siga ocupando todo el ancho del papel.
// Usamos "zoom" y no "transform: scale" porque los motores de impresión no
// reducen el espacio que ocupa un elemento transformado al paginar.
export default function HojaMediaCarta({ children, dependencias }: { children: React.ReactNode; dependencias: unknown[] }) {
  const contenidoRef = useRef<HTMLDivElement | null>(null);
  const [escala, setEscala] = useState(1);
  const [medir, setMedir] = useState(true);

  // Primero quitamos el zoom y luego medimos el alto natural del contenido
  // (medir un elemento que ya tiene zoom da valores poco confiables). Ambos
  // pasos ocurren antes de pintar, así que no se ve ningún parpadeo.
  useLayoutEffect(() => {
    setEscala(1);
    setMedir(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useLayoutEffect(() => {
    if (!medir || !contenidoRef.current) return;
    const alto = contenidoRef.current.scrollHeight;
    setEscala(alto > ALTO_UTIL_PX ? ALTO_UTIL_PX / alto : 1);
    setMedir(false);
  }, [medir]);

  return (
    <div className="hoja-media-carta-scroll">
      <div className="hoja-media-carta" style={{ padding: `${MARGEN_MM}mm` }}>
        <div
          ref={contenidoRef}
          style={escala < 1 ? { zoom: escala, width: ANCHO_UTIL_PX / escala } : { width: ANCHO_UTIL_PX }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
