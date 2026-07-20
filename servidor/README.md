# Servidor Futbol Predice BI

API REST desarrollada con Express y TypeScript.

- Puerto: `3001`.
- Base: PostgreSQL mediante `pg.Pool`.
- Autenticacion: JWT y bcryptjs.
- Prediccion interna: `http://localhost:8000`.
- Inicio: `npm.cmd run desarrollo:servidor` desde la raiz.
- Salud: `http://localhost:3001/api/salud`.
