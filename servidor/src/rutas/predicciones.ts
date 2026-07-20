import { Router } from "express";
import { ControladorPrediccion } from "../controladores/ControladorPrediccion.js";
import { autenticarSolicitud } from "../intermediarios/autenticacion.js";
import { envolverAsync } from "../intermediarios/envolverAsync.js";
const ruta=Router(); const c=new ControladorPrediccion(); ruta.use(autenticarSolicitud); ruta.post("/", envolverAsync(c.crear)); ruta.get("/", envolverAsync(c.listar)); ruta.get("/:id", envolverAsync(c.obtener)); export default ruta;
