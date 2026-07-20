import type { Request, Response } from "express";
import { esquemaInicioSesion, esquemaRegistro } from "../esquemas/esquemas.js";
import { ServicioAutenticacion } from "../servicios/ServicioAutenticacion.js";
import type { SolicitudConUsuario } from "../tipos/tipos.js";

export class ControladorAutenticacion {
  private servicio = new ServicioAutenticacion();

  registrar = async (solicitud: Request, respuesta: Response) => {
    const datos = esquemaRegistro.parse(solicitud.body);
    respuesta.status(201).json({
      exito: true,
      datos: await this.servicio.registrar(datos)
    });
  };

  iniciarSesion = async (solicitud: Request, respuesta: Response) => {
    const datos = esquemaInicioSesion.parse(solicitud.body);
    respuesta.json({
      exito: true,
      datos: await this.servicio.iniciarSesion(datos)
    });
  };

  perfil = async (solicitud: Request, respuesta: Response) => {
    respuesta.json({
      exito: true,
      datos: (solicitud as SolicitudConUsuario).usuario
    });
  };
}
