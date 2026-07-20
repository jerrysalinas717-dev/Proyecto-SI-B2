export class ErrorAplicacion extends Error {
  constructor(
    mensaje: string,
    public readonly estado: number,
    public readonly errores: unknown[] = []
  ) {
    super(mensaje);
    this.name = "ErrorAplicacion";
  }
}
