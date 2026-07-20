import { createRequire } from "node:module";

const requireDesdeServidor = createRequire(new URL("../../../servidor/package.json", import.meta.url));
const { z } = requireDesdeServidor("zod");

export const esquemaSolicitudPrediccion = z.object({
  equipo_local_id: z.number().int().positive(),
  equipo_visitante_id: z.number().int().positive(),
  caracteristicas: z.record(z.number())
});

