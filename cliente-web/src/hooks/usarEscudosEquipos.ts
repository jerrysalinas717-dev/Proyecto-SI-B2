import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { pedirApi } from "../api/clienteApi";

interface EscudoEquipoApi {
  equipoId: number;
  nombreEquipo: string;
  urlEscudo: string | null;
}

export function usarEscudosEquipos(equipoIds: number[]) {
  const idsNormalizados = useMemo(
    () => [...new Set(equipoIds.filter((id) => Number.isInteger(id) && id > 0))].slice(0, 20),
    [equipoIds]
  );
  const claveIds = idsNormalizados.join(",");

  const consulta = useQuery({
    queryKey: ["escudos-equipos", claveIds],
    queryFn: () =>
      pedirApi<EscudoEquipoApi[]>(`/equipos/escudos?ids=${encodeURIComponent(claveIds)}`),
    enabled: idsNormalizados.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1
  });

  const escudos = useMemo(
    () => new Map((consulta.data ?? []).map((item) => [item.equipoId, item.urlEscudo])),
    [consulta.data]
  );

  return { ...consulta, escudos };
}
