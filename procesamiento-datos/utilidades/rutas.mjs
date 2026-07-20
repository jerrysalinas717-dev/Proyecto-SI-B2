import path from "node:path";
import { fileURLToPath } from "node:url";

const archivoActual = fileURLToPath(import.meta.url);
export const rutaProyecto = path.resolve(path.dirname(archivoActual), "..", "..");
export const rutaDatosOriginales = path.join(rutaProyecto, "datos", "originales");
export const rutaDatosMuestra = path.join(rutaProyecto, "datos", "muestra");
export const rutaModelos = path.join(rutaProyecto, "modelos");
export const rutaModeloResultado = path.join(rutaModelos, "modelo_resultado_futbol.json");
export const rutaMetricasModelo = path.join(rutaModelos, "metricas_modelo.json");

