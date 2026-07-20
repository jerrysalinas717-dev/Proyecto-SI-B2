import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { DisenoPrincipal } from "./disenos/DisenoPrincipal";
import { RutaProtegida } from "./rutas/RutaProtegida";
import { CargadorEsqueleto } from "./componentes/Estados";

const PaginaIniciarSesion = lazy(() => import("./paginas/PaginaIniciarSesion"));
const PaginaRegistro = lazy(() => import("./paginas/PaginaRegistro"));
const PaginaTablero = lazy(() => import("./paginas/PaginaTablero"));
const PaginaNuevaPrediccion = lazy(() => import("./paginas/PaginaNuevaPrediccion"));
const PaginaHistorialPredicciones = lazy(() => import("./paginas/PaginaHistorialPredicciones"));
const PaginaEquipos = lazy(() => import("./paginas/PaginaEquipos"));
const PaginaDetalleEquipo = lazy(() => import("./paginas/PaginaDetalleEquipo"));
const PaginaEventos = lazy(() => import("./paginas/PaginaEventos"));
const PaginaUsuarios = lazy(() => import("./paginas/PaginaUsuarios"));
const PaginaConfiguracion = lazy(() => import("./paginas/PaginaConfiguracion"));
const PaginaNoEncontrada = lazy(() => import("./paginas/PaginaNoEncontrada"));

export function Aplicacion(){ return <Suspense fallback={<CargadorEsqueleto/>}><Routes><Route path="/iniciar-sesion" element={<PaginaIniciarSesion/>}/><Route path="/registrarse" element={<PaginaRegistro/>}/><Route element={<RutaProtegida/>}><Route element={<DisenoPrincipal/>}><Route index element={<Navigate to="/tablero"/>}/><Route path="/tablero" element={<PaginaTablero/>}/><Route path="/predicciones/nueva" element={<PaginaNuevaPrediccion/>}/><Route path="/predicciones/historial" element={<PaginaHistorialPredicciones/>}/><Route path="/equipos" element={<PaginaEquipos/>}/><Route path="/equipos/:id" element={<PaginaDetalleEquipo/>}/><Route path="/eventos" element={<PaginaEventos/>}/><Route path="/usuarios" element={<PaginaUsuarios/>}/><Route path="/configuracion" element={<PaginaConfiguracion/>}/></Route></Route><Route path="*" element={<PaginaNoEncontrada/>}/></Routes></Suspense>; }
