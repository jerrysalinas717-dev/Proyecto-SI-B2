CREATE OR REPLACE VIEW almacen.vw_rendimiento_equipo AS
SELECT
  e.equipo_id,
  e.nombre_equipo,
  e.pais,
  e.liga,
  COUNT(p.partido_id)::int AS partidos,
  COALESCE(SUM(CASE WHEN p.equipo_local_id = e.equipo_id THEN p.goles_local ELSE p.goles_visitante END), 0)::int AS goles_favor,
  COALESCE(SUM(CASE WHEN p.equipo_local_id = e.equipo_id THEN p.goles_visitante ELSE p.goles_local END), 0)::int AS goles_contra,
  COALESCE(SUM(
    CASE
      WHEN p.equipo_local_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_LOCAL' THEN 3
      WHEN p.equipo_visitante_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_VISITANTE' THEN 3
      WHEN p.codigo_resultado = 'EMPATE' THEN 1
      ELSE 0
    END
  ), 0)::int AS puntos
FROM almacen.dim_equipo e
LEFT JOIN almacen.hecho_partido p ON p.equipo_local_id = e.equipo_id OR p.equipo_visitante_id = e.equipo_id
GROUP BY e.equipo_id, e.nombre_equipo, e.pais, e.liga;

CREATE OR REPLACE VIEW almacen.vw_forma_reciente_equipo AS
WITH partidos_equipo AS (
  SELECT
    e.equipo_id,
    p.partido_id,
    f.fecha_completa,
    CASE WHEN p.equipo_local_id = e.equipo_id THEN p.goles_local ELSE p.goles_visitante END AS goles_favor,
    CASE WHEN p.equipo_local_id = e.equipo_id THEN p.goles_visitante ELSE p.goles_local END AS goles_contra,
    CASE WHEN p.equipo_local_id = e.equipo_id THEN p.tiros_local ELSE p.tiros_visitante END AS tiros,
    CASE
      WHEN p.equipo_local_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_LOCAL' THEN 3
      WHEN p.equipo_visitante_id = e.equipo_id AND p.codigo_resultado = 'VICTORIA_VISITANTE' THEN 3
      WHEN p.codigo_resultado = 'EMPATE' THEN 1
      ELSE 0
    END AS puntos,
    ROW_NUMBER() OVER (PARTITION BY e.equipo_id ORDER BY f.fecha_completa DESC, p.partido_id DESC) AS orden_reciente
  FROM almacen.dim_equipo e
  JOIN almacen.hecho_partido p ON p.equipo_local_id = e.equipo_id OR p.equipo_visitante_id = e.equipo_id
  JOIN almacen.dim_fecha f ON f.fecha_id = p.fecha_id
)
SELECT
  equipo_id,
  AVG(goles_favor::numeric) AS promedio_goles_favor_ultimos_5,
  AVG(goles_contra::numeric) AS promedio_goles_contra_ultimos_5,
  AVG(tiros::numeric) AS promedio_tiros_ultimos_5,
  CASE WHEN SUM(tiros) > 0 THEN SUM(goles_favor)::numeric / SUM(tiros) ELSE 0 END AS tasa_conversion_ultimos_5,
  AVG(puntos::numeric / 3) AS tasa_puntos_ultimos_5
FROM partidos_equipo
WHERE orden_reciente <= 5
GROUP BY equipo_id;

CREATE OR REPLACE VIEW almacen.vw_indicadores_tablero AS
SELECT
  (SELECT COUNT(*)::int FROM almacen.hecho_partido) AS partidos_analizados,
  (SELECT COUNT(*)::int FROM almacen.hecho_evento) AS eventos_procesados,
  (SELECT AVG((goles_local + goles_visitante)::numeric) FROM almacen.hecho_partido) AS promedio_goles,
  (SELECT nombre_equipo FROM almacen.vw_rendimiento_equipo ORDER BY puntos DESC, goles_favor DESC LIMIT 1) AS equipo_mejor_rendimiento,
  (SELECT COUNT(*)::int FROM aplicacion.prediccion) AS predicciones_realizadas,
  NULL::numeric AS exactitud_modelo;

