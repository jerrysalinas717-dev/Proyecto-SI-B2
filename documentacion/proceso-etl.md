# Proceso ETL

## Extraccion

El proceso lee:

```text
datos/originales/ginf.csv
datos/originales/events.csv
```

`events.csv` se procesa como flujo para no cargar todos los registros en memoria.

## Transformacion

Se aplican estas reglas:

- Eliminacion de espacios sobrantes.
- Conversion de cadenas vacias y `NA` a nulos.
- Normalizacion de nombres.
- Validacion de fecha, goles, minuto, tipo de evento y lado del equipo.
- Calculo de `VICTORIA_LOCAL`, `EMPATE` o `VICTORIA_VISITANTE`.
- Conteo de tiros por partido.
- Traduccion de codigos de eventos.
- Registro de filas rechazadas.

## Carga

El orden es:

1. Tipos de evento.
2. Equipos.
3. Fechas.
4. Partidos originales y hechos de partido.
5. Jugadores.
6. Eventos originales y hechos de evento.

Las inserciones usan transacciones y `ON CONFLICT` para evitar duplicados cuando el ETL se ejecuta nuevamente.

## Ejecucion

Muestra:

```powershell
npm.cmd run etl:muestra
```

Completa:

```powershell
npm.cmd run etl:completo
```

Al finalizar se muestran filas leidas, cargadas, rechazadas, duracion, estado y modo de ejecucion.
