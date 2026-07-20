import type { NextFunction, Request, Response } from "express";
import { RepositorioUsuario } from "../repositorios/RepositorioUsuario.js";
import type { SolicitudConUsuario } from "../tipos/tipos.js";
import { verificarToken } from "../utilidades/seguridad.js";

export async function autenticarSolicitud(
  solicitud: Request,
  respuesta: Response,
  siguiente: NextFunction
) {
  try {
    const cabecera = solicitud.headers.authorization;
    if (!cabecera?.startsWith("Bearer ")) {
      return respuesta.status(401).json({
        exito: false,
        mensaje: "Token requerido",
        errores: [],
        fecha: new Date().toISOString()
      });
    }

    const datos = verificarToken(cabecera.slice(7));
    const usuario = await new RepositorioUsuario().obtenerPorId(datos.usuarioId);
    if (!usuario || !usuario.estaActivo) {
      return respuesta.status(401).json({
        exito: false,
        mensaje: "Usuario inactivo o inexistente",
        errores: [],
        fecha: new Date().toISOString()
      });
    }

    (solicitud as SolicitudConUsuario).usuario = usuario;
    siguiente();
  } catch {
    respuesta.status(401).json({
      exito: false,
      mensaje: "Token invalido o expirado",
      errores: [],
      fecha: new Date().toISOString()
    });
  }
}

export function autorizarRol(roles: string[]) {
  return (solicitud: Request, respuesta: Response, siguiente: NextFunction) => {
    const usuario = (solicitud as SolicitudConUsuario).usuario;
    if (!usuario || !roles.includes(usuario.rol)) {
      return respuesta.status(403).json({
        exito: false,
        mensaje: "No tienes permisos para esta accion",
        errores: [],
        fecha: new Date().toISOString()
      });
    }
    siguiente();
  };
}
