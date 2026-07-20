import { Router } from "express";
import { ControladorTablero } from "../controladores/ControladorTablero.js";
import { autenticarSolicitud } from "../intermediarios/autenticacion.js";
import { envolverAsync } from "../intermediarios/envolverAsync.js";

const ruta = Router();
const controlador = new ControladorTablero();

ruta.use(autenticarSolicitud);
ruta.get("/anios", envolverAsync(controlador.anios));
ruta.get("/resumen", envolverAsync(controlador.resumen));
ruta.get("/mejores-equipos", envolverAsync(controlador.mejoresEquipos));
ruta.get("/tendencia-goles", envolverAsync(controlador.tendenciaGoles));
ruta.get("/distribucion-resultados", envolverAsync(controlador.distribucionResultados));
ruta.get("/distribucion-eventos", envolverAsync(controlador.distribucionEventos));
ruta.get("/ligas", envolverAsync(controlador.ligas));
ruta.get("/comparacion-equipos", envolverAsync(controlador.comparacionEquipos));

export default ruta;
