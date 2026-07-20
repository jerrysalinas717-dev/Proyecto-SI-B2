const urlBase = "https://www.thesportsdb.com/api/v1/json/123/searchteams.php";
const duracionCacheMilisegundos = 24 * 60 * 60 * 1000;
const tiempoLimiteMilisegundos = 4500;

interface EquipoExterno {
  strTeam?: string;
  strTeamAlternate?: string;
  strSport?: string;
  strBadge?: string;
  strTeamBadge?: string;
}

interface RespuestaEquiposExternos {
  teams?: EquipoExterno[] | null;
}

interface EntradaCache {
  urlEscudo: string | null;
  expiraEn: number;
}

const aliasEquipos: Record<string, string> = {
  "Manchester Utd": "Manchester United",
  "Internazionale": "Inter Milan",
  "Tottenham": "Tottenham Hotspur",
  "Newcastle": "Newcastle United",
  "West Brom": "West Bromwich Albion",
  "Wolves": "Wolverhampton Wanderers",
  "QPR": "Queens Park Rangers",
  "St Etienne": "Saint-Etienne",
  "Paris Saint-Germain": "Paris SG",
  "Hamburg SV": "Hamburger SV",
  "Mainz": "Mainz 05",
  "Nurnberg": "FC Nurnberg",
  "FC Cologne": "FC Koln",
  "Borussia Monchengladbach": "Borussia Monchengladbach",
  "SpVgg Greuther Furth": "Greuther Furth",
  "TSV Eintracht Braunschweig": "Eintracht Braunschweig",
  "US Pescara": "Pescara",
  "Athletic Bilbao": "Athletic Club",
  "Deportivo La Coruna": "Deportivo La Coruna",
  "Real Betis": "Real Betis",
  "Real Sociedad": "Real Sociedad",
  "Sporting Gijon": "Sporting Gijon",
  "Racing Santander": "Racing Santander",
  "Stade Rennes": "Rennes",
  "Stade de Reims": "Reims",
  "Evian Thonon Gaillard": "Evian TG",
  "GFC Ajaccio": "Gazelec Ajaccio"
};

function normalizarComparacion(valor: string | undefined) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

export class ServicioEscudoEquipo {
  private cache = new Map<string, EntradaCache>();

  async buscar(nombreEquipo: string): Promise<string | null> {
    const clave = normalizarComparacion(nombreEquipo);
    const existente = this.cache.get(clave);

    if (existente && existente.expiraEn > Date.now()) {
      return existente.urlEscudo;
    }

    const nombreBusqueda = aliasEquipos[nombreEquipo] ?? nombreEquipo;
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), tiempoLimiteMilisegundos);

    try {
      const respuesta = await fetch(
        `${urlBase}?t=${encodeURIComponent(nombreBusqueda)}`,
        {
          headers: { Accept: "application/json" },
          signal: controlador.signal
        }
      );

      if (!respuesta.ok) {
        this.guardarCache(clave, null);
        return null;
      }

      const cuerpo = (await respuesta.json()) as RespuestaEquiposExternos;
      const candidatos = (cuerpo.teams ?? []).filter(
        (equipo) => String(equipo.strSport ?? "").toLowerCase() === "soccer"
      );

      const nombreNormalizado = normalizarComparacion(nombreBusqueda);
      const seleccionado =
        candidatos.find(
          (equipo) => normalizarComparacion(equipo.strTeam) === nombreNormalizado
        ) ??
        candidatos.find((equipo) =>
          normalizarComparacion(equipo.strTeamAlternate).includes(nombreNormalizado)
        ) ??
        candidatos[0];

      const urlEscudo = seleccionado?.strBadge ?? seleccionado?.strTeamBadge ?? null;
      this.guardarCache(clave, urlEscudo);
      return urlEscudo;
    } catch {
      this.guardarCache(clave, null, 15 * 60 * 1000);
      return null;
    } finally {
      clearTimeout(temporizador);
    }
  }

  private guardarCache(
    clave: string,
    urlEscudo: string | null,
    duracion = duracionCacheMilisegundos
  ) {
    this.cache.set(clave, {
      urlEscudo,
      expiraEn: Date.now() + duracion
    });
  }
}
