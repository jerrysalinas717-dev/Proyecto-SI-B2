import path from "node:path";
import { crearGrupoConexion } from "../utilidades/configuracion.mjs";
import { leerCsv } from "../utilidades/csv.mjs";
import { rutaDatosOriginales } from "../utilidades/rutas.mjs";
import {
  calcularResultado,
  convertirEntero,
  normalizarNombreEquipo,
  normalizarTexto
} from "../etl/validadores.mjs";

export const nombresCaracteristicas = [
  "promedio_goles_favor_local_ultimos_5",
  "promedio_goles_contra_local_ultimos_5",
  "promedio_goles_favor_visitante_ultimos_5",
  "promedio_goles_contra_visitante_ultimos_5",
  "promedio_tiros_local_ultimos_5",
  "promedio_tiros_visitante_ultimos_5",
  "tasa_conversion_local_ultimos_5",
  "tasa_conversion_visitante_ultimos_5",
  "tasa_puntos_local_ultimos_5",
  "tasa_puntos_visitante_ultimos_5"
];

export const clasesResultado = ["VICTORIA_LOCAL", "EMPATE", "VICTORIA_VISITANTE"];

export function resumirHistorial(historial) {
  const ultimos = historial.slice(-5);
  if (ultimos.length === 0) {
    return { golesFavor: 0, golesContra: 0, tiros: 0, conversion: 0, puntos: 0 };
  }

  const suma = ultimos.reduce(
    (acumulado, partido) => ({
      golesFavor: acumulado.golesFavor + partido.golesFavor,
      golesContra: acumulado.golesContra + partido.golesContra,
      tiros: acumulado.tiros + partido.tiros,
      goles: acumulado.goles + partido.golesFavor,
      puntos: acumulado.puntos + partido.puntos
    }),
    { golesFavor: 0, golesContra: 0, tiros: 0, goles: 0, puntos: 0 }
  );

  return {
    golesFavor: suma.golesFavor / ultimos.length,
    golesContra: suma.golesContra / ultimos.length,
    tiros: suma.tiros / ultimos.length,
    conversion: suma.tiros > 0 ? suma.goles / suma.tiros : 0,
    puntos: suma.puntos / (ultimos.length * 3)
  };
}

export function crearCaracteristicasDesdeHistorial(historialLocal, historialVisitante) {
  const local = resumirHistorial(historialLocal);
  const visitante = resumirHistorial(historialVisitante);
  return [
    local.golesFavor,
    local.golesContra,
    visitante.golesFavor,
    visitante.golesContra,
    local.tiros,
    visitante.tiros,
    local.conversion,
    visitante.conversion,
    local.puntos,
    visitante.puntos
  ];
}

export async function obtenerTirosPorPartidoDesdeCsv(
  rutaEventos = path.join(rutaDatosOriginales, "events.csv")
) {
  const tirosPorPartido = new Map();
  for await (const { fila } of leerCsv(rutaEventos)) {
    if (fila.event_type !== "1") continue;
    const actual = tirosPorPartido.get(fila.id_odsp) ?? { local: 0, visitante: 0 };
    if (fila.side === "1") actual.local += 1;
    if (fila.side === "2") actual.visitante += 1;
    tirosPorPartido.set(fila.id_odsp, actual);
  }
  return tirosPorPartido;
}

export async function leerPartidosOrdenadosDesdeCsv(
  rutaPartidos = path.join(rutaDatosOriginales, "ginf.csv")
) {
  const partidos = [];
  for await (const { fila } of leerCsv(rutaPartidos)) {
    const golesLocal = convertirEntero(fila.fthg);
    const golesVisitante = convertirEntero(fila.ftag);
    const resultado = calcularResultado(golesLocal, golesVisitante);
    if (!resultado) continue;
    partidos.push({
      partidoOrigenId: normalizarTexto(fila.id_odsp),
      fechaPartido: normalizarTexto(fila.date),
      liga: normalizarTexto(fila.league),
      pais: normalizarTexto(fila.country),
      temporada: convertirEntero(fila.season),
      equipoLocal: normalizarNombreEquipo(fila.ht),
      equipoVisitante: normalizarNombreEquipo(fila.at),
      golesLocal,
      golesVisitante,
      resultado
    });
  }
  return partidos.sort((a, b) =>
    `${a.fechaPartido}-${a.partidoOrigenId}`.localeCompare(
      `${b.fechaPartido}-${b.partidoOrigenId}`
    )
  );
}

export async function leerDatosEntrenamientoDesdePostgres() {
  const pool = crearGrupoConexion();
  try {
    const resultado = await pool.query(
      `SELECT
         hp.partido_origen_id,
         f.fecha_completa,
         f.temporada,
         el.nombre_equipo AS equipo_local,
         ev.nombre_equipo AS equipo_visitante,
         hp.goles_local,
         hp.goles_visitante,
         hp.tiros_local,
         hp.tiros_visitante,
         hp.codigo_resultado
       FROM almacen.hecho_partido hp
       JOIN almacen.dim_fecha f ON f.fecha_id = hp.fecha_id
       JOIN almacen.dim_equipo el ON el.equipo_id = hp.equipo_local_id
       JOIN almacen.dim_equipo ev ON ev.equipo_id = hp.equipo_visitante_id
       ORDER BY f.fecha_completa, hp.partido_id`
    );

    const tirosPorPartido = new Map();
    const partidos = resultado.rows.map((fila) => {
      tirosPorPartido.set(fila.partido_origen_id, {
        local: Number(fila.tiros_local ?? 0),
        visitante: Number(fila.tiros_visitante ?? 0)
      });
      return {
        partidoOrigenId: fila.partido_origen_id,
        fechaPartido: fila.fecha_completa?.toISOString?.().slice(0, 10) ?? String(fila.fecha_completa),
        temporada: Number(fila.temporada),
        equipoLocal: fila.equipo_local,
        equipoVisitante: fila.equipo_visitante,
        golesLocal: Number(fila.goles_local),
        golesVisitante: Number(fila.goles_visitante),
        resultado: fila.codigo_resultado
      };
    });

    return { partidos, tirosPorPartido };
  } finally {
    await pool.end();
  }
}

export function crearConjuntoCaracteristicas(partidos, tirosPorPartido) {
  const historialPorEquipo = new Map();
  const filas = [];

  for (const partido of partidos) {
    const historialLocal = historialPorEquipo.get(partido.equipoLocal) ?? [];
    const historialVisitante = historialPorEquipo.get(partido.equipoVisitante) ?? [];
    const caracteristicas = crearCaracteristicasDesdeHistorial(
      historialLocal,
      historialVisitante
    );

    filas.push({
      partidoOrigenId: partido.partidoOrigenId,
      fechaPartido: partido.fechaPartido,
      equipoLocal: partido.equipoLocal,
      equipoVisitante: partido.equipoVisitante,
      caracteristicas,
      resultado: partido.resultado
    });

    const tiros = tirosPorPartido.get(partido.partidoOrigenId) ?? {
      local: 0,
      visitante: 0
    };
    const puntosLocal =
      partido.resultado === "VICTORIA_LOCAL"
        ? 3
        : partido.resultado === "EMPATE"
          ? 1
          : 0;
    const puntosVisitante =
      partido.resultado === "VICTORIA_VISITANTE"
        ? 3
        : partido.resultado === "EMPATE"
          ? 1
          : 0;

    historialLocal.push({
      golesFavor: partido.golesLocal,
      golesContra: partido.golesVisitante,
      tiros: tiros.local,
      puntos: puntosLocal
    });
    historialVisitante.push({
      golesFavor: partido.golesVisitante,
      golesContra: partido.golesLocal,
      tiros: tiros.visitante,
      puntos: puntosVisitante
    });

    historialPorEquipo.set(partido.equipoLocal, historialLocal);
    historialPorEquipo.set(partido.equipoVisitante, historialVisitante);
  }

  return filas;
}

export function convertirCaracteristicasObjeto(vector) {
  return Object.fromEntries(
    nombresCaracteristicas.map((nombre, indice) => [nombre, vector[indice]])
  );
}
