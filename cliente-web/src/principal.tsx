import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Aplicacion } from "./Aplicacion";
import { ProveedorSesion } from "./contextos/ContextoSesion";
import "./recursos/estilos.css";

const clienteConsulta = new QueryClient({ defaultOptions:{ queries:{ retry:1, staleTime:60000 } } });
ReactDOM.createRoot(document.getElementById("raiz")!).render(<React.StrictMode><QueryClientProvider client={clienteConsulta}><BrowserRouter><ProveedorSesion><Aplicacion/></ProveedorSesion></BrowserRouter></QueryClientProvider></React.StrictMode>);
