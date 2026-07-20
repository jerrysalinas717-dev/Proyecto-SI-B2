import type { Request, Response } from "express";
import { RepositorioEquipo } from "../repositorios/RepositorioEquipo.js";
import { RepositorioTablero } from "../repositorios/RepositorioTablero.js";
import { ErrorAplicacion } from "../utilidades/ErrorAplicacion.js";

function leerAnio(solicitud: Request): number | undefined {
  if (solicitud.query.anio === undefined || solicitud.query.anio === "") {
    return undefined;
  }

  const anio = Number(solicitud.query.anio);
  if (!Number.isInteger(anio) || anio < 1900 || anio > 2200) {
    throw new ErrorAplicacion("El anio indicado no es valido", 400);
  }

  return anio;
}

export class ControladorTablero {
  private repositorio = new RepositorioTablero();
  private repositorioEquipo = new RepositorioEquipo();

  anios = async (_solicitud: Request, respuesta: Response) =>
    respuesta.json({ exito: true, datos: await this.repositorio.aniosDisponibles() });

  resumen = async (solicitud: Request, respuesta: Response) =>
    respuesta.json({
      exito: true,
      datos: await this.repositorio.resumen(leerAnio(solicitud))
    });

  mejoresEquipos = async (solicitud: Request, respuesta: Response) =>
    respuesta.json({
      exito: true,
      datos: await this.repositorio.mejoresEquipos(leerAnio(solicitud))
    });

  tendenciaGoles = async (_solicitud: Request, respuesta: Response) =>
    respuesta.json({ exito: true, datos: await this.repositorio.tendenciaGoles() });

  distribucionResultados = async (solicitud: Request, respuesta: Response) =>
    respuesta.json({
      exito: true,
      datos: await this.repositorio.distribucionResultados(leerAnio(solicitud))
    });

  distribucionEventos = async (solicitud: Request, respuesta: Response) =>
    respuesta.json({
      exito: true,
      datos: await this.repositorio.distribucionEventos(leerAnio(solicitud))
    });

  ligas = async (_solicitud: Request, respuesta: Response) =>
    respuesta.json({ exito: true, datos: await this.repositorio.ligas() });

  comparacionEquipos = async (solicitud: Request, respuesta: Response) => {
    const local = Number(solicitud.query.equipoLocalId);
    const visitante = Number(solicitud.query.equipoVisitanteId);
    if (!Number.isInteger(local) || !Number.isInteger(visitante) || local <= 0 || visitante <= 0) {
      throw new ErrorAplicacion("Debes indicar equipoLocalId y equipoVisitanteId validos", 400);
    }
    respuesta.json({
      exito: true,
      datos: await this.repositorioEquipo.comparar(local, visitante)
    });
  };
}
