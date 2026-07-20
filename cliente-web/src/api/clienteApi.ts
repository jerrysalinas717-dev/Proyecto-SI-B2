const urlApi = (import.meta.env.VITE_URL_API ?? "/api").replace(/\/$/, "");
const tiempoLimiteMilisegundos = 12000;

export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    public readonly estado?: number,
    public readonly errores: unknown[] = []
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

export function obtenerToken() {
  return localStorage.getItem("tokenFutbolPredice");
}

export function guardarToken(token: string) {
  localStorage.setItem("tokenFutbolPredice", token);
}

export function borrarSesion() {
  localStorage.removeItem("tokenFutbolPredice");
}

export async function pedirApi<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = obtenerToken();
  const controlador = new AbortController();
  const temporizador = window.setTimeout(
    () => controlador.abort(),
    tiempoLimiteMilisegundos
  );

  try {
    const respuesta = await fetch(`${urlApi}${ruta}`, {
      ...opciones,
      signal: opciones.signal ?? controlador.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opciones.headers ?? {})
      }
    });

    const cuerpo = (await respuesta.json().catch(() => ({}))) as {
      datos?: T;
      mensaje?: string;
      errores?: unknown[];
    };

    if (!respuesta.ok) {
      if (respuesta.status === 401 && ruta !== "/autenticacion/iniciar-sesion") {
        borrarSesion();
      }
      throw new ErrorApi(
        cuerpo.mensaje ?? "No se pudo completar la solicitud",
        respuesta.status,
        cuerpo.errores ?? []
      );
    }

    return (cuerpo.datos ?? cuerpo) as T;
  } catch (error) {
    if (error instanceof ErrorApi) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ErrorApi("La solicitud tardo demasiado. Verifica que el servidor este activo.");
    }
    throw new ErrorApi(
      "No se pudo conectar con el servidor. Verifica que Express este activo en el puerto 3001."
    );
  } finally {
    window.clearTimeout(temporizador);
  }
}
