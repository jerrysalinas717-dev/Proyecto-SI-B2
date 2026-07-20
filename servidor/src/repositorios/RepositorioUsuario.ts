import { consultar } from "../configuracion/baseDatos.js";
import type { UsuarioConHash, UsuarioSeguro } from "../tipos/tipos.js";

function mapearUsuario(fila: any): UsuarioSeguro {
  return {
    usuarioId: Number(fila.usuario_id),
    nombreCompleto: fila.nombre_completo,
    correo: fila.correo,
    rol: fila.rol,
    estaActivo: Boolean(fila.esta_activo),
    fechaCreacion: fila.fecha_creacion?.toISOString?.() ?? fila.fecha_creacion
  };
}

function mapearUsuarioHash(fila: any): UsuarioConHash {
  return { ...mapearUsuario(fila), contrasenaHash: fila.contrasena_hash };
}

export class RepositorioUsuario {
  async crear(datos: {
    nombreCompleto: string;
    correo: string;
    contrasenaHash: string;
    rol: "ADMINISTRADOR" | "ANALISTA";
  }): Promise<UsuarioSeguro> {
    const filas = await consultar(
      `INSERT INTO aplicacion.usuario(nombre_completo, correo, contrasena_hash, rol)
       VALUES ($1, lower($2), $3, $4)
       RETURNING usuario_id, nombre_completo, correo, rol, esta_activo, fecha_creacion`,
      [datos.nombreCompleto, datos.correo, datos.contrasenaHash, datos.rol]
    );
    return mapearUsuario(filas[0]);
  }

  async crearSiNoExiste(datos: {
    nombreCompleto: string;
    correo: string;
    contrasenaHash: string;
    rol: "ADMINISTRADOR" | "ANALISTA";
  }): Promise<UsuarioSeguro> {
    const filas = await consultar(
      `INSERT INTO aplicacion.usuario(nombre_completo, correo, contrasena_hash, rol)
       VALUES ($1, lower($2), $3, $4)
       ON CONFLICT (correo) DO UPDATE
       SET nombre_completo = EXCLUDED.nombre_completo,
           rol = EXCLUDED.rol,
           contrasena_hash = EXCLUDED.contrasena_hash,
           esta_activo = true
       RETURNING usuario_id, nombre_completo, correo, rol, esta_activo, fecha_creacion`,
      [datos.nombreCompleto, datos.correo, datos.contrasenaHash, datos.rol]
    );
    return mapearUsuario(filas[0]);
  }

  async obtenerPorCorreo(correo: string): Promise<UsuarioConHash | null> {
    const filas = await consultar(
      "SELECT * FROM aplicacion.usuario WHERE correo = lower($1) LIMIT 1",
      [correo]
    );
    return filas[0] ? mapearUsuarioHash(filas[0]) : null;
  }

  async obtenerPorId(usuarioId: number): Promise<UsuarioSeguro | null> {
    const filas = await consultar(
      `SELECT usuario_id, nombre_completo, correo, rol, esta_activo, fecha_creacion
       FROM aplicacion.usuario
       WHERE usuario_id = $1`,
      [usuarioId]
    );
    return filas[0] ? mapearUsuario(filas[0]) : null;
  }

  async listar(pagina: number, limite: number, busqueda?: string) {
    const salto = (pagina - 1) * limite;
    const filas = await consultar(
      `SELECT usuario_id, nombre_completo, correo, rol, esta_activo, fecha_creacion
       FROM aplicacion.usuario
       WHERE ($1::text IS NULL OR nombre_completo ILIKE '%' || $1 || '%' OR correo ILIKE '%' || $1 || '%')
       ORDER BY fecha_creacion DESC
       LIMIT $2 OFFSET $3`,
      [busqueda ?? null, limite, salto]
    );
    return filas.map(mapearUsuario);
  }

  async actualizar(
    usuarioId: number,
    datos: { nombreCompleto?: string; rol?: string; estaActivo?: boolean }
  ) {
    const filas = await consultar(
      `UPDATE aplicacion.usuario
       SET nombre_completo = COALESCE($2, nombre_completo),
           rol = COALESCE($3, rol),
           esta_activo = COALESCE($4, esta_activo)
       WHERE usuario_id = $1
       RETURNING usuario_id, nombre_completo, correo, rol, esta_activo, fecha_creacion`,
      [usuarioId, datos.nombreCompleto ?? null, datos.rol ?? null, datos.estaActivo ?? null]
    );
    return filas[0] ? mapearUsuario(filas[0]) : null;
  }
}
