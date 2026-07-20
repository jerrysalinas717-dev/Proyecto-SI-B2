import { consultar } from "../configuracion/baseDatos.js";

export class RepositorioPrediccion {
  async obtenerCaracteristicas(local: number, visitante: number) {
    const filas = await consultar(
      `SELECT
         COALESCE(l.promedio_goles_favor_ultimos_5, 0)::float AS promedio_goles_favor_local_ultimos_5,
         COALESCE(l.promedio_goles_contra_ultimos_5, 0)::float AS promedio_goles_contra_local_ultimos_5,
         COALESCE(v.promedio_goles_favor_ultimos_5, 0)::float AS promedio_goles_favor_visitante_ultimos_5,
         COALESCE(v.promedio_goles_contra_ultimos_5, 0)::float AS promedio_goles_contra_visitante_ultimos_5,
         COALESCE(l.promedio_tiros_ultimos_5, 0)::float AS promedio_tiros_local_ultimos_5,
         COALESCE(v.promedio_tiros_ultimos_5, 0)::float AS promedio_tiros_visitante_ultimos_5,
         COALESCE(l.tasa_conversion_ultimos_5, 0)::float AS tasa_conversion_local_ultimos_5,
         COALESCE(v.tasa_conversion_ultimos_5, 0)::float AS tasa_conversion_visitante_ultimos_5,
         COALESCE(l.tasa_puntos_ultimos_5, 0)::float AS tasa_puntos_local_ultimos_5,
         COALESCE(v.tasa_puntos_ultimos_5, 0)::float AS tasa_puntos_visitante_ultimos_5
       FROM (SELECT $1::int AS equipo_local_id, $2::int AS equipo_visitante_id) p
       LEFT JOIN almacen.vw_forma_reciente_equipo l ON l.equipo_id = p.equipo_local_id
       LEFT JOIN almacen.vw_forma_reciente_equipo v ON v.equipo_id = p.equipo_visitante_id`,
      [local, visitante]
    );
    return filas[0];
  }

  async crear(usuarioId: number, local: number, visitante: number, prediccion: any) {
    const filas = await consultar(
      `INSERT INTO aplicacion.prediccion(
         usuario_id, equipo_local_id, equipo_visitante_id,
         probabilidad_local, probabilidad_empate, probabilidad_visitante,
         resultado_predicho, nivel_confianza
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING
         prediccion_id AS "prediccionId",
         usuario_id AS "usuarioId",
         equipo_local_id AS "equipoLocalId",
         equipo_visitante_id AS "equipoVisitanteId",
         probabilidad_local::float AS "probabilidadLocal",
         probabilidad_empate::float AS "probabilidadEmpate",
         probabilidad_visitante::float AS "probabilidadVisitante",
         resultado_predicho AS "resultadoPredicho",
         nivel_confianza AS "nivelConfianza",
         fecha_creacion AS "fechaCreacion"`,
      [
        usuarioId,
        local,
        visitante,
        prediccion.probabilidad_local,
        prediccion.probabilidad_empate,
        prediccion.probabilidad_visitante,
        prediccion.resultado_predicho,
        prediccion.nivel_confianza
      ]
    );
    return filas[0];
  }

  async listar(
    usuarioId: number,
    esAdministrador: boolean,
    pagina: number,
    limite: number,
    usuarioObjetivoId?: number
  ) {
    const salto = (pagina - 1) * limite;
    return consultar(
      `SELECT
         p.prediccion_id AS "prediccionId",
         p.usuario_id AS "usuarioId",
         p.equipo_local_id AS "equipoLocalId",
         p.equipo_visitante_id AS "equipoVisitanteId",
         p.probabilidad_local::float AS "probabilidadLocal",
         p.probabilidad_empate::float AS "probabilidadEmpate",
         p.probabilidad_visitante::float AS "probabilidadVisitante",
         p.resultado_predicho AS "resultadoPredicho",
         p.nivel_confianza AS "nivelConfianza",
         p.fecha_creacion AS "fechaCreacion",
         el.nombre_equipo AS "equipoLocal",
         ev.nombre_equipo AS "equipoVisitante",
         u.nombre_completo AS "nombreUsuario"
       FROM aplicacion.prediccion p
       JOIN almacen.dim_equipo el ON el.equipo_id = p.equipo_local_id
       JOIN almacen.dim_equipo ev ON ev.equipo_id = p.equipo_visitante_id
       JOIN aplicacion.usuario u ON u.usuario_id = p.usuario_id
       WHERE
         ($2::boolean = true AND ($5::int IS NULL OR p.usuario_id = $5))
         OR ($2::boolean = false AND p.usuario_id = $1)
       ORDER BY p.fecha_creacion DESC
       LIMIT $3 OFFSET $4`,
      [usuarioId, esAdministrador, limite, salto, usuarioObjetivoId ?? null]
    );
  }

  async obtenerPorId(prediccionId: number, usuarioId: number, esAdministrador: boolean) {
    const filas = await consultar(
      `SELECT
         p.prediccion_id AS "prediccionId",
         p.usuario_id AS "usuarioId",
         p.equipo_local_id AS "equipoLocalId",
         p.equipo_visitante_id AS "equipoVisitanteId",
         p.probabilidad_local::float AS "probabilidadLocal",
         p.probabilidad_empate::float AS "probabilidadEmpate",
         p.probabilidad_visitante::float AS "probabilidadVisitante",
         p.resultado_predicho AS "resultadoPredicho",
         p.nivel_confianza AS "nivelConfianza",
         p.fecha_creacion AS "fechaCreacion",
         el.nombre_equipo AS "equipoLocal",
         ev.nombre_equipo AS "equipoVisitante"
       FROM aplicacion.prediccion p
       JOIN almacen.dim_equipo el ON el.equipo_id = p.equipo_local_id
       JOIN almacen.dim_equipo ev ON ev.equipo_id = p.equipo_visitante_id
       WHERE p.prediccion_id = $1
         AND ($3::boolean = true OR p.usuario_id = $2)
       LIMIT 1`,
      [prediccionId, usuarioId, esAdministrador]
    );
    return filas[0] ?? null;
  }
}
