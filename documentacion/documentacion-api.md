# Documentacion API

URL de desarrollo:

```text
http://localhost:3001/api
```

## Autenticacion

- `POST /autenticacion/registrar`
- `POST /autenticacion/iniciar-sesion`
- `GET /autenticacion/perfil`

Ejemplo de login:

```json
{
  "correo": "analista01@futbolpredice.local",
  "contrasena": "FutbolPredice2026!"
}
```

## Usuarios

- `GET /usuarios`
- `GET /usuarios/:id`
- `POST /usuarios`
- `PUT /usuarios/:id`
- `DELETE /usuarios/:id`
- `GET /usuarios/:usuarioId/predicciones`

La administracion de usuarios requiere rol `ADMINISTRADOR`.

## Equipos

- `GET /equipos`
- `GET /equipos/:id`
- `GET /equipos/:id/forma`
- `GET /equipos/comparar`

Filtros principales: `pagina`, `limite`, `busqueda`, `liga`, `pais` y `temporada`.

## Tablero

- `GET /tablero/resumen`
- `GET /tablero/mejores-equipos`
- `GET /tablero/tendencia-goles`
- `GET /tablero/distribucion-eventos`
- `GET /tablero/ligas`
- `GET /tablero/comparacion-equipos`

## Eventos

- `GET /eventos`
- `GET /eventos/:id`

Los resultados se paginan y el limite maximo es 100.

## Predicciones

- `POST /predicciones`
- `GET /predicciones`
- `GET /predicciones/:id`

Solicitud minima:

```json
{
  "equipoLocalId": 1,
  "equipoVisitanteId": 2
}
```

Express consulta las caracteristicas historicas, llama al servicio interno y guarda el resultado en PostgreSQL.

## Salud

- `GET /salud`

Muestra el estado de Express, PostgreSQL y el servicio de prediccion.

## Respuestas de error

```json
{
  "exito": false,
  "mensaje": "Descripcion comprensible",
  "errores": [],
  "fecha": "2026-07-19T00:00:00.000Z"
}
```
