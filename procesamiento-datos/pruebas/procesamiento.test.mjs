import assert from "node:assert/strict";
import test from "node:test";
import { crearCaracteristicasDesdeHistorial } from "../aprendizaje/caracteristicas.mjs";
import { calcularResultado, normalizarNombreJugador, validarMinutoEvento } from "../etl/validadores.mjs";
import { nivelConfianza, softmax } from "../servicio-prediccion/aplicacion/predictor.mjs";

test("normaliza nombres de jugadores", () => {
  assert.equal(normalizarNombreJugador("  mladen   petric "), "Mladen Petric");
});

test("valida minutos permitidos", () => {
  assert.equal(validarMinutoEvento(90), true);
  assert.equal(validarMinutoEvento(121), false);
});

test("calcula resultado del partido", () => {
  assert.equal(calcularResultado(2, 1), "VICTORIA_LOCAL");
  assert.equal(calcularResultado(1, 1), "EMPATE");
  assert.equal(calcularResultado(0, 3), "VICTORIA_VISITANTE");
});

test("calcula caracteristicas historicas sin usar el futuro", () => {
  const caracteristicas = crearCaracteristicasDesdeHistorial(
    [{ golesFavor: 2, golesContra: 1, tiros: 10, puntos: 3 }],
    [{ golesFavor: 1, golesContra: 1, tiros: 5, puntos: 1 }]
  );
  assert.equal(caracteristicas[0], 2);
  assert.equal(caracteristicas[2], 1);
  assert.equal(caracteristicas[6], 0.2);
});

test("probabilidades suman aproximadamente uno", () => {
  const probabilidades = softmax([1, 2, 3]);
  const suma = probabilidades.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(suma - 1) < 0.000001);
});

test("niveles de confianza", () => {
  assert.equal(nivelConfianza(0.7), "ALTA");
  assert.equal(nivelConfianza(0.55), "MEDIA");
  assert.equal(nivelConfianza(0.49), "BAJA");
});

