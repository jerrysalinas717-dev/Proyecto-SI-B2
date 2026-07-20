import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { configuracion } from "../configuracion/configuracion.js";
import type { UsuarioSeguro } from "../tipos/tipos.js";

export async function cifrarContrasena(contrasena:string): Promise<string> { return bcrypt.hash(contrasena, 12); }
export async function verificarContrasena(contrasena:string, hash:string): Promise<boolean> { return bcrypt.compare(contrasena, hash); }
export function generarToken(usuario:UsuarioSeguro): string { return jwt.sign({ usuarioId:usuario.usuarioId, rol:usuario.rol, correo:usuario.correo }, configuracion.JWT_SECRETO, { expiresIn: configuracion.JWT_DURACION as any }); }
export function verificarToken(token:string): { usuarioId:number; rol:string; correo:string } { return jwt.verify(token, configuracion.JWT_SECRETO) as { usuarioId:number; rol:string; correo:string }; }
