# Guia de pruebas

## Pruebas automaticas

Desde la raiz:

```powershell
npm.cmd run analizar
npm.cmd run pruebas
npm.cmd run compilar
```

## Prueba de salud

```powershell
Invoke-RestMethod http://localhost:3001/api/salud
```

## Prueba de inicio de sesion

```powershell
$contenido = @{
  correo = "analista01@futbolpredice.local"
  contrasena = "FutbolPredice2026!"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3001/api/autenticacion/iniciar-sesion" `
  -ContentType "application/json" `
  -Body $contenido
```

## Flujo manual

1. Inicia los servicios con `npm.cmd run desarrollo`.
2. Abre `http://localhost:5173/iniciar-sesion`.
3. Inicia sesion con un analista.
4. Comprueba el tablero.
5. Selecciona dos equipos distintos.
6. Ejecuta una prediccion.
7. Revisa el historial.
8. Cierra sesion.
9. Ingresa como administrador.
10. Comprueba la gestion de usuarios.

## Interpretacion de errores

- `Failed to fetch`: Express no esta disponible o Vite no fue reiniciado.
- `503` al predecir: el servicio o el modelo no esta disponible.
- Error de PostgreSQL: revisa el servicio local y los archivos `.env`.
