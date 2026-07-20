import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { configuracion } from "../configuracion/configuracion.js";
import { ErrorAplicacion } from "../utilidades/ErrorAplicacion.js";

interface ErrorPostgres extends Error {
  code?: string;
  detail?: string;
}

export function manejarErrores(
  error: unknown,
  _solicitud: Request,
  respuesta: Response,
  _siguiente: NextFunction
) {
  let estado = 500;
  let mensaje = "Error interno del servidor";
  let errores: unknown[] = [];

  if (error instanceof ErrorAplicacion) {
    estado = error.estado;
    mensaje = error.message;
    errores = error.errores;
  } else if (error instanceof ZodError) {
    estado = 400;
    mensaje = "Los datos enviados no son validos";
    errores = error.issues.map((detalle) => ({
      campo: detalle.path.join("."),
      mensaje: detalle.message
    }));
  } else if (error instanceof Error) {
    const errorPostgres = error as ErrorPostgres;
    if (errorPostgres.code === "23505") {
      estado = 409;
      mensaje = "El registro ya existe";
    } else if (errorPostgres.code === "23503") {
      estado = 409;
      mensaje = "El registro esta relacionado con otros datos";
    } else if (error.message === "Origen no permitido por CORS") {
      estado = 403;
      mensaje = error.message;
    } else if (configuracion.ENTORNO !== "produccion") {
      mensaje = error.message;
    }
  }

  if (estado >= 500) {
    console.error(error);
  }

  respuesta.status(estado).json({
    exito: false,
    mensaje,
    errores,
    fecha: new Date().toISOString()
  });
}
