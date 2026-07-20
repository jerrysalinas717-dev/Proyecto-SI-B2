import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ControladorAutenticacion } from "../controladores/ControladorAutenticacion.js";
import { autenticarSolicitud } from "../intermediarios/autenticacion.js";
import { envolverAsync } from "../intermediarios/envolverAsync.js";

const ruta = Router(); const c = new ControladorAutenticacion();
const limitar = rateLimit({ windowMs: 15*60*1000, limit: 20 });
ruta.post("/registrar", limitar, envolverAsync(c.registrar));
ruta.post("/iniciar-sesion", limitar, envolverAsync(c.iniciarSesion));
ruta.get("/perfil", autenticarSolicitud, envolverAsync(c.perfil));
export default ruta;
