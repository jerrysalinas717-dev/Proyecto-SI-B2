import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { pedirApi } from "../api/clienteApi";
import { usarSesion } from "../contextos/ContextoSesion";

interface FormularioRegistro {
  nombreCompleto: string;
  correo: string;
  contrasena: string;
}

export default function PaginaRegistro() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormularioRegistro>();
  const [mensajeError, setMensajeError] = useState("");
  const navegar = useNavigate();
  const sesion = usarSesion();

  async function enviar(datos: FormularioRegistro) {
    setMensajeError("");
    try {
      await pedirApi("/autenticacion/registrar", {
        method: "POST",
        body: JSON.stringify(datos)
      });
      await sesion.iniciarSesion(datos.correo, datos.contrasena);
      navegar("/tablero", { replace: true });
    } catch (error) {
      setMensajeError(error instanceof Error ? error.message : "No se pudo crear la cuenta");
    }
  }

  return (
    <main className="acceso">
      <form onSubmit={handleSubmit(enviar)}>
        <h1>Crear cuenta</h1>
        <label>
          Nombre completo
          <input {...register("nombreCompleto", { required: true, minLength: 3 })} />
        </label>
        {errors.nombreCompleto && <small className="texto-error">Nombre no valido</small>}

        <label>
          Correo
          <input type="email" {...register("correo", { required: true })} />
        </label>
        {errors.correo && <small className="texto-error">Correo obligatorio</small>}

        <label>
          Contrasena
          <input
            type="password"
            {...register("contrasena", { required: true, minLength: 8 })}
          />
        </label>
        {errors.contrasena && <small className="texto-error">Minimo 8 caracteres</small>}

        {mensajeError && <div className="alerta-error">{mensajeError}</div>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear cuenta"}
        </button>
        <Link className="enlace-acceso" to="/iniciar-sesion">
          Volver al inicio de sesion
        </Link>
      </form>
    </main>
  );
}
