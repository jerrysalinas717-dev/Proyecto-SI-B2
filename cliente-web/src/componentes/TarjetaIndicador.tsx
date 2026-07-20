import type React from "react";
export function TarjetaIndicador({titulo,valor,detalle}:{titulo:string;valor:React.ReactNode;detalle?:string}){ return <section className="tarjeta"><span>{titulo}</span><strong>{valor}</strong>{detalle && <small>{detalle}</small>}</section>; }

