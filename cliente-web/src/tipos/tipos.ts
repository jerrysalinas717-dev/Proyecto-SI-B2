export interface UsuarioSesion { usuarioId:number; nombreCompleto:string; correo:string; rol:string }
export interface RespuestaApi<T> { exito:boolean; datos:T; mensaje?:string }
export interface Equipo { equipoId:number; nombreEquipo:string; pais:string; liga:string }
