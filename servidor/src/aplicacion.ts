import cors from "cors";
import express from "express";
import helmet from "helmet";
import { origenesPermitidos } from "./configuracion/configuracion.js";
import rutaAutenticacion from "./rutas/autenticacion.js";
import rutaUsuarios from "./rutas/usuarios.js";
import rutaEquipos from "./rutas/equipos.js";
import rutaTablero from "./rutas/tablero.js";
import rutaEventos from "./rutas/eventos.js";
import rutaPredicciones from "./rutas/predicciones.js";
import rutaSalud from "./rutas/salud.js";
import { manejarErrores } from "./intermediarios/errores.js";

export const aplicacion = express();

aplicacion.disable("x-powered-by");
aplicacion.use(helmet());
aplicacion.use(
  cors({
    origin(origen, continuar) {
      if (!origen || origenesPermitidos.includes(origen)) {
        continuar(null, true);
        return;
      }
      continuar(new Error("Origen no permitido por CORS"));
    },
    credentials: false
  })
);
aplicacion.use(express.json({ limit: "1mb" }));

aplicacion.use("/api/autenticacion", rutaAutenticacion);
aplicacion.use("/api/usuarios", rutaUsuarios);
aplicacion.use("/api/equipos", rutaEquipos);
aplicacion.use("/api/tablero", rutaTablero);
aplicacion.use("/api/eventos", rutaEventos);
aplicacion.use("/api/predicciones", rutaPredicciones);
aplicacion.use("/api/salud", rutaSalud);

aplicacion.use((_solicitud, respuesta) => {
  respuesta.status(404).json({
    exito: false,
    mensaje: "Ruta no encontrada",
    errores: [],
    fecha: new Date().toISOString()
  });
});

aplicacion.use(manejarErrores);
