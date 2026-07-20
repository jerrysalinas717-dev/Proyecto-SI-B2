# Diccionario de datos

## Esquema preparacion

### preparacion.partido_original

| Campo | Tipo | Descripcion |
|---|---|---|
| partido_origen_id | varchar | Identificador original del partido |
| pais | varchar | Pais de la liga |
| liga | varchar | Codigo de la liga |
| temporada | integer | Temporada deportiva |
| fecha_partido | date | Fecha del encuentro |
| equipo_local | varchar | Equipo local |
| equipo_visitante | varchar | Equipo visitante |
| goles_local | integer | Goles del local |
| goles_visitante | integer | Goles del visitante |
| codigo_resultado | varchar | VICTORIA_LOCAL, EMPATE o VICTORIA_VISITANTE |

### preparacion.evento_original

Contiene los eventos validados antes de cargar la tabla de hechos. Conserva el identificador original, partido, tipo, lado, minuto, jugador, equipo, ubicacion del tiro, resultado del tiro y si fue gol.

## Esquema almacen

- `almacen.dim_equipo`: informacion unica de cada equipo.
- `almacen.dim_jugador`: jugadores relacionados con equipos.
- `almacen.dim_fecha`: calendario para analisis temporal.
- `almacen.dim_tipo_evento`: traduccion de codigos de eventos.
- `almacen.hecho_partido`: resultados, goles y tiros por partido.
- `almacen.hecho_evento`: eventos individuales del dataset.

## Esquema aplicacion

- `aplicacion.usuario`: usuarios, rol, estado y contrasena cifrada.
- `aplicacion.prediccion`: probabilidades, resultado, confianza y usuario.

## Esquema etl

- `etl.lote_carga`: auditoria de cada ejecucion.
- `etl.fila_rechazada`: datos que no superaron las validaciones.

## Mapeo de columnas originales

| Dataset | Aplicacion |
|---|---|
| id_odsp | partido_origen_id |
| id_event | evento_origen_id |
| country | pais |
| league | liga |
| date | fecha_partido |
| ht | equipo_local |
| at | equipo_visitante |
| fthg | goles_local |
| ftag | goles_visitante |
| event_type | codigo_tipo_evento |
| side | lado_evento |
| time | minuto_evento |
| player | nombre_jugador |
| event_team | nombre_equipo |
| shot_place | codigo_ubicacion_tiro |
| shot_outcome | codigo_resultado_tiro |
| is_goal | es_gol |
