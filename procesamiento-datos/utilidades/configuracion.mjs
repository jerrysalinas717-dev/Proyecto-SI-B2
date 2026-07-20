import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { rutaProyecto } from "./rutas.mjs";

const requireDesdeServidor = createRequire(new URL("../../servidor/package.json", import.meta.url));
const dotenv = requireDesdeServidor("dotenv");
const pg = requireDesdeServidor("pg");

const rutasEntorno = [
  path.join(rutaProyecto, "procesamiento-datos", ".env"),
  path.join(rutaProyecto, "servidor", ".env")
];

for (const ruta of rutasEntorno) {
  if (fs.existsSync(ruta)) dotenv.config({ path: ruta, override: false });
}

function enteroPositivo(nombre, valor, predeterminado) {
  const numero = Number.parseInt(valor ?? String(predeterminado), 10);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`${nombre} debe ser un numero entero positivo`);
  }
  return numero;
}

export const configuracionProcesamiento = {
  baseDatos: {
    host: process.env.BD_SERVIDOR ?? "localhost",
    port: enteroPositivo("BD_PUERTO", process.env.BD_PUERTO, 5432),
    database: process.env.BD_NOMBRE ?? "futbol_predice_bi",
    user: process.env.BD_USUARIO ?? "postgres",
    password: process.env.BD_CONTRASENA ?? "CAMBIAR",
    ssl:
      String(process.env.BD_CIFRAR ?? "false") === "true"
        ? { rejectUnauthorized: false }
        : false,
    connectionTimeoutMillis: 5000
  },
  puertoPrediccion: enteroPositivo(
    "PUERTO_PREDICCION",
    process.env.PUERTO_PREDICCION,
    8000
  ),
  tamanoLoteEtl: enteroPositivo("TAMANO_LOTE_ETL", process.env.TAMANO_LOTE_ETL, 500),
  limiteMuestraEtl: enteroPositivo(
    "LIMITE_MUESTRA_ETL",
    process.env.LIMITE_MUESTRA_ETL,
    300
  )
};

export function crearGrupoConexion() {
  return new pg.Pool(configuracionProcesamiento.baseDatos);
}

export function describirConexionSinSecreto() {
  const bd = configuracionProcesamiento.baseDatos;
  return `${bd.user}@${bd.host}:${bd.port}/${bd.database}`;
}
