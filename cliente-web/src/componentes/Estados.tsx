export function CargadorEsqueleto(){ return <div className="esqueleto" aria-label="Cargando"/>; }
export function MensajeVacio({texto}:{texto:string}){ return <div className="mensaje">{texto}</div>; }
export function MensajeError({texto}:{texto:string}){ return <div className="mensaje error">{texto}</div>; }
