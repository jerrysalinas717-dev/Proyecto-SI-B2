import type { Request, Response } from "express";
import {
  esquemaActualizarUsuario,
  esquemaCrearUsuario,
  esquemaPaginacion
} from "../esquemas/esquemas.js";
import { RepositorioUsuario } from "../repositorios/RepositorioUsuario.js";
import { ErrorAplicacion } from "../utilidades/ErrorAplicacion.js";
import { cifrarContrasena } from "../utilidades/seguridad.js";

export class ControladorUsuario {
  private repositorio = new RepositorioUsuario();

  listar = async (solicitud: Request, respuesta: Response) => {
    const filtros = esquemaPaginacion.parse(solicitud.query);
    respuesta.json({
      exito: true,
      datos: await this.repositorio.listar(filtros.pagina, filtros.limite, filtros.busqueda)
    });
  };

  obtener = async (solicitud: Request, respuesta: Response) => {
    const usuario = await this.repositorio.obtenerPorId(Number(solicitud.params.id));
    if (!usuario) throw new ErrorAplicacion("Usuario no encontrado", 404);
    respuesta.json({ exito: true, datos: usuario });
  };

  crear = async (solicitud: Request, respuesta: Response) => {
    const datos = esquemaCrearUsuario.parse(solicitud.body);
    const existe = await this.repositorio.obtenerPorCorreo(datos.correo);
    if (existe) throw new ErrorAplicacion("El correo ya esta registrado", 409);

    const contrasenaHash = await cifrarContrasena(datos.contrasena);
    const usuario = await this.repositorio.crear({
      nombreCompleto: datos.nombreCompleto,
      correo: datos.correo,
      contrasenaHash,
      rol: datos.rol
    });
    respuesta.status(201).json({ exito: true, datos: usuario });
  };

  actualizar = async (solicitud: Request, respuesta: Response) => {
    const datos = esquemaActualizarUsuario.parse(solicitud.body);
    const usuario = await this.repositorio.actualizar(Number(solicitud.params.id), datos);
    if (!usuario) throw new ErrorAplicacion("Usuario no encontrado", 404);
    respuesta.json({ exito: true, datos: usuario });
  };

  desactivar = async (solicitud: Request, respuesta: Response) => {
    const usuario = await this.repositorio.actualizar(Number(solicitud.params.id), {
      estaActivo: false
    });
    if (!usuario) throw new ErrorAplicacion("Usuario no encontrado", 404);
    respuesta.json({ exito: true, datos: usuario });
  };
}
