import { aplicacion } from "./aplicacion.js";
import { cerrarConexion, probarConexion } from "./configuracion/baseDatos.js";
import { configuracion } from "./configuracion/configuracion.js";

async function iniciarServidor(): Promise<void> {
  try {
    await probarConexion();
    console.log("PostgreSQL conectado correctamente.");

    const servidor = aplicacion.listen(configuracion.PUERTO, () => {
      console.log(
        `Servidor Futbol Predice BI activo en http://localhost:${configuracion.PUERTO}`
      );
    });

    const cerrar = async (senal: string) => {
      console.log(`\nCerrando servidor por ${senal}...`);
      servidor.close(async () => {
        await cerrarConexion().catch(() => undefined);
        process.exit(0);
      });
    };

    process.once("SIGINT", () => void cerrar("SIGINT"));
    process.once("SIGTERM", () => void cerrar("SIGTERM"));
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error("No se pudo conectar con PostgreSQL.");
    console.error(
      `Verifica servidor=${configuracion.BD_SERVIDOR}, puerto=${configuracion.BD_PUERTO}, base=${configuracion.BD_NOMBRE} y usuario=${configuracion.BD_USUARIO}.`
    );
    console.error(`Detalle: ${mensaje}`);
    process.exit(1);
  }
}

void iniciarServidor();
