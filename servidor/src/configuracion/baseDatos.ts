import pg from "pg";
import { configuracion } from "./configuracion.js";

const { Pool } = pg;

const grupoConexion = new Pool({
  host: configuracion.BD_SERVIDOR,
  port: configuracion.BD_PUERTO,
  database: configuracion.BD_NOMBRE,
  user: configuracion.BD_USUARIO,
  password: configuracion.BD_CONTRASENA,
  ssl: configuracion.BD_CIFRAR
    ? { rejectUnauthorized: !configuracion.BD_CONFIAR_CERTIFICADO }
    : false,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

grupoConexion.on("error", (error) => {
  console.error("Error inesperado en el grupo de conexiones PostgreSQL:", error.message);
});

export async function consultar<T = Record<string, unknown>>(
  texto: string,
  valores: unknown[] = []
): Promise<T[]> {
  const resultado = await grupoConexion.query(texto, valores);
  return resultado.rows as T[];
}

export async function probarConexion(): Promise<void> {
  await grupoConexion.query("SELECT 1");
}

export function obtenerGrupoConexion() {
  return grupoConexion;
}

export async function cerrarConexion(): Promise<void> {
  await grupoConexion.end();
}
