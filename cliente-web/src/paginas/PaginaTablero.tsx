import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Crosshair,
  Goal,
  Info,
  Medal,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { pedirApi } from "../api/clienteApi";
import { EscudoEquipo } from "../componentes/EscudoEquipo";
import { CargadorEsqueleto, MensajeError, MensajeVacio } from "../componentes/Estados";
import { usarEscudosEquipos } from "../hooks/usarEscudosEquipos";

interface AnioDisponible { anio: number; }
interface ResumenTablero {
  partidos_analizados: number;
  goles_registrados: number;
  eventos_procesados: number;
  promedio_goles: number;
  equipo_mejor_rendimiento: string | null;
  puntos_equipo_lider: number | null;
  equipo_mejor_ataque: string | null;
  goles_mejor_ataque: number | null;
  predicciones_realizadas: number;
  exactitud_modelo: number | null;
}
interface EquipoClasificacion {
  equipo_id: number;
  nombre_equipo: string;
  pais: string;
  liga: string;
  partidos: number;
  goles_favor: number;
  goles_contra: number;
  puntos: number;
  victorias: number;
}
interface TendenciaAnual { anio: number; partidos: number; total_goles: number; promedio_goles: number; }
interface ResultadoPartido { resultado: string; total: number; }
interface EventoFrecuente { nombre_evento: string; total: number; }
interface TarjetaMetricaProps {
  titulo: string;
  valor: ReactNode;
  detalle: string;
  icono: ReactNode;
  variante: "verde" | "azul" | "morado" | "naranja" | "rosa" | "celeste";
}

const coloresBarras = ["#00a96b", "#2563eb", "#7c3aed", "#f97316", "#e11d48", "#0891b2", "#ca8a04", "#4f46e5", "#c026d3", "#16a34a"];
const coloresResultados = ["#00a96b", "#f59e0b", "#2563eb"];

function numero(valor: number | null | undefined) {
  return Number(valor ?? 0).toLocaleString("es-EC");
}
function decimal(valor: number | null | undefined) {
  return Number(valor ?? 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function porcentaje(valor: number | null | undefined) {
  if (typeof valor !== "number") return "Sin entrenar";
  return `${(valor * 100).toFixed(1)}%`;
}
function textoCapitalizado(texto: string) {
  if (!texto) return "Sin dato";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function TarjetaMetrica({ titulo, valor, detalle, icono, variante }: TarjetaMetricaProps) {
  return (
    <article className={`tarjeta-metrica tarjeta-metrica--${variante}`}>
      <div className="tarjeta-metrica__encabezado"><span>{titulo}</span><div className="tarjeta-metrica__icono">{icono}</div></div>
      <strong>{valor}</strong>
      <small>{detalle}</small>
    </article>
  );
}

export default function PaginaTablero() {
  const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(null);

  const anios = useQuery({ queryKey: ["tablero", "anios"], queryFn: () => pedirApi<AnioDisponible[]>("/tablero/anios") });
  useEffect(() => {
    if (anioSeleccionado === null && anios.data?.length) setAnioSeleccionado(anios.data[0].anio);
  }, [anioSeleccionado, anios.data]);

  const resumen = useQuery({
    queryKey: ["tablero", "resumen", anioSeleccionado],
    queryFn: () => pedirApi<ResumenTablero>(`/tablero/resumen?anio=${anioSeleccionado}`),
    enabled: anioSeleccionado !== null
  });
  const mejores = useQuery({
    queryKey: ["tablero", "mejores", anioSeleccionado],
    queryFn: () => pedirApi<EquipoClasificacion[]>(`/tablero/mejores-equipos?anio=${anioSeleccionado}`),
    enabled: anioSeleccionado !== null
  });
  const tendencia = useQuery({ queryKey: ["tablero", "tendencia"], queryFn: () => pedirApi<TendenciaAnual[]>("/tablero/tendencia-goles") });
  const resultados = useQuery({
    queryKey: ["tablero", "resultados", anioSeleccionado],
    queryFn: () => pedirApi<ResultadoPartido[]>(`/tablero/distribucion-resultados?anio=${anioSeleccionado}`),
    enabled: anioSeleccionado !== null
  });
  const eventos = useQuery({
    queryKey: ["tablero", "eventos", anioSeleccionado],
    queryFn: () => pedirApi<EventoFrecuente[]>(`/tablero/distribucion-eventos?anio=${anioSeleccionado}`),
    enabled: anioSeleccionado !== null
  });

  const equipos = mejores.data ?? [];
  const { escudos } = usarEscudosEquipos(equipos.map((equipo) => equipo.equipo_id));
  const lider = equipos[0];
  const puntosLider = Math.max(lider?.puntos ?? 0, 1);
  const totalResultados = useMemo(
    () => (resultados.data ?? []).reduce((acumulado, item) => acumulado + item.total, 0),
    [resultados.data]
  );

  const estaCargando = anios.isLoading || resumen.isLoading || mejores.isLoading || tendencia.isLoading || resultados.isLoading || eventos.isLoading;
  const error = anios.error || resumen.error || mejores.error || tendencia.error || resultados.error || eventos.error;

  if (estaCargando && !resumen.data) return <CargadorEsqueleto />;
  if (error) return <MensajeError texto={(error as Error).message} />;
  if (!anios.data?.length) return <MensajeVacio texto="No existen anos cargados. Ejecuta npm.cmd run etl:muestra y vuelve a abrir el tablero." />;

  return (
    <div className="pagina pagina-tablero pagina-tablero-kalshi">
      <section className="portada-mercado-futbol">
        <div className="portada-mercado-futbol__contenido">
          <span className="etiqueta-mercado"><Sparkles size={15} /> Futbol, datos y prediccion</span>
          <h1>¿Quien domino la temporada y que dicen los datos?</h1>
          <p>
            Explora el rendimiento de cada ano como un mercado de informacion: equipos ordenados,
            indicadores faciles de leer y acceso directo al modelo que predice victoria, empate o derrota.
          </p>
          <div className="acciones-portada">
            <Link className="boton-principal" to="/predicciones/nueva">Crear prediccion <ArrowRight size={18} /></Link>
            <span className="nota-datos"><ShieldCheck size={17} /> ETL + PostgreSQL + modelo predictivo</span>
          </div>
        </div>
        <div className="tarjeta-pregunta-mercado">
          <span>Pregunta del periodo</span>
          <strong>¿Que equipo fue el mas fuerte en {anioSeleccionado}?</strong>
          <div><Trophy size={22} /><b>{lider?.nombre_equipo ?? "Sin datos"}</b></div>
          <small>{numero(lider?.puntos)} puntos historicos</small>
        </div>
      </section>

      <section className="selector-periodos-kalshi">
        <div><CalendarDays size={18} /><strong>Cambiar ano</strong><span>Todo el tablero se actualiza al instante.</span></div>
        <div className="lista-anios-kalshi">
          {anios.data.map((item) => (
            <button
              className={item.anio === anioSeleccionado ? "activo" : ""}
              key={item.anio}
              onClick={() => setAnioSeleccionado(item.anio)}
            >{item.anio}</button>
          ))}
        </div>
      </section>

      <section className="mercados-destacados">
        <div className="titulo-seccion-kalshi">
          <div><span>LECTURA RAPIDA</span><h2>Equipos que dominaron {anioSeleccionado}</h2></div>
          <p>El porcentaje es un indice relativo al lider del ano; no es una probabilidad del modelo.</p>
        </div>
        <div className="grilla-mercados-equipo">
          {equipos.slice(0, 3).map((equipo, indice) => {
            const indiceDominio = (equipo.puntos / puntosLider) * 100;
            return (
              <Link className={`mercado-equipo mercado-equipo--${indice + 1}`} to={`/equipos/${equipo.equipo_id}`} key={equipo.equipo_id}>
                <div className="mercado-equipo__encabezado">
                  <EscudoEquipo nombre={equipo.nombre_equipo} url={escudos.get(equipo.equipo_id)} tamano="grande" />
                  <span>#{indice + 1}</span>
                </div>
                <h3>{equipo.nombre_equipo}</h3>
                <p>{equipo.liga} · {textoCapitalizado(equipo.pais)}</p>
                <div className="mercado-equipo__valor"><strong>{indiceDominio.toFixed(0)}%</strong><span>indice de dominio</span></div>
                <div className="mercado-equipo__barra"><span style={{ width: `${indiceDominio}%` }} /></div>
                <footer><span>{equipo.puntos} pts</span><span>{equipo.victorias} victorias</span><ArrowRight size={17} /></footer>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grilla-metricas">
        <TarjetaMetrica titulo="Partidos analizados" valor={numero(resumen.data?.partidos_analizados)} detalle={`Partidos de ${anioSeleccionado}`} icono={<BarChart3 size={21} />} variante="azul" />
        <TarjetaMetrica titulo="Goles registrados" valor={numero(resumen.data?.goles_registrados)} detalle={`${decimal(resumen.data?.promedio_goles)} por partido`} icono={<Goal size={21} />} variante="verde" />
        <TarjetaMetrica titulo="Mejor ataque" valor={resumen.data?.equipo_mejor_ataque ?? "Sin datos"} detalle={`${numero(resumen.data?.goles_mejor_ataque)} goles`} icono={<Target size={21} />} variante="naranja" />
        <TarjetaMetrica titulo="Eventos procesados" valor={numero(resumen.data?.eventos_procesados)} detalle="Tiros, faltas, goles y mas" icono={<Activity size={21} />} variante="celeste" />
        <TarjetaMetrica titulo="Exactitud del modelo" valor={porcentaje(resumen.data?.exactitud_modelo)} detalle="Evaluacion con datos historicos" icono={<Crosshair size={21} />} variante="morado" />
        <TarjetaMetrica titulo="Predicciones guardadas" valor={numero(resumen.data?.predicciones_realizadas)} detalle="Historial de los usuarios" icono={<TrendingUp size={21} />} variante="rosa" />
      </section>

      <section className="panel-kalshi panel-ranking-kalshi">
        <div className="encabezado-panel-kalshi">
          <div><span>RANKING INTERACTIVO</span><h2>Top 10 equipos de {anioSeleccionado}</h2><p>3 puntos por victoria, 1 por empate y 0 por derrota. Pasa el cursor sobre las barras.</p></div>
          <div className="insignia-lider-kalshi"><Medal size={20} /><div><span>Lider</span><strong>{lider?.nombre_equipo ?? "Sin datos"}</strong></div></div>
        </div>
        <div className="grafico-alto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={equipos} layout="vertical" margin={{ top: 8, right: 58, left: 18, bottom: 8 }}>
              <CartesianGrid stroke="#e7e8e4" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#70736c", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="nombre_equipo" type="category" width={150} tick={{ fill: "#171a17", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(0,169,107,.06)" }} contentStyle={{ background: "#ffffff", border: "1px solid #dfe3dc", borderRadius: 12, color: "#111411" }} formatter={(valor, _nombre, propiedades) => { const equipo = propiedades.payload as EquipoClasificacion; return [`${numero(Number(valor))} puntos · ${equipo.victorias} victorias · ${equipo.goles_favor} goles`, "Rendimiento"]; }} />
              <Bar dataKey="puntos" radius={[0, 10, 10, 0]} barSize={25}>
                {equipos.map((equipo, indice) => <Cell key={equipo.equipo_id} fill={coloresBarras[indice % coloresBarras.length]} />)}
                <LabelList dataKey="puntos" position="right" fill="#171a17" fontSize={12} fontWeight={800} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grilla-analisis-kalshi">
        <article className="panel-kalshi">
          <div className="encabezado-panel-kalshi"><div><span>TENDENCIA HISTORICA</span><h2>Promedio de goles por ano</h2><p>Ayuda a reconocer periodos mas ofensivos.</p></div></div>
          <div className="grafico-mediano">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendencia.data ?? []} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <defs><linearGradient id="rellenoGolesKalshi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00a96b" stopOpacity={0.35} /><stop offset="95%" stopColor="#00a96b" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid stroke="#e7e8e4" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="anio" tick={{ fill: "#70736c", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#70736c", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, "auto"]} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #dfe3dc", borderRadius: 12, color: "#111" }} formatter={(valor) => [decimal(Number(valor)), "Promedio de goles"]} />
                <Area type="monotone" dataKey="promedio_goles" stroke="#00a96b" strokeWidth={3} fill="url(#rellenoGolesKalshi)" activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel-kalshi">
          <div className="encabezado-panel-kalshi"><div><span>RESULTADOS DEL PERIODO</span><h2>¿Local, empate o visitante?</h2><p>Distribucion de los {numero(totalResultados)} partidos de {anioSeleccionado}.</p></div></div>
          <div className="grafico-mediano grafico-circular">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resultados.data ?? []} dataKey="total" nameKey="resultado" innerRadius={58} outerRadius={88} paddingAngle={4}>
                  {(resultados.data ?? []).map((item, indice) => <Cell key={item.resultado} fill={coloresResultados[indice % coloresResultados.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #dfe3dc", borderRadius: 12, color: "#111" }} formatter={(valor) => { const total = Number(valor); const proporcion = totalResultados > 0 ? total / totalResultados * 100 : 0; return [`${numero(total)} partidos (${proporcion.toFixed(1)}%)`, "Total"]; }} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="centro-circular"><strong>{numero(totalResultados)}</strong><span>partidos</span></div>
          </div>
        </article>
      </section>

      <section className="grilla-detalle-kalshi">
        <article className="panel-kalshi">
          <div className="encabezado-panel-kalshi"><div><span>DETALLE DEL TOP 5</span><h2>Por que estan arriba</h2><p>Puntos, victorias y goles explican el rendimiento.</p></div></div>
          <div className="tabla-contenedor">
            <table className="tabla-ranking-kalshi">
              <thead><tr><th>Pos.</th><th>Equipo</th><th>Partidos</th><th>Victorias</th><th>Goles</th><th>Puntos</th></tr></thead>
              <tbody>
                {equipos.slice(0, 5).map((equipo, indice) => (
                  <tr key={equipo.equipo_id}>
                    <td><span className={`posicion posicion--${indice + 1}`}>{indice + 1}</span></td>
                    <td><div className="equipo-tabla"><EscudoEquipo nombre={equipo.nombre_equipo} url={escudos.get(equipo.equipo_id)} tamano="pequeno" /><div><strong>{equipo.nombre_equipo}</strong><small>{textoCapitalizado(equipo.pais)} · {equipo.liga}</small></div></div></td>
                    <td>{equipo.partidos}</td><td>{equipo.victorias}</td><td>{equipo.goles_favor}</td><td><strong>{equipo.puntos}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel-kalshi">
          <div className="encabezado-panel-kalshi"><div><span>QUE HAY EN LOS DATOS</span><h2>Eventos mas frecuentes</h2><p>Acciones que alimentan el analisis del modelo.</p></div></div>
          <div className="lista-eventos-kalshi">
            {(eventos.data ?? []).map((evento, indice) => {
              const maximo = Math.max(...(eventos.data ?? []).map((item) => item.total), 1);
              const ancho = Math.max(evento.total / maximo * 100, 5);
              return <div className="evento-kalshi" key={evento.nombre_evento}><div><span>{indice + 1}</span><strong>{evento.nombre_evento}</strong><small>{numero(evento.total)}</small></div><div className="barra-evento-kalshi"><span style={{ width: `${ancho}%` }} /></div></div>;
            })}
          </div>
        </article>
      </section>

      <section className="nota-indice-kalshi"><Info size={18} /><p><strong>Como leerlo:</strong> el ranking y el indice de dominio describen lo que ya ocurrio. La seccion Nueva prediccion usa el modelo para estimar probabilidades futuras.</p></section>

      <section className="llamada-prediccion-kalshi">
        <div><span><Crosshair size={16} /> MODELO PREDICTIVO</span><h2>Convierte el analisis en una prediccion</h2><p>Selecciona local y visitante para obtener tres probabilidades: victoria local, empate y victoria visitante.</p></div>
        <Link className="boton-prediccion-kalshi" to="/predicciones/nueva">Comparar equipos <ArrowRight size={18} /></Link>
      </section>
    </div>
  );
}
