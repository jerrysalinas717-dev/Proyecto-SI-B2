function softmax(puntajes) {
  const maximo = Math.max(...puntajes);
  const exponenciales = puntajes.map((valor) => Math.exp(valor - maximo));
  const suma = exponenciales.reduce((a, b) => a + b, 0);
  return exponenciales.map((valor) => valor / suma);
}

function escalar(vector, escala) {
  return vector.map((valor, indice) => (valor - escala.medias[indice]) / escala.desvios[indice]);
}

function nivelConfianza(probabilidad) {
  if (probabilidad >= 0.7) return "ALTA";
  if (probabilidad >= 0.5) return "MEDIA";
  return "BAJA";
}

export class PredictorResultado {
  constructor(modelo) {
    this.modelo = modelo;
  }

  predecir(caracteristicas) {
    const vector = this.modelo.caracteristicas.map((nombre) => Number(caracteristicas[nombre] ?? 0));
    const entrada = [1, ...escalar(vector, this.modelo.escala)];
    const puntajes = this.modelo.pesos.map((pesosClase) => pesosClase.reduce((suma, peso, indice) => suma + peso * entrada[indice], 0));
    const probabilidades = softmax(puntajes);
    const indiceGanador = probabilidades.indexOf(Math.max(...probabilidades));
    const probabilidadGanadora = probabilidades[indiceGanador];
    return {
      probabilidad_local: Number(probabilidades[0].toFixed(5)),
      probabilidad_empate: Number(probabilidades[1].toFixed(5)),
      probabilidad_visitante: Number(probabilidades[2].toFixed(5)),
      resultado_predicho: this.modelo.clases[indiceGanador],
      nivel_confianza: nivelConfianza(probabilidadGanadora),
      version_modelo: this.modelo.versionModelo
    };
  }
}

export { nivelConfianza, softmax };

