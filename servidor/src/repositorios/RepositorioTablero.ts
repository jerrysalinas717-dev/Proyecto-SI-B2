import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consultar } from "../configuracion/baseDatos.js";

const rutaActual = path.dirname(fileURLToPath(import.meta.url));
const rutaMetricas = path.resolve(
  rutaActual,
  "..",
  "..",
  "..",
  "modelos",
  "metricas_modelo.json"
);

function leerExactitudModelo(): number | null {
  try {
    const metricas = JSON.parse(fs.readFileSync(rutaMetricas, "utf8")) as {
      exactitud?: number;
    };
    return typeof metricas.exactitud === "number" ? metricas.exactitud : null;
  } catch {
    return null;
  }
}

export class RepositorioTablero {
  async aniosDisponibles() {
    return consultar<{ anio: number }>(
      `SELECT DISTINCT numero_anio AS anio
       FROM almacen.dim_fecha
       ORDER BY numero_anio DESC`
    );
  }

  async resumen(anio?: number) {
    const filas = await consultar<Record<string, unknown>>(
      `WITH partidos_filtrados AS (
         SELECT hp.*
         FROM almacen.hecho_partido hp
         JOIN almacen.dim_fecha f ON f.fecha_id = hp.fecha_id
         WHERE ($1::int IS NULL OR f.numero_anio = $1)
       ),
       rendimiento AS (
         SELECT
           e.equipo_id,
           e.nombre_equipo,
           COUNT(p.partido_id)::int AS partidos,
           COALESCE(SUM(
             CASE
               WHEN p.equipo_local_id = e.equipo_id THEN p.goles_local
               ELSE p.goles_visitante
             END
           ), 0)::int AS goles_favor,
           COALESCE(SUM(
             CASE
               WHEN p.equipo_local_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_LOCAL' THEN 3
               WHEN p.equipo_visitante_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_VISITANTE' THEN 3
               WHEN p.codigo_resultado = 'EMPATE' THEN 1
               ELSE 0
             END
           ), 0)::int AS puntos
         FROM almacen.dim_equipo e
         JOIN partidos_filtrados p
           ON p.equipo_local_id = e.equipo_id
           OR p.equipo_visitante_id = e.equipo_id
         GROUP BY e.equipo_id, e.nombre_equipo
       )
       SELECT
         (SELECT COUNT(*)::int FROM partidos_filtrados) AS partidos_analizados,
         (SELECT COALESCE(SUM(goles_local + goles_visitante), 0)::int FROM partidos_filtrados)
           AS goles_registrados,
         (SELECT COALESCE(AVG((goles_local + goles_visitante)::numeric), 0)::float
            FROM partidos_filtrados) AS promedio_goles,
         (SELECT COUNT(*)::int
            FROM almacen.hecho_evento he
            JOIN almacen.dim_fecha f ON f.fecha_id = he.fecha_id
           WHERE ($1::int IS NULL OR f.numero_anio = $1)) AS eventos_procesados,
         (SELECT nombre_equipo
            FROM rendimiento
           ORDER BY puntos DESC, goles_favor DESC, nombre_equipo
           LIMIT 1) AS equipo_mejor_rendimiento,
         (SELECT puntos
            FROM rendimiento
           ORDER BY puntos DESC, goles_favor DESC, nombre_equipo
           LIMIT 1) AS puntos_equipo_lider,
         (SELECT goles_favor
            FROM rendimiento
           ORDER BY goles_favor DESC, puntos DESC, nombre_equipo
           LIMIT 1) AS goles_mejor_ataque,
         (SELECT nombre_equipo
            FROM rendimiento
           ORDER BY goles_favor DESC, puntos DESC, nombre_equipo
           LIMIT 1) AS equipo_mejor_ataque,
         (SELECT COUNT(*)::int FROM aplicacion.prediccion) AS predicciones_realizadas`,
      [anio ?? null]
    );

    return {
      ...(filas[0] ?? {}),
      exactitud_modelo: leerExactitudModelo()
    };
  }

  async mejoresEquipos(anio?: number) {
    return consultar(
      `WITH partidos_filtrados AS (
         SELECT hp.*
         FROM almacen.hecho_partido hp
         JOIN almacen.dim_fecha f ON f.fecha_id = hp.fecha_id
         WHERE ($1::int IS NULL OR f.numero_anio = $1)
       )
       SELECT
         e.equipo_id,
         e.nombre_equipo,
         e.pais,
         e.liga,
         COUNT(p.partido_id)::int AS partidos,
         COALESCE(SUM(
           CASE
             WHEN p.equipo_local_id = e.equipo_id THEN p.goles_local
             ELSE p.goles_visitante
           END
         ), 0)::int AS goles_favor,
         COALESCE(SUM(
           CASE
             WHEN p.equipo_local_id = e.equipo_id THEN p.goles_visitante
             ELSE p.goles_local
           END
         ), 0)::int AS goles_contra,
         COALESCE(SUM(
           CASE
             WHEN p.equipo_local_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_LOCAL' THEN 3
             WHEN p.equipo_visitante_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_VISITANTE' THEN 3
             WHEN p.codigo_resultado = 'EMPATE' THEN 1
             ELSE 0
           END
         ), 0)::int AS puntos,
         COUNT(*) FILTER (
           WHERE
             (p.equipo_local_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_LOCAL')
             OR
             (p.equipo_visitante_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_VISITANTE')
         )::int AS victorias
       FROM almacen.dim_equipo e
       JOIN partidos_filtrados p
         ON p.equipo_local_id = e.equipo_id
         OR p.equipo_visitante_id = e.equipo_id
       GROUP BY e.equipo_id, e.nombre_equipo, e.pais, e.liga
       ORDER BY puntos DESC, goles_favor DESC, nombre_equipo
       LIMIT 10`,
      [anio ?? null]
    );
  }

  async tendenciaGoles() {
    return consultar(
      `SELECT
         f.numero_anio AS anio,
         COUNT(hp.partido_id)::int AS partidos,
         SUM(hp.goles_local + hp.goles_visitante)::int AS total_goles,
         AVG((hp.goles_local + hp.goles_visitante)::numeric)::float AS promedio_goles
       FROM almacen.hecho_partido hp
       JOIN almacen.dim_fecha f ON f.fecha_id = hp.fecha_id
       GROUP BY f.numero_anio
       ORDER BY f.numero_anio`
    );
  }

  async distribucionResultados(anio?: number) {
    return consultar(
      `SELECT
         CASE codigo_resultado
           WHEN 'VICTORIA_LOCAL' THEN 'Victoria local'
           WHEN 'EMPATE' THEN 'Empate'
           WHEN 'VICTORIA_VISITANTE' THEN 'Victoria visitante'
         END AS resultado,
         COUNT(*)::int AS total
       FROM almacen.hecho_partido hp
       JOIN almacen.dim_fecha f ON f.fecha_id = hp.fecha_id
       WHERE ($1::int IS NULL OR f.numero_anio = $1)
       GROUP BY codigo_resultado
       ORDER BY CASE codigo_resultado
         WHEN 'VICTORIA_LOCAL' THEN 1
         WHEN 'EMPATE' THEN 2
         ELSE 3
       END`,
      [anio ?? null]
    );
  }

  async distribucionEventos(anio?: number) {
    return consultar(
      `SELECT
         COALESCE(te.nombre_evento, 'Sin clasificar') AS nombre_evento,
         COUNT(*)::int AS total
       FROM almacen.hecho_evento he
       JOIN almacen.dim_fecha f ON f.fecha_id = he.fecha_id
       LEFT JOIN almacen.dim_tipo_evento te ON te.tipo_evento_id = he.tipo_evento_id
       WHERE ($1::int IS NULL OR f.numero_anio = $1)
       GROUP BY COALESCE(te.nombre_evento, 'Sin clasificar')
       ORDER BY total DESC
       LIMIT 8`,
      [anio ?? null]
    );
  }

  async ligas() {
    return consultar(
      `SELECT pais, liga, COUNT(*)::int AS equipos
       FROM almacen.dim_equipo
       GROUP BY pais, liga
       ORDER BY pais, liga`
    );
  }
}
