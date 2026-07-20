import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft, Crosshair, Goal, Target, TrendingUp } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { pedirApi } from "../api/clienteApi";
import { EscudoEquipo } from "../componentes/EscudoEquipo";
import { CargadorEsqueleto, MensajeError } from "../componentes/Estados";
import { usarEscudosEquipos } from "../hooks/usarEscudosEquipos";
import type { Equipo } from "../tipos/tipos";

interface FormaEquipo {
  promedio_goles_favor_ultimos_5: number;
  promedio_goles_contra_ultimos_5: number;
  promedio_tiros_ultimos_5: number;
  tasa_conversion_ultimos_5: number;
  tasa_puntos_ultimos_5: number;
}

function decimal(valor: number | undefined) {
  return Number(valor ?? 0).toFixed(2);
}

function porcentaje(valor: number | undefined) {
  return `${(Number(valor ?? 0) * 100).toFixed(1)}%`;
}

export default function PaginaDetalleEquipo() {
  const { id } = useParams();
  const equipoId = Number(id);
  const equipo = useQuery({
    queryKey: ["equipo", id],
    queryFn: () => pedirApi<Equipo>(`/equipos/${id}`)
  });
  const forma = useQuery({
    queryKey: ["forma", id],
    queryFn: () => pedirApi<FormaEquipo>(`/equipos/${id}/forma`)
  });
  const { escudos } = usarEscudosEquipos(Number.isInteger(equipoId) ? [equipoId] : []);

  if (equipo.isLoading || forma.isLoading) return <CargadorEsqueleto />;
  if (equipo.error) return <MensajeError texto={(equipo.error as Error).message} />;

  const datosEquipo = equipo.data;
  const datosForma = forma.data;
  if (!datosEquipo) return <MensajeError texto="Equipo no encontrado" />;

  return (
    <div className="pagina pagina-detalle-equipo">
      <Link to="/equipos" className="volver-equipos"><ArrowLeft size={17} /> Volver a equipos</Link>

      <section className="portada-equipo">
        <EscudoEquipo
          nombre={datosEquipo.nombreEquipo}
          url={escudos.get(datosEquipo.equipoId)}
          tamano="grande"
        />
        <div>
          <span>{datosEquipo.pais} · {datosEquipo.liga}</span>
          <h1>{datosEquipo.nombreEquipo}</h1>
          <p>Lectura de los ultimos cinco partidos disponibles en el almacen de datos.</p>
        </div>
        <Link className="boton-prediccion-equipo" to="/predicciones/nueva">
          <Crosshair size={18} /> Usar en prediccion
        </Link>
      </section>

      {forma.error ? (
        <MensajeError texto="Este equipo todavia no tiene historial suficiente." />
      ) : (
        <section className="grilla-forma-equipo">
          <article><Goal size={21} /><span>Goles a favor</span><strong>{decimal(datosForma?.promedio_goles_favor_ultimos_5)}</strong><small>promedio ultimos 5</small></article>
          <article><Activity size={21} /><span>Goles recibidos</span><strong>{decimal(datosForma?.promedio_goles_contra_ultimos_5)}</strong><small>promedio ultimos 5</small></article>
          <article><Target size={21} /><span>Tiros</span><strong>{decimal(datosForma?.promedio_tiros_ultimos_5)}</strong><small>promedio ultimos 5</small></article>
          <article><TrendingUp size={21} /><span>Conversion</span><strong>{porcentaje(datosForma?.tasa_conversion_ultimos_5)}</strong><small>goles sobre tiros</small></article>
          <article><Crosshair size={21} /><span>Rendimiento</span><strong>{porcentaje(datosForma?.tasa_puntos_ultimos_5)}</strong><small>puntos obtenidos</small></article>
        </section>
      )}
    </div>
  );
}
