import { useQuery } from "@tanstack/react-query";
import { pedirApi } from "../api/clienteApi";
export default function PaginaUsuarios(){ const q=useQuery({queryKey:["usuarios"],queryFn:()=>pedirApi<any[]>("/usuarios")}); return <div className="pagina"><h1>Usuarios</h1>{q.data?.map(u=><article className="fila" key={u.usuarioId}><strong>{u.nombreCompleto}</strong><span>{u.correo} · {u.rol}</span></article>)}</div>; }
