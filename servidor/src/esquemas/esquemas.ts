import { z } from "zod";

const correo = z.string().trim().toLowerCase().email("Correo no valido");
const rol = z.enum(["ADMINISTRADOR", "ANALISTA"]);

export const esquemaRegistro = z.object({
  nombreCompleto: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres"),
  correo,
  contrasena: z.string().min(8, "La contrasena debe tener al menos 8 caracteres")
});

export const esquemaInicioSesion = z.object({
  correo,
  contrasena: z.string().min(8, "La contrasena debe tener al menos 8 caracteres")
});

export const esquemaCrearUsuario = z.object({
  nombreCompleto: z.string().trim().min(3),
  correo,
  contrasena: z.string().min(8),
  rol: rol.default("ANALISTA")
});

export const esquemaActualizarUsuario = z
  .object({
    nombreCompleto: z.string().trim().min(3).optional(),
    rol: rol.optional(),
    estaActivo: z.boolean().optional()
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debes enviar al menos un campo para actualizar"
  });

export const esquemaPrediccion = z
  .object({
    equipoLocalId: z.coerce.number().int().positive(),
    equipoVisitanteId: z.coerce.number().int().positive()
  })
  .refine((valor) => valor.equipoLocalId !== valor.equipoVisitanteId, {
    message: "Los equipos deben ser diferentes"
  });

export const esquemaPaginacion = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  busqueda: z.string().trim().optional(),
  liga: z.string().trim().optional(),
  pais: z.string().trim().optional(),
  temporada: z.coerce.number().int().optional()
});
