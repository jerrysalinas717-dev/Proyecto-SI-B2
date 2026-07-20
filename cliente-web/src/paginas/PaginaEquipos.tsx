import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, Shield, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { pedirApi } from "../api/clienteApi";
import { EscudoEquipo } from "../componentes/EscudoEquipo";
import { CargadorEsqueleto, MensajeError, MensajeVacio } from "../componentes/Estados";
import { usarEscudosEquipos } from "../hooks/usarEscudosEquipos";
import type { Equipo } from "../tipos/tipos";

const limite = 18;

export default function PaginaEquipos() {
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);

  const equipos = useQuery({
    queryKey: ["equipos", pagina, busqueda],
    queryFn: () =>
      pedirApi<Equipo[]>(
        `/equipos?pagina=${pagina}&limite=${limite}&busqueda=${encodeURIComponent(busqueda)}`
      )
  });

  const ids = (equipos.data ?? []).map((equipo) => equipo.equipoId);
  const { escudos } = usarEscudosEquipos(ids);

  if (equipos.isLoading) return <CargadorEsqueleto />;
  if (equipos.error) return <MensajeError texto={(equipos.error as Error).message} />;

  return (
    <div className="pagina pagina-equipos-kalshi">
      <section className="cabecera-mercado">
        <div>
          <span className="etiqueta-mercado"><Sparkles size={15} /> Explorador de equipos</span>
          <h1>Conoce los equipos antes de predecir</h1>
          <p>
            Cada tarjeta resume el equipo, su liga y su pais. Abre un equipo para revisar
            su forma reciente y luego comparalo en el modulo de prediccion.
          </p>
        </div>
        <div className="cabecera-mercado__dato">
          <Shield size={26} />
          <div><strong>{equipos.data?.length ?? 0}</strong><span>equipos en esta pagina</span></div>
        </div>
      </section>

      <section className="barra-filtros-equipos">
        <label className="buscador-equipo">
          <Search size={18} />
          <input
            value={busqueda}
            placeholder="Buscar Manchester, Barcelona, Milan..."
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(1);
            }}
          />
        </label>
        <span>Los escudos se muestran desde una URL externa y no se guardan en el proyecto.</span>
      </section>

      {(equipos.data?.length ?? 0) === 0 ? (
        <MensajeVacio texto="No se encontraron equipos con esa busqueda." />
      ) : (
        <section className="grilla-equipos-mercado">
          {equipos.data?.map((equipo, indice) => (
            <article className="tarjeta-equipo-mercado" key={equipo.equipoId}>
              <div className="tarjeta-equipo-mercado__superior">
                <EscudoEquipo
                  nombre={equipo.nombreEquipo}
                  url={escudos.get(equipo.equipoId)}
                  tamano="grande"
                />
                <span className={`pulso-equipo pulso-equipo--${(indice % 4) + 1}`}>Disponible</span>
              </div>
              <div className="tarjeta-equipo-mercado__texto">
                <h2>{equipo.nombreEquipo}</h2>
                <p>{equipo.liga}</p>
                <span>{equipo.pais}</span>
              </div>
              <Link to={`/equipos/${equipo.equipoId}`} className="enlace-mercado">
                Ver analisis <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </section>
      )}

      <div className="paginacion-equipos">
        <button disabled={pagina === 1} onClick={() => setPagina((actual) => actual - 1)}>
          Anterior
        </button>
        <strong>Pagina {pagina}</strong>
        <button
          disabled={(equipos.data?.length ?? 0) < limite}
          onClick={() => setPagina((actual) => actual + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
