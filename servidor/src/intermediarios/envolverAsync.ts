import type { NextFunction, Request, RequestHandler, Response } from "express";

export function envolverAsync(manejador: (solicitud: Request, respuesta: Response, siguiente: NextFunction) => Promise<unknown>): RequestHandler {
  return (solicitud, respuesta, siguiente) => {
    Promise.resolve(manejador(solicitud, respuesta, siguiente)).catch(siguiente);
  };
}

