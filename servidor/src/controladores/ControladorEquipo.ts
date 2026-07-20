import type { Request, Response } from "express";
import { esquemaPaginacion } from "../esquemas/esquemas.js";
import { RepositorioEquipo } from "../repositorios/RepositorioEquipo.js";
import { ServicioEscudoEquipo } from "../servicios/ServicioEscudoEquipo.js";
import { ErrorAplicacion } from "../utilidades/ErrorAplicacion.js";

export class ControladorEquipo {
  private repositorio = new RepositorioEquipo();
  private servicioEscudo = new ServicioEscudoEquipo();

  listar = async (solicitud: Request, respuesta: Response) => {
    const filtros = esquemaPaginacion.parse(solicitud.query);
    respuesta.json({
      exito: true,
      datos: await this.repositorio.listar(filtros)
    });
  };

  escudos = async (solicitud: Request, respuesta: Response) => {
    const ids = String(solicitud.query.ids ?? "")
      .split(",")
      .map((valor) => Number(valor.trim()))
      .filter((valor) => Number.isInteger(valor) && valor > 0);

    const idsUnicos = [...new Set(ids)].slice(0, 20);
    if (idsUnicos.length === 0) {
      throw new ErrorAplicacion("Debes indicar al menos un identificador de equipo", 400);
    }

    const equipos = await this.repositorio.obtenerPorIds(idsUnicos);
    const datos = await Promise.all(
      equipos.map(async (equipo) => ({
        equipoId: equipo.equipoId,
        nombreEquipo: equipo.nombreEquipo,
        urlEscudo: await this.servicioEscudo.buscar(equipo.nombreEquipo)
      }))
    );

    respuesta.json({ exito: true, datos });
  };

  obtener = async (solicitud: Request, respuesta: Response) => {
    const equipo = await this.repositorio.obtenerPorId(Number(solicitud.params.id));
    if (!equipo) throw new ErrorAplicacion("Equipo no encontrado", 404);
    respuesta.json({ exito: true, datos: equipo });
  };

  forma = async (solicitud: Request, respuesta: Response) => {
    const forma = await this.repositorio.obtenerForma(Number(solicitud.params.id));
    if (!forma) throw new ErrorAplicacion("No existe historial para el equipo", 404);
    respuesta.json({ exito: true, datos: forma });
  };

  comparar = async (solicitud: Request, respuesta: Response) => {
    const local = Number(solicitud.query.equipoLocalId);
    const visitante = Number(solicitud.query.equipoVisitanteId);
    if (!Number.isInteger(local) || !Number.isInteger(visitante) || local <= 0 || visitante <= 0) {
      throw new ErrorAplicacion("Debes indicar equipoLocalId y equipoVisitanteId validos", 400);
    }
    if (local === visitante) throw new ErrorAplicacion("Los equipos deben ser diferentes", 400);
    respuesta.json({
      exito: true,
      datos: await this.repositorio.comparar(local, visitante)
    });
  };
}
