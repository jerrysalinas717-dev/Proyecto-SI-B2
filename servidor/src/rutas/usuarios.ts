import { Router } from "express";
import { ControladorPrediccion } from "../controladores/ControladorPrediccion.js";
import { ControladorUsuario } from "../controladores/ControladorUsuario.js";
import { autenticarSolicitud, autorizarRol } from "../intermediarios/autenticacion.js";
import { envolverAsync } from "../intermediarios/envolverAsync.js";

const ruta = Router();
const controladorUsuario = new ControladorUsuario();
const controladorPrediccion = new ControladorPrediccion();

ruta.use(autenticarSolicitud);
ruta.get("/:usuarioId/predicciones", envolverAsync(controladorPrediccion.listarPorUsuario));

ruta.use(autorizarRol(["ADMINISTRADOR"]));
ruta.get("/", envolverAsync(controladorUsuario.listar));
ruta.get("/:id", envolverAsync(controladorUsuario.obtener));
ruta.post("/", envolverAsync(controladorUsuario.crear));
ruta.put("/:id", envolverAsync(controladorUsuario.actualizar));
ruta.delete("/:id", envolverAsync(controladorUsuario.desactivar));

export default ruta;
