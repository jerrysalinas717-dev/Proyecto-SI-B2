import type { Request, Response } from "express";
import { RepositorioEvento } from "../repositorios/RepositorioEvento.js";
import { ErrorAplicacion } from "../utilidades/ErrorAplicacion.js";

export class ControladorEvento {
  private repositorio = new RepositorioEvento();

  listar = async (solicitud: Request, respuesta: Response) => {
    respuesta.json({
      exito: true,
      datos: await this.repositorio.listar(solicitud.query)
    });
  };

  obtener = async (solicitud: Request, respuesta: Response) => {
    const evento = await this.repositorio.obtenerPorId(Number(solicitud.params.id));
    if (!evento) throw new ErrorAplicacion("Evento no encontrado", 404);
    respuesta.json({ exito: true, datos: evento });
  };
}
