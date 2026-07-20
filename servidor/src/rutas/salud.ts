import { Router } from "express";
import { probarConexion } from "../configuracion/baseDatos.js";
import { configuracion } from "../configuracion/configuracion.js";

const ruta = Router();

ruta.get("/", async (_solicitud, respuesta) => {
  let baseDatos: "activa" | "inactiva" = "inactiva";
  let prediccion: "activa" | "inactiva" = "inactiva";

  try {
    await probarConexion();
    baseDatos = "activa";
  } catch {
    baseDatos = "inactiva";
  }

  try {
    const estado = await fetch(`${configuracion.SERVICIO_PREDICCION_URL}/salud`, {
      signal: AbortSignal.timeout(2500)
    });
    prediccion = estado.ok ? "activa" : "inactiva";
  } catch {
    prediccion = "inactiva";
  }

  respuesta.json({
    exito: true,
    datos: {
      servidor: "activo",
      baseDatos,
      prediccion,
      fecha: new Date().toISOString()
    }
  });
});

export default ruta;
