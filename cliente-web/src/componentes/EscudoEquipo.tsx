import { useEffect, useState } from "react";

interface PropiedadesEscudoEquipo {
  nombre: string;
  url?: string | null;
  tamano?: "pequeno" | "mediano" | "grande";
}

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function EscudoEquipo({
  nombre,
  url,
  tamano = "mediano"
}: PropiedadesEscudoEquipo) {
  const [imagenConError, setImagenConError] = useState(false);

  useEffect(() => {
    setImagenConError(false);
  }, [url]);

  return (
    <span
      className={`escudo-equipo escudo-equipo--${tamano}`}
      aria-label={`Escudo de ${nombre}`}
      title={nombre}
    >
      {url && !imagenConError ? (
        <img
          src={url}
          alt={`Escudo de ${nombre}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImagenConError(true)}
        />
      ) : (
        <span>{iniciales(nombre)}</span>
      )}
    </span>
  );
}
