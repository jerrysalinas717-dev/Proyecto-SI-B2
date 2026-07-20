CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_correo_minuscula
  ON aplicacion.usuario (lower(correo));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_prediccion_equipos_diferentes'
  ) THEN
    ALTER TABLE aplicacion.prediccion
      ADD CONSTRAINT ck_prediccion_equipos_diferentes
      CHECK (equipo_local_id <> equipo_visitante_id) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_prediccion_probabilidades'
  ) THEN
    ALTER TABLE aplicacion.prediccion
      ADD CONSTRAINT ck_prediccion_probabilidades
      CHECK (
        probabilidad_local BETWEEN 0 AND 1
        AND probabilidad_empate BETWEEN 0 AND 1
        AND probabilidad_visitante BETWEEN 0 AND 1
        AND abs((probabilidad_local + probabilidad_empate + probabilidad_visitante) - 1) <= 0.01
      ) NOT VALID;
  END IF;
END $$;
