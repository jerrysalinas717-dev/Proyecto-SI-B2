# Modelo de prediccion

El modelo es una regresion logistica multinomial implementada con JavaScript.

## Clases

- `VICTORIA_LOCAL`
- `EMPATE`
- `VICTORIA_VISITANTE`

## Variables

- `promedio_goles_favor_local_ultimos_5`
- `promedio_goles_contra_local_ultimos_5`
- `promedio_goles_favor_visitante_ultimos_5`
- `promedio_goles_contra_visitante_ultimos_5`
- `promedio_tiros_local_ultimos_5`
- `promedio_tiros_visitante_ultimos_5`
- `tasa_conversion_local_ultimos_5`
- `tasa_conversion_visitante_ultimos_5`
- `tasa_puntos_local_ultimos_5`
- `tasa_puntos_visitante_ultimos_5`

Las caracteristicas de cada partido se calculan antes de incorporar su resultado al historial. Esto evita usar informacion futura.

## Entrenamiento

```powershell
npm.cmd run modelo:entrenar
```

El proceso:

1. Consulta `almacen.hecho_partido`.
2. Ordena cronologicamente.
3. Calcula historiales por equipo.
4. Divide 80 por ciento para entrenamiento y 20 por ciento para prueba respetando el tiempo.
5. Entrena el modelo.
6. Calcula exactitud, precision macro, exhaustividad macro, F1 macro y matriz de confusion.
7. Guarda el modelo y las metricas reales.

## Servicio

- `GET http://localhost:8000/salud`
- `GET http://localhost:8000/modelo/informacion`
- `POST http://localhost:8000/predecir`

Las probabilidades se calculan con los pesos del modelo y deben sumar aproximadamente uno.
