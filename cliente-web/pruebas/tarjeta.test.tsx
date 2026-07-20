import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TarjetaIndicador } from "../src/componentes/TarjetaIndicador";

describe("TarjetaIndicador", () => {
  it("muestra titulo y valor", () => {
    const html = renderToStaticMarkup(<TarjetaIndicador titulo="Partidos analizados" valor="10" />);
    expect(html).toContain("Partidos analizados");
    expect(html).toContain("10");
  });
});

