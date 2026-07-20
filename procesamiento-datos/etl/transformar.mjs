import {
  calcularResultado,
  convertirEntero,
  normalizarNombreEquipo,
  normalizarNombreJugador,
  normalizarTexto,
  validarGol,
  validarMinutoEvento
} from "./validadores.mjs";

export const nombresMes = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
];

export const mapaTipoEvento = new Map([
  [0, "Anuncio"],
  [1, "Intento"],
  [2, "Tiro de esquina"],
  [3, "Falta"],
  [4, "Tarjeta amarilla"],
  [5, "Segunda amarilla"],
  [6, "Tarjeta roja"],
  [7, "Sustitucion"],
  [8, "Tiro libre ganado"],
  [9, "Fuera de juego"],
  [10, "Mano"],
  [11, "Penal concedido"]
]);

export function transformarPartido(fila, tirosPorPartido = { local: 0, visitante: 0 }) {
  const golesLocal = convertirEntero(fila.fthg);
  const golesVisitante = convertirEntero(fila.ftag);
  const fecha = new Date(`${fila.date}T00:00:00Z`);
  const codigoResultado = calcularResultado(golesLocal, golesVisitante);
  const partido = {
    partidoOrigenId: normalizarTexto(fila.id_odsp),
    pais: normalizarTexto(fila.country),
    liga: normalizarTexto(fila.league),
    temporada: convertirEntero(fila.season),
    fechaPartido: Number.isNaN(fecha.getTime()) ? null : fila.date,
    equipoLocal: normalizarNombreEquipo(fila.ht),
    equipoVisitante: normalizarNombreEquipo(fila.at),
    golesLocal,
    golesVisitante,
    codigoResultado,
    tirosLocal: tirosPorPartido.local ?? 0,
    tirosVisitante: tirosPorPartido.visitante ?? 0
  };
  const errores = [];
  if (!partido.partidoOrigenId) errores.push("partido_origen_id vacio");
  if (!partido.fechaPartido) errores.push("fecha_partido invalida");
  if (!partido.equipoLocal || !partido.equipoVisitante) errores.push("equipo vacio");
  if (codigoResultado === null) errores.push("goles invalidos");
  return { partido, errores };
}

export function transformarEvento(fila) {
  const minuto = convertirEntero(fila.time);
  const esGol = convertirEntero(fila.is_goal);
  const evento = {
    eventoOrigenId: normalizarTexto(fila.id_event),
    partidoOrigenId: normalizarTexto(fila.id_odsp),
    codigoTipoEvento: convertirEntero(fila.event_type),
    ladoEvento: convertirEntero(fila.side),
    minutoEvento: minuto,
    nombreJugador: normalizarNombreJugador(fila.player),
    nombreEquipo: normalizarNombreEquipo(fila.event_team),
    codigoUbicacionTiro: convertirEntero(fila.shot_place),
    codigoResultadoTiro: convertirEntero(fila.shot_outcome),
    esGol
  };
  const errores = [];
  if (!evento.eventoOrigenId || !evento.partidoOrigenId) errores.push("identificador de evento vacio");
  if (!validarMinutoEvento(minuto)) errores.push("minuto_evento fuera de rango");
  if (!validarGol(esGol)) errores.push("es_gol invalido");
  if (!mapaTipoEvento.has(evento.codigoTipoEvento)) errores.push("codigo_tipo_evento no reconocido");
  if (![1, 2].includes(evento.ladoEvento)) errores.push("lado_evento invalido");
  return { evento, errores };
}

export function crearFechaDimension(fechaPartido, temporada) {
  const fecha = new Date(`${fechaPartido}T00:00:00Z`);
  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth() + 1;
  const dia = fecha.getUTCDate();
  return {
    fechaId: anio * 10000 + mes * 100 + dia,
    fechaCompleta: fechaPartido,
    numeroDia: dia,
    numeroMes: mes,
    nombreMes: nombresMes[mes - 1],
    numeroAnio: anio,
    temporada
  };
}

