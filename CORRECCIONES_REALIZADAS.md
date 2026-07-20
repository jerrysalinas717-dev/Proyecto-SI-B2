# Correcciones realizadas

- PostgreSQL quedo como unica base de datos.
- Se eliminaron los scripts y carpetas de la configuracion anterior.
- ETL, entrenamiento y prediccion usan Node.js y archivos `.mjs`.
- Express se unifico en el puerto `3001`.
- React usa el puerto `5173`.
- El servicio de prediccion usa el puerto `8000`.
- El cliente usa `/api` y un proxy de Vite hacia Express.
- Se mejoro el mensaje de error de conexion del inicio de sesion.
- Express comprueba PostgreSQL antes de anunciar que esta listo.
- Se corrigieron CORS, codigos HTTP y manejo global de errores.
- Se protegieron las consultas de predicciones por usuario.
- Se agregaron restricciones de probabilidades y equipos diferentes.
- Se corrigio la creacion idempotente de los diez usuarios.
- Se actualizaron los scripts de configuracion para varias versiones de PostgreSQL.
- Se eliminaron pruebas duplicadas, compilaciones y secretos locales del paquete final.
- Se actualizaron README y documentacion tecnica.
