export function normalizarTexto(valor) {
  if (valor === null || valor === undefined) return null;
  const limpio = String(valor).trim().replace(/\s+/g, " ");
  return limpio.length === 0 ? null : limpio;
}

export function normalizarNombreEquipo(nombre) {
  return normalizarTexto(nombre);
}

export function normalizarNombreJugador(nombre) {
  const limpio = normalizarTexto(nombre);
  if (!limpio) return null;
  return limpio
    .split(" ")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
    .join(" ");
}

export function convertirEntero(valor) {
  if (valor === null || valor === undefined) return null;
  const numero = Number.parseInt(String(valor), 10);
  return Number.isFinite(numero) ? numero : null;
}

export function validarMinutoEvento(minuto) {
  const numero = convertirEntero(minuto);
  return numero !== null && numero >= 0 && numero <= 120;
}

export function calcularResultado(golesLocal, golesVisitante) {
  const local = convertirEntero(golesLocal);
  const visitante = convertirEntero(golesVisitante);
  if (local === null || visitante === null || local < 0 || visitante < 0) return null;
  if (local > visitante) return "VICTORIA_LOCAL";
  if (local < visitante) return "VICTORIA_VISITANTE";
  return "EMPATE";
}

export function validarGol(valor) {
  const numero = convertirEntero(valor);
  return numero === 0 || numero === 1;
}

