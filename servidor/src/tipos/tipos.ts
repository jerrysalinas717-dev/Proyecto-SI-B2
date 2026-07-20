import type { Request } from "express";

export interface UsuarioSeguro {
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  rol: "ADMINISTRADOR" | "ANALISTA";
  estaActivo: boolean;
  fechaCreacion?: string;
}

export interface UsuarioConHash extends UsuarioSeguro {
  contrasenaHash: string;
}

export interface SolicitudConUsuario extends Request {
  usuario: UsuarioSeguro;
}

export interface ConsultaPaginada {
  pagina: number;
  limite: number;
  busqueda?: string;
}

export interface PrediccionCreada {
  prediccionId: number;
  resultadoPredicho: string;
  nivelConfianza: string;
  probabilidadLocal: number;
  probabilidadEmpate: number;
  probabilidadVisitante: number;
}
