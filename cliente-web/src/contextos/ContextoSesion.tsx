import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  borrarSesion,
  guardarToken,
  obtenerToken,
  pedirApi
} from "../api/clienteApi";
import type { UsuarioSesion } from "../tipos/tipos";

interface ValorContextoSesion {
  usuario: UsuarioSesion | null;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => void;
  cargando: boolean;
}

const Contexto = createContext<ValorContextoSesion | null>(null);

export function ProveedorSesion({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!obtenerToken()) {
      setCargando(false);
      return;
    }

    pedirApi<UsuarioSesion>("/autenticacion/perfil")
      .then(setUsuario)
      .catch(() => borrarSesion())
      .finally(() => setCargando(false));
  }, []);

  async function iniciarSesion(correo: string, contrasena: string) {
    const datos = await pedirApi<{ usuario: UsuarioSesion; token: string }>(
      "/autenticacion/iniciar-sesion",
      {
        method: "POST",
        body: JSON.stringify({ correo, contrasena })
      }
    );
    guardarToken(datos.token);
    setUsuario(datos.usuario);
  }

  function cerrarSesion() {
    borrarSesion();
    setUsuario(null);
  }

  const valor = useMemo(
    () => ({ usuario, iniciarSesion, cerrarSesion, cargando }),
    [usuario, cargando]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usarSesion() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("Sesion no disponible");
  return contexto;
}
