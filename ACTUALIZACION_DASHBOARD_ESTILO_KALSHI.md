# Actualizacion del dashboard

## Por que antes solo aparecia 2011

El modo de muestra tomaba las primeras 300 filas de `ginf.csv`. El archivo esta ordenado por fecha y esas primeras filas pertenecen a 2011.

La seleccion de muestra ahora se reparte entre todos los anos disponibles:

- 2011
- 2012
- 2013
- 2014
- 2015
- 2016
- 2017

Para cargar los anos faltantes en una base ya configurada:

```powershell
npm.cmd run etl:muestra
npm.cmd run modelo:entrenar
npm.cmd run desarrollo
```

No hace falta eliminar la base. El ETL evita duplicar los partidos existentes.

## Escudos de los equipos

Los escudos se consultan desde TheSportsDB mediante el servidor Express. El proyecto guarda solamente la URL recibida en memoria temporal y el navegador carga la imagen remota.

- No se descargan imagenes al proyecto.
- No se agregan archivos de escudos al ZIP.
- Si no hay Internet o no se encuentra el escudo, se muestran las iniciales.

## Nuevo enfoque del tablero

- Selector visible de anos.
- Pregunta principal del periodo.
- Top 3 con tarjetas tipo mercado.
- Indice de dominio historico.
- Ranking interactivo y multicolor.
- Escudos en tarjetas, tabla y pagina de equipos.
- Separacion clara entre analisis historico y prediccion futura.
- Acceso directo a la nueva prediccion.
