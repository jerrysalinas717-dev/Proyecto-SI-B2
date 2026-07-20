import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { pedirApi } from "../api/clienteApi";
import { CargadorEsqueleto, MensajeError, MensajeVacio } from "../componentes/Estados";
import type { Equipo } from "../tipos/tipos";

interface PrediccionCreada {
  prediccionId: number;
  probabilidadLocal: number;
  probabilidadEmpate: number;
  probabilidadVisitante: number;
  resultadoPredicho: string;
  nivelConfianza: string;
  fechaCreacion: string;
}

function porcentaje(valor: number) {
  return `${(Number(valor) * 100).toFixed(1)}%`;
}

export default function PaginaNuevaPrediccion() {
  const [local, setLocal] = useState(0);
  const [visitante, setVisitante] = useState(0);
  const clienteConsulta = useQueryClient();

  const equipos = useQuery({
    queryKey: ["equipos", "prediccion"],
    queryFn: () => pedirApi<Equipo[]>("/equipos?limite=100")
  });

  const mutacion = useMutation({
    mutationFn: () =>
      pedirApi<PrediccionCreada>("/predicciones", {
        method: "POST",
        body: JSON.stringify({ equipoLocalId: local, equipoVisitanteId: visitante })
      }),
    onSuccess: () => {
      void clienteConsulta.invalidateQueries({ queryKey: ["predicciones"] });
      void clienteConsulta.invalidateQueries({ queryKey: ["tablero", "resumen"] });
    }
  });

  if (equipos.isLoading) return <CargadorEsqueleto />;
  if (equipos.error) return <MensajeError texto={(equipos.error as Error).message} />;
  if (!equipos.data?.length) {
    return <MensajeVacio texto="Primero ejecuta el ETL para cargar equipos en PostgreSQL." />;
  }

  const equiposDisponibles = equipos.data;

  return (
    <div className="pagina">
      <h1>Nueva prediccion</h1>
      <p>Selecciona equipos diferentes. La prediccion se guarda automaticamente.</p>

      <div className="panel">
        <label>
          Equipo local
          <select value={local} onChange={(evento) => setLocal(Number(evento.target.value))}>
            <option value={0}>Seleccionar equipo local</option>
            {equiposDisponibles.map((equipo) => (
              <option value={equipo.equipoId} key={equipo.equipoId}>
                {equipo.nombreEquipo}
              </option>
            ))}
          </select>
        </label>

        <label>
          Equipo visitante
          <select
            value={visitante}
            onChange={(evento) => setVisitante(Number(evento.target.value))}
          >
            <option value={0}>Seleccionar equipo visitante</option>
            {equiposDisponibles.map((equipo) => (
              <option value={equipo.equipoId} key={equipo.equipoId}>
                {equipo.nombreEquipo}
              </option>
            ))}
          </select>
        </label>

        <button
          disabled={!local || !visitante || local === visitante || mutacion.isPending}
          onClick={() => mutacion.mutate()}
        >
          {mutacion.isPending ? "Calculando..." : "Predecir"}
        </button>
      </div>

      {local > 0 && local === visitante && (
        <p className="texto-error">Los equipos deben ser diferentes.</p>
      )}

      {mutacion.data && (
        <section className="resultado">
          <h2>{mutacion.data.resultadoPredicho.replaceAll("_", " ")}</h2>
          <div className="probabilidades">
            <div><span>Victoria local</span><strong>{porcentaje(mutacion.data.probabilidadLocal)}</strong></div>
            <div><span>Empate</span><strong>{porcentaje(mutacion.data.probabilidadEmpate)}</strong></div>
            <div><span>Victoria visitante</span><strong>{porcentaje(mutacion.data.probabilidadVisitante)}</strong></div>
          </div>
          <strong>Confianza {mutacion.data.nivelConfianza}</strong>
          <small>Estimacion basada en datos historicos procesados. No representa una certeza.</small>
        </section>
      )}

      {mutacion.error && <MensajeError texto={(mutacion.error as Error).message} />}
    </div>
  );
}
