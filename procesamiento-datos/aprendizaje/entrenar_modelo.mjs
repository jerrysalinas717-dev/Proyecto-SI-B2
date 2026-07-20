import fs from "node:fs";
import { clasesResultado, crearConjuntoCaracteristicas, leerDatosEntrenamientoDesdePostgres, nombresCaracteristicas } from "./caracteristicas.mjs";
import { rutaMetricasModelo, rutaModeloResultado, rutaModelos } from "../utilidades/rutas.mjs";

function calcularEscala(filas) {
  const cantidad = filas[0].caracteristicas.length;
  const medias = Array(cantidad).fill(0);
  const desvios = Array(cantidad).fill(0);
  for (const fila of filas) fila.caracteristicas.forEach((valor, indice) => (medias[indice] += valor));
  medias.forEach((_, indice) => (medias[indice] /= filas.length));
  for (const fila of filas) fila.caracteristicas.forEach((valor, indice) => (desvios[indice] += (valor - medias[indice]) ** 2));
  desvios.forEach((_, indice) => {
    desvios[indice] = Math.sqrt(desvios[indice] / filas.length) || 1;
  });
  return { medias, desvios };
}

function escalar(vector, escala) {
  return vector.map((valor, indice) => (valor - escala.medias[indice]) / escala.desvios[indice]);
}

function softmax(puntajes) {
  const maximo = Math.max(...puntajes);
  const exponenciales = puntajes.map((valor) => Math.exp(valor - maximo));
  const suma = exponenciales.reduce((a, b) => a + b, 0);
  return exponenciales.map((valor) => valor / suma);
}

function predecirProbabilidades(modelo, vector) {
  const entrada = [1, ...escalar(vector, modelo.escala)];
  const puntajes = modelo.pesos.map((pesosClase) => pesosClase.reduce((suma, peso, indice) => suma + peso * entrada[indice], 0));
  return softmax(puntajes);
}

function entrenarRegresionLogistica(filasEntrenamiento, opciones = {}) {
  const epocas = opciones.epocas ?? 260;
  const tasa = opciones.tasa ?? 0.04;
  const escala = calcularEscala(filasEntrenamiento);
  const cantidadCaracteristicas = filasEntrenamiento[0].caracteristicas.length + 1;
  const pesos = clasesResultado.map(() => Array(cantidadCaracteristicas).fill(0));
  for (let epoca = 0; epoca < epocas; epoca += 1) {
    for (const fila of filasEntrenamiento) {
      const entrada = [1, ...escalar(fila.caracteristicas, escala)];
      const puntajes = pesos.map((pesosClase) => pesosClase.reduce((suma, peso, indice) => suma + peso * entrada[indice], 0));
      const probabilidades = softmax(puntajes);
      const claseReal = clasesResultado.indexOf(fila.resultado);
      for (let clase = 0; clase < clasesResultado.length; clase += 1) {
        const error = probabilidades[clase] - (clase === claseReal ? 1 : 0);
        for (let indice = 0; indice < entrada.length; indice += 1) {
          pesos[clase][indice] -= tasa * error * entrada[indice];
        }
      }
    }
  }
  return {
    tipoModelo: "regresion_logistica_multinomial_js",
    versionModelo: "1.0.0",
    clases: clasesResultado,
    caracteristicas: nombresCaracteristicas,
    escala,
    pesos
  };
}

function evaluar(modelo, filas) {
  const matriz = clasesResultado.map(() => clasesResultado.map(() => 0));
  let aciertos = 0;
  for (const fila of filas) {
    const probabilidades = predecirProbabilidades(modelo, fila.caracteristicas);
    const predicha = probabilidades.indexOf(Math.max(...probabilidades));
    const real = clasesResultado.indexOf(fila.resultado);
    matriz[real][predicha] += 1;
    if (predicha === real) aciertos += 1;
  }
  const metricasClase = clasesResultado.map((_, indice) => {
    const verdaderosPositivos = matriz[indice][indice];
    const falsosPositivos = matriz.reduce((suma, fila, filaIndice) => suma + (filaIndice === indice ? 0 : fila[indice]), 0);
    const falsosNegativos = matriz[indice].reduce((suma, valor, columnaIndice) => suma + (columnaIndice === indice ? 0 : valor), 0);
    const precision = verdaderosPositivos + falsosPositivos === 0 ? 0 : verdaderosPositivos / (verdaderosPositivos + falsosPositivos);
    const exhaustividad = verdaderosPositivos + falsosNegativos === 0 ? 0 : verdaderosPositivos / (verdaderosPositivos + falsosNegativos);
    const f1 = precision + exhaustividad === 0 ? 0 : (2 * precision * exhaustividad) / (precision + exhaustividad);
    return { precision, exhaustividad, f1 };
  });
  const promedio = (clave) => metricasClase.reduce((suma, valor) => suma + valor[clave], 0) / metricasClase.length;
  return {
    exactitud: filas.length === 0 ? 0 : aciertos / filas.length,
    precisionMacro: promedio("precision"),
    exhaustividadMacro: promedio("exhaustividad"),
    f1Macro: promedio("f1"),
    matrizConfusion: matriz
  };
}

export async function entrenarModelo() {
  fs.mkdirSync(rutaModelos, { recursive: true });
  const { partidos, tirosPorPartido } = await leerDatosEntrenamientoDesdePostgres();
  const filas = crearConjuntoCaracteristicas(partidos, tirosPorPartido).filter((fila) => fila.caracteristicas.some((valor) => valor !== 0));
  if (filas.length < 30) throw new Error("No hay suficientes partidos historicos para entrenar sin inventar datos.");
  const indiceCorte = Math.max(1, Math.floor(filas.length * 0.8));
  const entrenamiento = filas.slice(0, indiceCorte);
  const prueba = filas.slice(indiceCorte);
  const modelo = entrenarRegresionLogistica(entrenamiento);
  const metricas = {
    ...evaluar(modelo, prueba),
    cantidadEntrenamiento: entrenamiento.length,
    cantidadPrueba: prueba.length,
    fechaEntrenamiento: new Date().toISOString(),
    variablesUtilizadas: nombresCaracteristicas,
    fuenteDatos: "PostgreSQL: almacen.hecho_partido"
  };
  fs.writeFileSync(rutaModeloResultado, JSON.stringify(modelo, null, 2), "utf8");
  fs.writeFileSync(rutaMetricasModelo, JSON.stringify(metricas, null, 2), "utf8");
  console.log(JSON.stringify(metricas, null, 2));
  return { modelo, metricas };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  entrenarModelo().catch((error) => {
    console.error(`Error al entrenar modelo: ${error.message}`);
    process.exitCode = 1;
  });
}

export { entrenarRegresionLogistica, evaluar, predecirProbabilidades, softmax };

