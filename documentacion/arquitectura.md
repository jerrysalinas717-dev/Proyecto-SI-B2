# Arquitectura

## Componentes

```mermaid
flowchart TD
  usuario[Usuario] --> cliente[Cliente web React y Vite]
  cliente -->|/api| proxy[Proxy de Vite]
  proxy --> servidor[Servidor REST Express]
  servidor --> base[(PostgreSQL)]
  servidor --> servicio[Servicio de prediccion Node.js]
  etl[ETL Node.js] --> base
  base --> entrenamiento[Entrenamiento Node.js]
  entrenamiento --> modelo[Modelo JSON]
  modelo --> servicio
```

## Comunicacion

- React se ejecuta en el puerto `5173`.
- Express se ejecuta en el puerto `3001`.
- El servicio de prediccion se ejecuta en el puerto `8000`.
- PostgreSQL usa el puerto `5432`.
- El navegador solo consume rutas `/api`.
- Vite redirige `/api` hacia Express.
- Express consulta PostgreSQL mediante `pg.Pool`.
- Express consume internamente el servicio de prediccion.

## Servidor por capas

```text
ruta -> controlador -> servicio -> repositorio -> PostgreSQL
```

Los controladores no contienen consultas SQL. Los repositorios usan parametros `$1`, `$2` y siguientes.
