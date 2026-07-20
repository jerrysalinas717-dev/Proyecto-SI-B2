import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanoEntorno = z
  .string()
  .optional()
  .transform((valor) => valor === "true");

const esquemaConfiguracion = z.object({
  ENTORNO: z.string().default("desarrollo"),
  PUERTO: z.coerce.number().int().positive().default(3001),
  BD_SERVIDOR: z.string().min(1).default("localhost"),
  BD_PUERTO: z.coerce.number().int().positive().default(5432),
  BD_NOMBRE: z.string().min(1).default("futbol_predice_bi"),
  BD_USUARIO: z.string().min(1).default("postgres"),
  BD_CONTRASENA: z.string().min(1).default("CAMBIAR"),
  BD_CIFRAR: booleanoEntorno.default("false"),
  BD_CONFIAR_CERTIFICADO: booleanoEntorno.default("true"),
  JWT_SECRETO: z.string().min(24).default("CAMBIAR_POR_UN_SECRETO_LARGO_Y_SEGURO"),
  JWT_DURACION: z.string().default("8h"),
  SERVICIO_PREDICCION_URL: z.string().url().default("http://localhost:8000"),
  ORIGEN_PERMITIDO: z.string().default("http://localhost:5173,http://127.0.0.1:5173")
});

export const configuracion = esquemaConfiguracion.parse(process.env);
export const origenesPermitidos = configuracion.ORIGEN_PERMITIDO.split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);
