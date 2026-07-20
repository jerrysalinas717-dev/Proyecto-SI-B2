import { Router } from "express";
import { ControladorEvento } from "../controladores/ControladorEvento.js";
import { autenticarSolicitud } from "../intermediarios/autenticacion.js";
import { envolverAsync } from "../intermediarios/envolverAsync.js";
const ruta=Router(); const c=new ControladorEvento(); ruta.use(autenticarSolicitud); ruta.get("/", envolverAsync(c.listar)); ruta.get("/:id", envolverAsync(c.obtener)); export default ruta;
