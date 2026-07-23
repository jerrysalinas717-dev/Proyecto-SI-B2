import { createRequire } from "node:module";
import { configuracionProcesamiento } from "../../utilidades/configuracion.mjs";
import { CargadorModelo } from "./cargadorModelo.mjs";
import { esquemaSolicitudPrediccion } from "./esquemas.mjs";
import { PredictorResultado } from "./predictor.mjs";

const requireDesdeServidor = createRequire(new URL("../../../servidor/package.json", import.meta.url));
const express = requireDesdeServidor("express");
const cors = requireDesdeServidor("cors");
const helmet = requireDesdeServidor("helmet");

export function crearAplicacionPrediccion() {
  const aplicacion = express();
  const cargadorModelo = new CargadorModelo();

  aplicacion.disable("x-powered-by");
  aplicacion.use(helmet());
  aplicacion.use(cors({ origin: false }));
  aplicacion.use(express.json({ limit: "256kb" }));

  aplicacion.get("/salud", (_solicitud, respuesta) => {
    const informacion = cargadorModelo.obtenerInformacion();
    respuesta.json({
      estado: "correcto",
      servicio: "servicio-prediccion-js",
      modeloDisponible: informacion.disponible,
      fecha: new Date().toISOString()
    });
  });

  aplicacion.get("/modelo/informacion", (_solicitud, respuesta) => {
    respuesta.json(cargadorModelo.obtenerInformacion());
  });

  aplicacion.post("/predecir", (solicitud, respuesta) => {
    const validacion = esquemaSolicitudPrediccion.safeParse(solicitud.body);
    if (!validacion.success) {
      return respuesta.status(400).json({
        mensaje: "Solicitud de prediccion invalida",
        errores: validacion.error.issues
      });
    }

    if (validacion.data.equipo_local_id === validacion.data.equipo_visitante_id) {
      return respuesta.status(400).json({ mensaje: "Los equipos deben ser diferentes" });
    }

    const modelo = cargadorModelo.obtenerModelo();
    if (!modelo) {
      return respuesta.status(503).json({
        mensaje: "Modelo no entrenado. Ejecuta npm run modelo:entrenar antes de solicitar predicciones."
      });
    }

    const predictor = new PredictorResultado(modelo);
    return respuesta.json(predictor.predecir(validacion.data.caracteristicas));
  });

  aplicacion.use((_solicitud, respuesta) => {
    respuesta.status(404).json({ mensaje: "Ruta no encontrada" });
  });

  return aplicacion;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  // process.env.PORT es la variable que inyecta Railway automáticamente
  const puerto = process.env.PORT || configuracionProcesamiento.puertoPrediccion;
  
  crearAplicacionPrediccion().listen(puerto, () => {
    console.log(`Servicio de prediccion JavaScript activo en el puerto: ${puerto}`);
  });
}
