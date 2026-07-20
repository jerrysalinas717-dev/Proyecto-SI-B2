import type { Request, Response } from "express";
import { esquemaPaginacion, esquemaPrediccion } from "../esquemas/esquemas.js";
import { RepositorioPrediccion } from "../repositorios/RepositorioPrediccion.js";
import { ServicioPrediccion } from "../servicios/ServicioPrediccion.js";
import type { SolicitudConUsuario } from "../tipos/tipos.js";
import { ErrorAplicacion } from "../utilidades/ErrorAplicacion.js";

export class ControladorPrediccion {
  private servicio = new ServicioPrediccion();
  private repositorio = new RepositorioPrediccion();

  crear = async (solicitud: Request, respuesta: Response) => {
    const datos = esquemaPrediccion.parse(solicitud.body);
    const usuario = (solicitud as SolicitudConUsuario).usuario;
    respuesta.status(201).json({
      exito: true,
      datos: await this.servicio.crear(
        usuario.usuarioId,
        datos.equipoLocalId,
        datos.equipoVisitanteId
      )
    });
  };

  listar = async (solicitud: Request, respuesta: Response) => {
    const usuario = (solicitud as SolicitudConUsuario).usuario;
    const filtros = esquemaPaginacion.parse(solicitud.query);
    respuesta.json({
      exito: true,
      datos: await this.repositorio.listar(
        usuario.usuarioId,
        usuario.rol === "ADMINISTRADOR",
        filtros.pagina,
        filtros.limite
      )
    });
  };

  listarPorUsuario = async (solicitud: Request, respuesta: Response) => {
    const usuario = (solicitud as SolicitudConUsuario).usuario;
    const usuarioObjetivoId = Number(solicitud.params.usuarioId);
    if (usuario.rol !== "ADMINISTRADOR" && usuario.usuarioId !== usuarioObjetivoId) {
      throw new ErrorAplicacion("No puedes consultar las predicciones de otro usuario", 403);
    }
    const filtros = esquemaPaginacion.parse(solicitud.query);
    respuesta.json({
      exito: true,
      datos: await this.repositorio.listar(
        usuario.usuarioId,
        usuario.rol === "ADMINISTRADOR",
        filtros.pagina,
        filtros.limite,
        usuarioObjetivoId
      )
    });
  };

  obtener = async (solicitud: Request, respuesta: Response) => {
    const usuario = (solicitud as SolicitudConUsuario).usuario;
    const prediccion = await this.repositorio.obtenerPorId(
      Number(solicitud.params.id),
      usuario.usuarioId,
      usuario.rol === "ADMINISTRADOR"
    );
    if (!prediccion) throw new ErrorAplicacion("Prediccion no encontrada", 404);
    respuesta.json({ exito: true, datos: prediccion });
  };
}
