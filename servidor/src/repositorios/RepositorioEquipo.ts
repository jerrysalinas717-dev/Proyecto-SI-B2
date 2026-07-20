import { consultar } from "../configuracion/baseDatos.js";

function mapearEquipo(fila: any) {
  return {
    equipoId: Number(fila.equipo_id),
    nombreEquipo: fila.nombre_equipo,
    pais: fila.pais,
    liga: fila.liga,
    estaActivo: Boolean(fila.esta_activo)
  };
}

export class RepositorioEquipo {
  async listar(filtros: any) {
    const pagina = Number(filtros.pagina ?? 1);
    const limite = Math.min(Number(filtros.limite ?? 20), 100);
    const salto = (pagina - 1) * limite;
    const filas = await consultar(
      `SELECT equipo_id, nombre_equipo, pais, liga, esta_activo
       FROM almacen.dim_equipo
       WHERE ($1::text IS NULL OR nombre_equipo ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR liga = $2)
         AND ($3::text IS NULL OR pais = $3)
       ORDER BY nombre_equipo
       LIMIT $4 OFFSET $5`,
      [filtros.busqueda ?? null, filtros.liga ?? null, filtros.pais ?? null, limite, salto]
    );
    return filas.map(mapearEquipo);
  }

  async obtenerPorId(equipoId: number) {
    const filas = await consultar("SELECT equipo_id, nombre_equipo, pais, liga, esta_activo FROM almacen.dim_equipo WHERE equipo_id = $1", [equipoId]);
    return filas[0] ? mapearEquipo(filas[0]) : null;
  }

  async obtenerPorIds(equipoIds: number[]) {
    if (equipoIds.length === 0) return [];
    const filas = await consultar(
      `SELECT equipo_id, nombre_equipo, pais, liga, esta_activo
       FROM almacen.dim_equipo
       WHERE equipo_id = ANY($1::int[])
       ORDER BY array_position($1::int[], equipo_id)`,
      [equipoIds]
    );
    return filas.map(mapearEquipo);
  }

  async obtenerForma(equipoId: number) {
    const filas = await consultar("SELECT * FROM almacen.vw_forma_reciente_equipo WHERE equipo_id = $1", [equipoId]);
    return filas[0] ?? null;
  }

  async comparar(local: number, visitante: number) {
    return consultar(
      `SELECT *
       FROM almacen.vw_rendimiento_equipo
       WHERE equipo_id IN ($1, $2)
       ORDER BY CASE WHEN equipo_id = $1 THEN 0 ELSE 1 END`,
      [local, visitante]
    );
  }
}

