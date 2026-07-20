import { RepositorioUsuario } from "../repositorios/RepositorioUsuario.js";
import { ErrorAplicacion } from "../utilidades/ErrorAplicacion.js";
import { cifrarContrasena, generarToken, verificarContrasena } from "../utilidades/seguridad.js";

interface DatosRegistro {
  nombreCompleto: string;
  correo: string;
  contrasena: string;
}

interface DatosInicioSesion {
  correo: string;
  contrasena: string;
}

export class ServicioAutenticacion {
  private repositorio = new RepositorioUsuario();

  async registrar(datos: DatosRegistro) {
    const correo = datos.correo.trim().toLowerCase();
    const existe = await this.repositorio.obtenerPorCorreo(correo);
    if (existe) {
      throw new ErrorAplicacion("El correo ya esta registrado", 409);
    }

    const contrasenaHash = await cifrarContrasena(datos.contrasena);
    const usuario = await this.repositorio.crear({
      nombreCompleto: datos.nombreCompleto.trim(),
      correo,
      contrasenaHash,
      rol: "ANALISTA"
    });

    return { usuario, token: generarToken(usuario) };
  }

  async iniciarSesion(datos: DatosInicioSesion) {
    const correo = datos.correo.trim().toLowerCase();
    const usuario = await this.repositorio.obtenerPorCorreo(correo);

    if (!usuario || !usuario.estaActivo) {
      throw new ErrorAplicacion("Credenciales incorrectas", 401);
    }

    const valida = await verificarContrasena(datos.contrasena, usuario.contrasenaHash);
    if (!valida) {
      throw new ErrorAplicacion("Credenciales incorrectas", 401);
    }

    const { contrasenaHash: _contrasenaHash, ...usuarioSeguro } = usuario;
    return { usuario: usuarioSeguro, token: generarToken(usuarioSeguro) };
  }
}
