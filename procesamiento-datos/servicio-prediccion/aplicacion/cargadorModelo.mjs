import fs from "node:fs";
import { rutaMetricasModelo, rutaModeloResultado } from "../../utilidades/rutas.mjs";

export class CargadorModelo {
  constructor(rutaModelo = rutaModeloResultado, rutaMetricas = rutaMetricasModelo) {
    this.rutaModelo = rutaModelo;
    this.rutaMetricas = rutaMetricas;
    this.modelo = null;
    this.metricas = null;
  }

  cargar() {
    if (!fs.existsSync(this.rutaModelo)) {
      this.modelo = null;
      this.metricas = null;
      return null;
    }
    this.modelo = JSON.parse(fs.readFileSync(this.rutaModelo, "utf8"));
    this.metricas = fs.existsSync(this.rutaMetricas) ? JSON.parse(fs.readFileSync(this.rutaMetricas, "utf8")) : null;
    return this.modelo;
  }

  obtenerModelo() {
    return this.modelo ?? this.cargar();
  }

  obtenerInformacion() {
    const modelo = this.obtenerModelo();
    if (!modelo) return { disponible: false, mensaje: "Modelo no entrenado" };
    return {
      disponible: true,
      tipoModelo: modelo.tipoModelo,
      versionModelo: modelo.versionModelo,
      clases: modelo.clases,
      caracteristicas: modelo.caracteristicas,
      metricas: this.metricas
    };
  }
}

