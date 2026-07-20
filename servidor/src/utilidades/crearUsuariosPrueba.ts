import { cerrarConexion, probarConexion } from "../configuracion/baseDatos.js";
import { RepositorioUsuario } from "../repositorios/RepositorioUsuario.js";
import { cifrarContrasena } from "./seguridad.js";

const usuarios = [
  ["Administrador", "administrador@futbolpredice.local", "ADMINISTRADOR"],
  ["Analista 01", "analista01@futbolpredice.local", "ANALISTA"],
  ["Analista 02", "analista02@futbolpredice.local", "ANALISTA"],
  ["Analista 03", "analista03@futbolpredice.local", "ANALISTA"],
  ["Analista 04", "analista04@futbolpredice.local", "ANALISTA"],
  ["Analista 05", "analista05@futbolpredice.local", "ANALISTA"],
  ["Analista 06", "analista06@futbolpredice.local", "ANALISTA"],
  ["Analista 07", "analista07@futbolpredice.local", "ANALISTA"],
  ["Analista 08", "analista08@futbolpredice.local", "ANALISTA"],
  ["Analista 09", "analista09@futbolpredice.local", "ANALISTA"]
] as const;

async function crearUsuariosPrueba() {
  await probarConexion();
  const repositorio = new RepositorioUsuario();
  const contrasenaHash = await cifrarContrasena("FutbolPredice2026!");

  for (const [nombreCompleto, correo, rol] of usuarios) {
    await repositorio.crearSiNoExiste({
      nombreCompleto,
      correo,
      rol,
      contrasenaHash
    });
  }

  console.log("Diez usuarios de prueba creados o actualizados con hash bcrypt.");
}

crearUsuariosPrueba()
  .catch((error) => {
    console.error("No se pudieron crear los usuarios de prueba:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cerrarConexion().catch(() => undefined);
  });
