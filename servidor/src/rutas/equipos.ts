import { Router } from "express";
import { ControladorEquipo } from "../controladores/ControladorEquipo.js";
import { autenticarSolicitud } from "../intermediarios/autenticacion.js";
import { envolverAsync } from "../intermediarios/envolverAsync.js";

const ruta = Router();
const controlador = new ControladorEquipo();

ruta.use(autenticarSolicitud);
ruta.get("/comparar", envolverAsync(controlador.comparar));
ruta.get("/escudos", envolverAsync(controlador.escudos));
ruta.get("/", envolverAsync(controlador.listar));
ruta.get("/:id", envolverAsync(controlador.obtener));
ruta.get("/:id/forma", envolverAsync(controlador.forma));

export default ruta;
