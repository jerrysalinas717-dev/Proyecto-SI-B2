import { useQuery } from "@tanstack/react-query";
import { pedirApi } from "../api/clienteApi";
export default function PaginaEventos(){ const q=useQuery({queryKey:["eventos"],queryFn:()=>pedirApi<any[]>("/eventos?limite=50")}); return <div className="pagina"><h1>Eventos</h1>{q.data?.map(e=><article className="fila" key={e.eventoId}><strong>{e.tipoEvento}</strong><span>{e.nombreEquipo} · minuto {e.minutoEvento}</span></article>)}</div>; }
