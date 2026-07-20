import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  configuracionProcesamiento,
  crearGrupoConexion,
  describirConexionSinSecreto
} from "../utilidades/configuracion.mjs";
import { leerCsv } from "../utilidades/csv.mjs";
import { rutaDatosOriginales } from "../utilidades/rutas.mjs";
import {
  crearFechaDimension,
  mapaTipoEvento,
  transformarEvento,
  transformarPartido
} from "./transformar.mjs";

const argumentos = new Set(process.argv.slice(2));
const usarMuestra = argumentos.has("--muestra");
const limitePartidosMuestra = configuracionProcesamiento.limiteMuestraEtl;
const tamanoLote = configuracionProcesamiento.tamanoLoteEtl;

async function obtenerTirosPorPartido(rutaEventos, partidosPermitidos) {
  const tiros = new Map();
  for await (const { fila } of leerCsv(rutaEventos)) {
    if (partidosPermitidos && !partidosPermitidos.has(fila.id_odsp)) continue;
    if (fila.event_type !== "1") continue;
    const actual = tiros.get(fila.id_odsp) ?? { local: 0, visitante: 0 };
    if (fila.side === "1") actual.local += 1;
    if (fila.side === "2") actual.visitante += 1;
    tiros.set(fila.id_odsp, actual);
  }
  return tiros;
}

async function leerPartidos(rutaPartidos) {
  const partidosPermitidos = new Set();

  if (!usarMuestra) {
    const partidos = [];
    for await (const { fila } of leerCsv(rutaPartidos)) {
      partidos.push(fila);
      partidosPermitidos.add(fila.id_odsp);
    }
    return { partidos, partidosPermitidos };
  }

  // La fuente esta ordenada cronologicamente. Tomar las primeras filas provocaba
  // que la muestra solo contuviera 2011. Para el modo muestra se realiza una
  // seleccion equilibrada por anio, de modo que el tablero permita comparar
  // todos los periodos disponibles sin cargar los diez mil partidos completos.
  const partidosPorAnio = new Map();

  for await (const { fila } of leerCsv(rutaPartidos)) {
    const anio = String(fila.date ?? "").slice(0, 4);
    if (!/^\d{4}$/.test(anio)) continue;
    const grupo = partidosPorAnio.get(anio) ?? [];
    grupo.push(fila);
    partidosPorAnio.set(anio, grupo);
  }

  const anios = [...partidosPorAnio.keys()].sort();
  const partidos = [];
  const indices = new Map(anios.map((anio) => [anio, 0]));

  while (partidos.length < limitePartidosMuestra) {
    let seAgregoAlgunPartido = false;

    for (const anio of anios) {
      if (partidos.length >= limitePartidosMuestra) break;
      const grupo = partidosPorAnio.get(anio) ?? [];
      const indice = indices.get(anio) ?? 0;
      if (indice >= grupo.length) continue;

      const fila = grupo[indice];
      partidos.push(fila);
      partidosPermitidos.add(fila.id_odsp);
      indices.set(anio, indice + 1);
      seAgregoAlgunPartido = true;
    }

    if (!seAgregoAlgunPartido) break;
  }

  console.log(
    `Muestra equilibrada: ${partidos.length} partidos distribuidos entre ${anios.join(", ")}`
  );

  return { partidos, partidosPermitidos };
}

async function registrarLote(pool, archivoOrigen) {
  const resultado = await pool.query(
    "INSERT INTO etl.lote_carga(archivo_origen, fecha_inicio, estado) VALUES($1, now(), 'EN_PROCESO') RETURNING lote_id",
    [archivoOrigen]
  );
  return resultado.rows[0].lote_id;
}

async function finalizarLote(pool, loteId, resumen, estado) {
  await pool.query(
    `UPDATE etl.lote_carga
     SET fecha_fin = now(), filas_leidas = $2, filas_cargadas = $3,
         filas_rechazadas = $4, estado = $5
     WHERE lote_id = $1`,
    [loteId, resumen.filasLeidas, resumen.filasCargadas, resumen.filasRechazadas, estado]
  );
}

async function registrarRechazo(cliente, loteId, archivoOrigen, numeroFila, motivo, contenidoOriginal) {
  await cliente.query(
    `INSERT INTO etl.fila_rechazada(
       lote_id, archivo_origen, numero_fila, motivo, contenido_original
     ) VALUES($1, $2, $3, $4, $5)`,
    [loteId, archivoOrigen, numeroFila, motivo, JSON.stringify(contenidoOriginal).slice(0, 3900)]
  );
}

async function asegurarTiposEvento(cliente) {
  for (const [codigo, nombre] of mapaTipoEvento.entries()) {
    await cliente.query(
      `INSERT INTO almacen.dim_tipo_evento(
         codigo_origen, nombre_evento, categoria_evento, descripcion_evento
       ) VALUES($1, $2, 'Evento de partido', $2)
       ON CONFLICT (codigo_origen) DO UPDATE
       SET nombre_evento = EXCLUDED.nombre_evento,
           descripcion_evento = EXCLUDED.descripcion_evento`,
      [codigo, nombre]
    );
  }
}

async function obtenerIdEquipo(cliente, cacheEquipos, nombreEquipo, pais, liga) {
  const clave = `${nombreEquipo}|${pais}|${liga}`;
  if (cacheEquipos.has(clave)) return cacheEquipos.get(clave);

  const resultado = await cliente.query(
    `WITH insertado AS (
       INSERT INTO almacen.dim_equipo(nombre_equipo, pais, liga)
       VALUES($1, $2, $3)
       ON CONFLICT (nombre_equipo, pais, liga) DO NOTHING
       RETURNING equipo_id
     )
     SELECT equipo_id FROM insertado
     UNION ALL
     SELECT equipo_id FROM almacen.dim_equipo
     WHERE nombre_equipo = $1 AND pais = $2 AND liga = $3
     LIMIT 1`,
    [nombreEquipo, pais, liga]
  );

  const id = resultado.rows[0].equipo_id;
  cacheEquipos.set(clave, id);
  return id;
}

async function obtenerIdJugador(cliente, cacheJugadores, nombreJugador, equipoId) {
  if (!nombreJugador) return null;
  const clave = `${nombreJugador}|${equipoId ?? ""}`;
  if (cacheJugadores.has(clave)) return cacheJugadores.get(clave);

  const resultado = await cliente.query(
    `WITH insertado AS (
       INSERT INTO almacen.dim_jugador(nombre_jugador, equipo_id)
       VALUES($1, $2)
       ON CONFLICT (nombre_jugador, equipo_id) DO NOTHING
       RETURNING jugador_id
     )
     SELECT jugador_id FROM insertado
     UNION ALL
     SELECT jugador_id FROM almacen.dim_jugador
     WHERE nombre_jugador = $1 AND equipo_id IS NOT DISTINCT FROM $2
     LIMIT 1`,
    [nombreJugador, equipoId]
  );

  const id = resultado.rows[0].jugador_id;
  cacheJugadores.set(clave, id);
  return id;
}

async function cargarPartido(cliente, cacheEquipos, partido) {
  const fecha = crearFechaDimension(partido.fechaPartido, partido.temporada);
  const equipoLocalId = await obtenerIdEquipo(
    cliente,
    cacheEquipos,
    partido.equipoLocal,
    partido.pais,
    partido.liga
  );
  const equipoVisitanteId = await obtenerIdEquipo(
    cliente,
    cacheEquipos,
    partido.equipoVisitante,
    partido.pais,
    partido.liga
  );

  await cliente.query(
    `INSERT INTO almacen.dim_fecha(
       fecha_id, fecha_completa, numero_dia, numero_mes, nombre_mes, numero_anio, temporada
     ) VALUES($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (fecha_id) DO NOTHING`,
    [
      fecha.fechaId,
      fecha.fechaCompleta,
      fecha.numeroDia,
      fecha.numeroMes,
      fecha.nombreMes,
      fecha.numeroAnio,
      fecha.temporada
    ]
  );

  await cliente.query(
    `INSERT INTO preparacion.partido_original(
       partido_origen_id, pais, liga, temporada, fecha_partido,
       equipo_local, equipo_visitante, goles_local, goles_visitante, codigo_resultado
     ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (partido_origen_id) DO NOTHING`,
    [
      partido.partidoOrigenId,
      partido.pais,
      partido.liga,
      partido.temporada,
      partido.fechaPartido,
      partido.equipoLocal,
      partido.equipoVisitante,
      partido.golesLocal,
      partido.golesVisitante,
      partido.codigoResultado
    ]
  );

  const resultado = await cliente.query(
    `WITH insertado AS (
       INSERT INTO almacen.hecho_partido(
         partido_origen_id, fecha_id, equipo_local_id, equipo_visitante_id,
         goles_local, goles_visitante, tiros_local, tiros_visitante, codigo_resultado
       ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (partido_origen_id) DO UPDATE
       SET tiros_local = EXCLUDED.tiros_local,
           tiros_visitante = EXCLUDED.tiros_visitante
       RETURNING partido_id
     )
     SELECT partido_id FROM insertado
     UNION ALL
     SELECT partido_id FROM almacen.hecho_partido WHERE partido_origen_id = $1
     LIMIT 1`,
    [
      partido.partidoOrigenId,
      fecha.fechaId,
      equipoLocalId,
      equipoVisitanteId,
      partido.golesLocal,
      partido.golesVisitante,
      partido.tirosLocal,
      partido.tirosVisitante,
      partido.codigoResultado
    ]
  );

  return {
    partidoId: resultado.rows[0].partido_id,
    fechaId: fecha.fechaId,
    equipoLocalId,
    equipoVisitanteId
  };
}

async function cargarPartidos(pool, loteId, partidos, tiros, resumen) {
  const cliente = await pool.connect();
  const cacheEquipos = new Map();
  const partidosCargados = new Map();

  try {
    await cliente.query("BEGIN");
    await asegurarTiposEvento(cliente);

    for (let indice = 0; indice < partidos.length; indice += 1) {
      resumen.filasLeidas += 1;
      const { partido, errores } = transformarPartido(
        partidos[indice],
        tiros.get(partidos[indice].id_odsp)
      );

      if (errores.length > 0) {
        resumen.filasRechazadas += 1;
        await registrarRechazo(
          cliente,
          loteId,
          "ginf.csv",
          indice + 2,
          errores.join("; "),
          partidos[indice]
        );
        continue;
      }

      const cargado = await cargarPartido(cliente, cacheEquipos, partido);
      partidosCargados.set(partido.partidoOrigenId, cargado);
      resumen.filasCargadas += 1;
    }

    await cliente.query("COMMIT");
    return partidosCargados;
  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    cliente.release();
  }
}

async function cargarEventos(pool, loteId, rutaEventos, partidosCargados, resumen) {
  const cacheJugadores = new Map();
  let cliente = await pool.connect();
  let operacionesLote = 0;
  let eventosNuevos = 0;

  await cliente.query("BEGIN");

  try {
    for await (const { fila, numeroFila } of leerCsv(rutaEventos)) {
      if (!partidosCargados.has(fila.id_odsp)) continue;
      resumen.filasLeidas += 1;

      const transformado = transformarEvento(fila);
      if (transformado.errores.length > 0) {
        resumen.filasRechazadas += 1;
        await registrarRechazo(
          cliente,
          loteId,
          "events.csv",
          numeroFila,
          transformado.errores.join("; "),
          fila
        );
        operacionesLote += 1;
      } else {
        const insercionPreparacion = await cliente.query(
          `INSERT INTO preparacion.evento_original(
             evento_origen_id, partido_origen_id, codigo_tipo_evento, lado_evento,
             minuto_evento, nombre_jugador, nombre_equipo, codigo_ubicacion_tiro,
             codigo_resultado_tiro, es_gol
           ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (evento_origen_id) DO NOTHING
           RETURNING evento_origen_id`,
          [
            transformado.evento.eventoOrigenId,
            transformado.evento.partidoOrigenId,
            transformado.evento.codigoTipoEvento,
            transformado.evento.ladoEvento,
            transformado.evento.minutoEvento,
            transformado.evento.nombreJugador,
            transformado.evento.nombreEquipo,
            transformado.evento.codigoUbicacionTiro,
            transformado.evento.codigoResultadoTiro,
            Boolean(transformado.evento.esGol)
          ]
        );

        if (insercionPreparacion.rowCount) {
          const partido = partidosCargados.get(transformado.evento.partidoOrigenId);
          const equipoId =
            transformado.evento.ladoEvento === 1
              ? partido.equipoLocalId
              : partido.equipoVisitanteId;
          const jugadorId = await obtenerIdJugador(
            cliente,
            cacheJugadores,
            transformado.evento.nombreJugador,
            equipoId
          );

          await cliente.query(
            `INSERT INTO almacen.hecho_evento(
               partido_id, fecha_id, equipo_id, jugador_id, tipo_evento_id,
               minuto_evento, codigo_ubicacion_tiro, codigo_resultado_tiro, es_gol
             )
             SELECT $1, $2, $3, $4, tipo_evento_id, $5, $6, $7, $8
             FROM almacen.dim_tipo_evento
             WHERE codigo_origen = $9`,
            [
              partido.partidoId,
              partido.fechaId,
              equipoId,
              jugadorId,
              transformado.evento.minutoEvento,
              transformado.evento.codigoUbicacionTiro,
              transformado.evento.codigoResultadoTiro,
              Boolean(transformado.evento.esGol),
              transformado.evento.codigoTipoEvento
            ]
          );

          resumen.filasCargadas += 1;
          eventosNuevos += 1;
          operacionesLote += 1;
        }
      }

      if (operacionesLote >= tamanoLote) {
        await cliente.query("COMMIT");
        cliente.release();
        if (eventosNuevos > 0 && eventosNuevos % (tamanoLote * 10) < tamanoLote) {
          console.log(`Eventos nuevos cargados: ${eventosNuevos}`);
        }
        cliente = await pool.connect();
        await cliente.query("BEGIN");
        operacionesLote = 0;
      }
    }

    await cliente.query("COMMIT");
  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    cliente.release();
  }
}

export async function ejecutarEtl() {
  const inicio = Date.now();
  const rutaPartidos = path.join(rutaDatosOriginales, "ginf.csv");
  const rutaEventos = path.join(rutaDatosOriginales, "events.csv");

  if (!fs.existsSync(rutaPartidos) || !fs.existsSync(rutaEventos)) {
    throw new Error(
      "No se encontraron datos/originales/ginf.csv y datos/originales/events.csv"
    );
  }

  const resumen = { filasLeidas: 0, filasCargadas: 0, filasRechazadas: 0 };
  const pool = crearGrupoConexion();
  let loteId = null;

  console.log(`Conexion ETL: ${describirConexionSinSecreto()}`);
  console.log(`Modo ETL: ${usarMuestra ? "muestra" : "completo"}`);

  try {
    await pool.query("SELECT 1");
    loteId = await registrarLote(
      pool,
      usarMuestra ? "events.csv y ginf.csv - muestra" : "events.csv y ginf.csv - completo"
    );

    const { partidos, partidosPermitidos } = await leerPartidos(rutaPartidos);
    const tiros = await obtenerTirosPorPartido(
      rutaEventos,
      usarMuestra ? partidosPermitidos : null
    );
    const partidosCargados = await cargarPartidos(pool, loteId, partidos, tiros, resumen);
    await cargarEventos(pool, loteId, rutaEventos, partidosCargados, resumen);
    await finalizarLote(pool, loteId, resumen, "COMPLETADO");
  } catch (error) {
    if (loteId) {
      await finalizarLote(pool, loteId, resumen, "ERROR").catch(() => undefined);
    }
    throw error;
  } finally {
    await pool.end();
  }

  const duracionSegundos = ((Date.now() - inicio) / 1000).toFixed(2);
  console.log(
    JSON.stringify(
      {
        ...resumen,
        duracionSegundos,
        estado: "COMPLETADO",
        modo: usarMuestra ? "muestra" : "completo"
      },
      null,
      2
    )
  );
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  ejecutarEtl().catch((error) => {
    console.error(`Error al ejecutar ETL: ${error.message}`);
    process.exitCode = 1;
  });
}
