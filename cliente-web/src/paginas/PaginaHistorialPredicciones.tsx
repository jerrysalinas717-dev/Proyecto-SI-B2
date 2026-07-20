import { useQuery } from "@tanstack/react-query";
import { pedirApi } from "../api/clienteApi";
import { CargadorEsqueleto, MensajeError, MensajeVacio } from "../componentes/Estados";

interface PrediccionHistorial {
  prediccionId: number;
  equipoLocal: string;
  equipoVisitante: string;
  resultadoPredicho: string;
  nivelConfianza: string;
  probabilidadLocal: number;
  probabilidadEmpate: number;
  probabilidadVisitante: number;
  fechaCreacion: string;
}

export default function PaginaHistorialPredicciones() {
  const consulta = useQuery({
    queryKey: ["predicciones"],
    queryFn: () => pedirApi<PrediccionHistorial[]>("/predicciones?limite=50")
  });

  if (consulta.isLoading) return <CargadorEsqueleto />;
  if (consulta.error) return <MensajeError texto={(consulta.error as Error).message} />;
  if (!consulta.data?.length) return <MensajeVacio texto="No hay predicciones guardadas" />;

  return (
    <div className="pagina">
      <h1>Historial de predicciones</h1>
      <div className="lista">
        {consulta.data.map((prediccion) => (
          <article className="fila" key={prediccion.prediccionId}>
            <div>
              <strong>{prediccion.equipoLocal} vs {prediccion.equipoVisitante}</strong>
              <small>{new Date(prediccion.fechaCreacion).toLocaleString()}</small>
            </div>
            <span>
              {prediccion.resultadoPredicho.replaceAll("_", " ")} · {prediccion.nivelConfianza}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}
