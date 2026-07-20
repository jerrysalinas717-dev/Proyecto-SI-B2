import { configuracion } from "../configuracion/configuracion.js";
import { RepositorioEquipo } from "../repositorios/RepositorioEquipo.js";
import { RepositorioPrediccion } from "../repositorios/RepositorioPrediccion.js";
import { ErrorAplicacion } from "../utilidades/ErrorAplicacion.js";

interface RespuestaServicioPrediccion {
  probabilidad_local: number;
  probabilidad_empate: number;
  probabilidad_visitante: number;
  resultado_predicho: "VICTORIA_LOCAL" | "EMPATE" | "VICTORIA_VISITANTE";
  nivel_confianza: "ALTA" | "MEDIA" | "BAJA";
}

export class ServicioPrediccion {
  private repositorio = new RepositorioPrediccion();
  private equipos = new RepositorioEquipo();

  async crear(usuarioId: number, local: number, visitante: number) {
    if (local === visitante) {
      throw new ErrorAplicacion("Los equipos deben ser diferentes", 400);
    }

    const [equipoLocal, equipoVisitante] = await Promise.all([
      this.equipos.obtenerPorId(local),
      this.equipos.obtenerPorId(visitante)
    ]);

    if (!equipoLocal || !equipoVisitante) {
      throw new ErrorAplicacion("Equipo no encontrado", 404);
    }

    const caracteristicas = await this.repositorio.obtenerCaracteristicas(local, visitante);

    let respuesta: globalThis.Response;
    try {
      respuesta = await fetch(`${configuracion.SERVICIO_PREDICCION_URL}/predecir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipo_local_id: local,
          equipo_visitante_id: visitante,
          caracteristicas
        }),
        signal: AbortSignal.timeout(10000)
      });
    } catch {
      throw new ErrorAplicacion(
        "No se pudo conectar con el servicio de prediccion del puerto 8000",
        503
      );
    }

    const cuerpo = (await respuesta.json().catch(() => ({}))) as Partial<
      RespuestaServicioPrediccion & { mensaje: string }
    >;

    if (!respuesta.ok) {
      throw new ErrorAplicacion(
        cuerpo.mensaje ?? "Servicio de prediccion no disponible",
        respuesta.status === 503 ? 503 : 502
      );
    }

    const prediccion = cuerpo as RespuestaServicioPrediccion;
    const suma =
      Number(prediccion.probabilidad_local) +
      Number(prediccion.probabilidad_empate) +
      Number(prediccion.probabilidad_visitante);

    if (!Number.isFinite(suma) || Math.abs(suma - 1) > 0.01) {
      throw new ErrorAplicacion("El servicio devolvio probabilidades invalidas", 502);
    }

    return this.repositorio.crear(usuarioId, local, visitante, prediccion);
  }
}
