import { consultar } from "../configuracion/baseDatos.js";

export class RepositorioEvento {
  async listar(filtros: any) {
    const pagina = Number(filtros.pagina ?? 1);
    const limite = Math.min(Number(filtros.limite ?? 20), 100);
    const salto = (pagina - 1) * limite;
    return consultar(
      `SELECT he.evento_id AS "eventoId",
              he.partido_id AS "partidoId",
              he.minuto_evento AS "minutoEvento",
              he.es_gol AS "esGol",
              e.nombre_equipo AS "nombreEquipo",
              te.nombre_evento AS "tipoEvento"
       FROM almacen.hecho_evento he
       LEFT JOIN almacen.dim_equipo e ON e.equipo_id = he.equipo_id
       LEFT JOIN almacen.dim_tipo_evento te ON te.tipo_evento_id = he.tipo_evento_id
       WHERE ($1::int IS NULL OR he.equipo_id = $1)
         AND ($2::int IS NULL OR he.partido_id = $2)
         AND ($3::text IS NULL OR te.nombre_evento = $3)
       ORDER BY he.evento_id
       LIMIT $4 OFFSET $5`,
      [filtros.equipoId ? Number(filtros.equipoId) : null, filtros.partidoId ? Number(filtros.partidoId) : null, filtros.tipoEvento ?? null, limite, salto]
    );
  }

  async obtenerPorId(id: number) {
    const filas = await consultar("SELECT * FROM almacen.hecho_evento WHERE evento_id = $1", [id]);
    return filas[0] ?? null;
  }
}

