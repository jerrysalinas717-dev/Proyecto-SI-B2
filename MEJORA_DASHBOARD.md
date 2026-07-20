# Mejora del dashboard por ano

Esta version orienta la aplicacion a una pregunta clara:

> Que equipos dominaron cada ano y como puede utilizarse el historial para predecir partidos.

## Archivos modificados

- `servidor/src/repositorios/RepositorioTablero.ts`
- `servidor/src/controladores/ControladorTablero.ts`
- `servidor/src/rutas/tablero.ts`
- `cliente-web/src/paginas/PaginaTablero.tsx`
- `cliente-web/src/recursos/estilos.css`

## Nuevas funciones

- Selector interactivo por ano.
- Ranking de los 10 mejores equipos del ano.
- Barras horizontales con colores y detalle al pasar el cursor.
- Indicadores de partidos, goles, lider, mejor ataque, eventos y exactitud.
- Tendencia de goles por ano.
- Distribucion de victorias locales, empates y victorias visitantes.
- Tabla explicativa del top 5.
- Eventos mas frecuentes.
- Acceso visible al modulo de prediccion.

## Endpoints agregados o mejorados

- `GET /api/tablero/anios`
- `GET /api/tablero/resumen?anio=2012`
- `GET /api/tablero/mejores-equipos?anio=2012`
- `GET /api/tablero/tendencia-goles`
- `GET /api/tablero/distribucion-resultados?anio=2012`
- `GET /api/tablero/distribucion-eventos?anio=2012`

## Como ejecutar

Desde la raiz:

```powershell
npm.cmd run desarrollo
```

Abre:

```text
http://localhost:5173/tablero
```

## Importante sobre los anos

Si solo aparece 2012, la base contiene los datos de muestra. Para cargar todos los anos del CSV real ejecuta:

```powershell
npm.cmd run etl:completo
npm.cmd run modelo:entrenar
npm.cmd run desarrollo
```

Con los archivos completos deben aparecer anos entre 2011 y 2017, segun los datos disponibles.

## Pruebas realizadas

- Compilacion del servidor: correcta.
- Compilacion del cliente: correcta.
- ESLint del servidor y cliente: correcto.
- Pruebas del servidor: 2 aprobadas.
- Pruebas del cliente: 1 aprobada.
- Pruebas del procesamiento: 6 aprobadas.

## Actualizacion de anos y escudos

- El modo `etl:muestra` ya no toma solamente las primeras 300 filas del CSV.
- La muestra se distribuye entre 2011, 2012, 2013, 2014, 2015, 2016 y 2017.
- Para agregar los anos a una base que ya tenia solo 2011, vuelve a ejecutar `npm.cmd run etl:muestra`.
- La pagina Equipos y el tablero consultan escudos mediante URLs de TheSportsDB.
- Los archivos de imagen no se descargan ni se guardan dentro del proyecto.
- Si no existe conexion a Internet o no se encuentra un equipo, se muestran sus iniciales.

## Enfoque visual

El tablero adopta una lectura inspirada en mercados de prediccion:

- pregunta principal del periodo;
- selector de anos visible;
- tarjetas de los tres equipos dominantes;
- indice historico de dominio claramente diferenciado de una probabilidad;
- ranking interactivo;
- acceso directo al modelo de prediccion.
