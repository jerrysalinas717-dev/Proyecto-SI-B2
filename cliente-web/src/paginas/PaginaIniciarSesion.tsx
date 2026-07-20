import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { usarSesion } from "../contextos/ContextoSesion";

interface FormularioInicioSesion {
  correo: string;
  contrasena: string;
}

export default function PaginaIniciarSesion() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormularioInicioSesion>({
    defaultValues: {
      correo: "analista01@futbolpredice.local",
      contrasena: "FutbolPredice2026!"
    }
  });
  const [mensajeError, setMensajeError] = useState("");
  const sesion = usarSesion();
  const navegar = useNavigate();

  async function enviar(datos: FormularioInicioSesion) {
    setMensajeError("");
    try {
      await sesion.iniciarSesion(datos.correo, datos.contrasena);
      navegar("/tablero", { replace: true });
    } catch (error) {
      setMensajeError(error instanceof Error ? error.message : "No se pudo iniciar sesion");
    }
  }

  return (
    <main className="acceso">
      <form onSubmit={handleSubmit(enviar)}>
        <h1>Futbol Predice BI</h1>
        <p>Ingresa para explorar rendimiento y predicciones.</p>

        <label>
          Correo
          <input
            type="email"
            autoComplete="email"
            {...register("correo", {
              required: "El correo es obligatorio",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Correo no valido" }
            })}
          />
        </label>
        {errors.correo && <small className="texto-error">{errors.correo.message}</small>}

        <label>
          Contrasena
          <input
            type="password"
            autoComplete="current-password"
            {...register("contrasena", {
              required: "La contrasena es obligatoria",
              minLength: { value: 8, message: "Minimo 8 caracteres" }
            })}
          />
        </label>
        {errors.contrasena && (
          <small className="texto-error">{errors.contrasena.message}</small>
        )}

        {mensajeError && <div className="alerta-error">{mensajeError}</div>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Ingresando..." : "Iniciar sesion"}
        </button>
        <Link className="enlace-acceso" to="/registrarse">
          Crear una cuenta de analista
        </Link>
      </form>
    </main>
  );
}
