import {
  BarChart3,
  CalendarClock,
  Goal,
  LogOut,
  Settings,
  Shield,
  Users
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { usarSesion } from "../contextos/ContextoSesion";

const enlacesComunes = [
  ["/tablero", "Tablero", BarChart3],
  ["/predicciones/nueva", "Nueva prediccion", Goal],
  ["/predicciones/historial", "Historial", CalendarClock],
  ["/equipos", "Equipos", Shield],
  ["/eventos", "Eventos", BarChart3],
  ["/configuracion", "Configuracion", Settings]
] as const;

export function DisenoPrincipal() {
  const { usuario, cerrarSesion } = usarSesion();
  const enlaces =
    usuario?.rol === "ADMINISTRADOR"
      ? [...enlacesComunes.slice(0, 5), ["/usuarios", "Usuarios", Users] as const, enlacesComunes[5]]
      : enlacesComunes;

  return (
    <div className="marco">
      <aside className="barra">
        <div className="marca">Futbol Predice BI</div>
        <nav>
          {enlaces.map(([ruta, texto, Icono]) => (
            <NavLink key={ruta} to={ruta}>
              <Icono size={18} />
              <span>{texto}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="contenido">
        <header className="encabezado">
          <div>
            <strong>{usuario?.nombreCompleto}</strong>
            <span>{usuario?.rol}</span>
          </div>
          <button onClick={cerrarSesion} title="Cerrar sesion">
            <LogOut size={18} /> Cerrar sesion
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
