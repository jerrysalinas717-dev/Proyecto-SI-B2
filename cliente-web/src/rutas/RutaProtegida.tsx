import { Navigate, Outlet } from "react-router-dom";
import { usarSesion } from "../contextos/ContextoSesion";
import { CargadorEsqueleto } from "../componentes/Estados";

export function RutaProtegida(){ const {usuario,cargando}=usarSesion(); if(cargando) return <CargadorEsqueleto/>; return usuario ? <Outlet/> : <Navigate to="/iniciar-sesion" replace/>; }
