CREATE SCHEMA IF NOT EXISTS preparacion;
CREATE SCHEMA IF NOT EXISTS almacen;
CREATE SCHEMA IF NOT EXISTS aplicacion;
CREATE SCHEMA IF NOT EXISTS etl;

CREATE TABLE IF NOT EXISTS preparacion.partido_original (
  partido_origen_id varchar(30) PRIMARY KEY,
  pais varchar(80) NOT NULL,
  liga varchar(30) NOT NULL,
  temporada integer NOT NULL,
  fecha_partido date NOT NULL,
  equipo_local varchar(160) NOT NULL,
  equipo_visitante varchar(160) NOT NULL,
  goles_local integer NOT NULL CHECK (goles_local >= 0),
  goles_visitante integer NOT NULL CHECK (goles_visitante >= 0),
  codigo_resultado varchar(30) NOT NULL CHECK (codigo_resultado IN ('VICTORIA_LOCAL','EMPATE','VICTORIA_VISITANTE'))
);

CREATE TABLE IF NOT EXISTS preparacion.evento_original (
  evento_origen_id varchar(40) PRIMARY KEY,
  partido_origen_id varchar(30) NOT NULL,
  codigo_tipo_evento integer,
  lado_evento integer,
  minuto_evento integer CHECK (minuto_evento IS NULL OR minuto_evento BETWEEN 0 AND 120),
  nombre_jugador varchar(160),
  nombre_equipo varchar(160),
  codigo_ubicacion_tiro integer,
  codigo_resultado_tiro integer,
  es_gol boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS almacen.dim_equipo (
  equipo_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_equipo varchar(160) NOT NULL,
  pais varchar(80) NOT NULL,
  liga varchar(30) NOT NULL,
  esta_activo boolean NOT NULL DEFAULT true,
  CONSTRAINT uq_dim_equipo UNIQUE (nombre_equipo, pais, liga)
);

CREATE TABLE IF NOT EXISTS almacen.dim_jugador (
  jugador_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_jugador varchar(160) NOT NULL,
  equipo_id integer REFERENCES almacen.dim_equipo(equipo_id),
  esta_activo boolean NOT NULL DEFAULT true,
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_dim_jugador UNIQUE (nombre_jugador, equipo_id)
);

CREATE TABLE IF NOT EXISTS almacen.dim_fecha (
  fecha_id integer PRIMARY KEY,
  fecha_completa date NOT NULL UNIQUE,
  numero_dia integer NOT NULL,
  numero_mes integer NOT NULL,
  nombre_mes varchar(20) NOT NULL,
  numero_anio integer NOT NULL,
  temporada integer NOT NULL
);

CREATE TABLE IF NOT EXISTS almacen.dim_tipo_evento (
  tipo_evento_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo_origen integer NOT NULL UNIQUE,
  nombre_evento varchar(80) NOT NULL,
  categoria_evento varchar(80) NOT NULL,
  descripcion_evento varchar(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS almacen.hecho_partido (
  partido_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partido_origen_id varchar(30) NOT NULL UNIQUE,
  fecha_id integer NOT NULL REFERENCES almacen.dim_fecha(fecha_id),
  equipo_local_id integer NOT NULL REFERENCES almacen.dim_equipo(equipo_id),
  equipo_visitante_id integer NOT NULL REFERENCES almacen.dim_equipo(equipo_id),
  goles_local integer NOT NULL CHECK (goles_local >= 0),
  goles_visitante integer NOT NULL CHECK (goles_visitante >= 0),
  tiros_local integer NOT NULL DEFAULT 0,
  tiros_visitante integer NOT NULL DEFAULT 0,
  codigo_resultado varchar(30) NOT NULL CHECK (codigo_resultado IN ('VICTORIA_LOCAL','EMPATE','VICTORIA_VISITANTE'))
);

CREATE TABLE IF NOT EXISTS almacen.hecho_evento (
  evento_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partido_id integer NOT NULL REFERENCES almacen.hecho_partido(partido_id),
  fecha_id integer NOT NULL REFERENCES almacen.dim_fecha(fecha_id),
  equipo_id integer REFERENCES almacen.dim_equipo(equipo_id),
  jugador_id integer REFERENCES almacen.dim_jugador(jugador_id),
  tipo_evento_id integer REFERENCES almacen.dim_tipo_evento(tipo_evento_id),
  minuto_evento integer CHECK (minuto_evento IS NULL OR minuto_evento BETWEEN 0 AND 120),
  codigo_ubicacion_tiro integer,
  codigo_resultado_tiro integer,
  es_gol boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS aplicacion.usuario (
  usuario_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_completo varchar(160) NOT NULL,
  correo varchar(160) NOT NULL UNIQUE,
  contrasena_hash varchar(200) NOT NULL,
  rol varchar(30) NOT NULL CHECK (rol IN ('ADMINISTRADOR','ANALISTA')),
  esta_activo boolean NOT NULL DEFAULT true,
  fecha_creacion timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aplicacion.prediccion (
  prediccion_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES aplicacion.usuario(usuario_id),
  equipo_local_id integer NOT NULL REFERENCES almacen.dim_equipo(equipo_id),
  equipo_visitante_id integer NOT NULL REFERENCES almacen.dim_equipo(equipo_id),
  probabilidad_local numeric(6,5) NOT NULL CHECK (probabilidad_local BETWEEN 0 AND 1),
  probabilidad_empate numeric(6,5) NOT NULL CHECK (probabilidad_empate BETWEEN 0 AND 1),
  probabilidad_visitante numeric(6,5) NOT NULL CHECK (probabilidad_visitante BETWEEN 0 AND 1),
  resultado_predicho varchar(30) NOT NULL CHECK (resultado_predicho IN ('VICTORIA_LOCAL','EMPATE','VICTORIA_VISITANTE')),
  nivel_confianza varchar(20) NOT NULL CHECK (nivel_confianza IN ('ALTA','MEDIA','BAJA')),
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_prediccion_equipos_diferentes CHECK (equipo_local_id <> equipo_visitante_id),
  CONSTRAINT ck_prediccion_probabilidades CHECK (
    abs((probabilidad_local + probabilidad_empate + probabilidad_visitante) - 1) <= 0.01
  )
);

CREATE TABLE IF NOT EXISTS etl.lote_carga (
  lote_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  archivo_origen varchar(200) NOT NULL,
  fecha_inicio timestamptz NOT NULL DEFAULT now(),
  fecha_fin timestamptz,
  filas_leidas integer NOT NULL DEFAULT 0,
  filas_cargadas integer NOT NULL DEFAULT 0,
  filas_rechazadas integer NOT NULL DEFAULT 0,
  estado varchar(30) NOT NULL DEFAULT 'EN_PROCESO'
);

CREATE TABLE IF NOT EXISTS etl.fila_rechazada (
  rechazo_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lote_id integer REFERENCES etl.lote_carga(lote_id),
  archivo_origen varchar(200) NOT NULL,
  numero_fila integer NOT NULL,
  motivo text NOT NULL,
  contenido_original text,
  fecha_creacion timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_equipo_nombre ON almacen.dim_equipo(nombre_equipo);
CREATE INDEX IF NOT EXISTS ix_hecho_partido_fecha ON almacen.hecho_partido(fecha_id);
CREATE INDEX IF NOT EXISTS ix_hecho_evento_equipo ON almacen.hecho_evento(equipo_id);
CREATE INDEX IF NOT EXISTS ix_prediccion_usuario ON aplicacion.prediccion(usuario_id, fecha_creacion DESC);

