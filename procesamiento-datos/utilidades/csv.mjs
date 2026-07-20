import fs from "node:fs";
import readline from "node:readline";

export function analizarLineaCsv(linea) {
  const valores = [];
  let actual = "";
  let enComillas = false;
  for (let indice = 0; indice < linea.length; indice += 1) {
    const caracter = linea[indice];
    const siguiente = linea[indice + 1];
    if (caracter === '"' && enComillas && siguiente === '"') {
      actual += '"';
      indice += 1;
    } else if (caracter === '"') {
      enComillas = !enComillas;
    } else if (caracter === "," && !enComillas) {
      valores.push(actual);
      actual = "";
    } else {
      actual += caracter;
    }
  }
  valores.push(actual);
  return valores.map((valor) => {
    const limpio = valor.trim();
    return limpio === "NA" || limpio === "" ? null : limpio;
  });
}

export async function* leerCsv(rutaArchivo, opciones = {}) {
  const flujo = fs.createReadStream(rutaArchivo, { encoding: "utf8" });
  const lector = readline.createInterface({ input: flujo, crlfDelay: Number.POSITIVE_INFINITY });
  let cabeceras = null;
  let numeroFila = 0;
  for await (const linea of lector) {
    numeroFila += 1;
    if (numeroFila === 1) {
      cabeceras = analizarLineaCsv(linea);
      continue;
    }
    if (!linea.trim()) continue;
    const valores = analizarLineaCsv(linea);
    const fila = {};
    cabeceras.forEach((cabecera, indice) => {
      fila[cabecera] = valores[indice] ?? null;
    });
    yield { fila, numeroFila };
    if (opciones.limite && numeroFila > opciones.limite) break;
  }
}

export function escribirCsv(rutaArchivo, cabeceras, filas) {
  const escapar = (valor) => {
    if (valor === null || valor === undefined) return "";
    const texto = String(valor);
    return /[",\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
  };
  const lineas = [cabeceras.join(",")];
  for (const fila of filas) lineas.push(cabeceras.map((cabecera) => escapar(fila[cabecera])).join(","));
  fs.writeFileSync(rutaArchivo, `${lineas.join("\n")}\n`, "utf8");
}

