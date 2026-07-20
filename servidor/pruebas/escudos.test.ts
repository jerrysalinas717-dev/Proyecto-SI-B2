import { afterEach, describe, expect, it, vi } from "vitest";
import { ServicioEscudoEquipo } from "../src/servicios/ServicioEscudoEquipo.js";

describe("ServicioEscudoEquipo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("obtiene la URL remota del escudo y usa el alias del equipo", async () => {
    const fetchSimulado = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        teams: [
          {
            strTeam: "Manchester United",
            strSport: "Soccer",
            strBadge: "https://imagenes.example/manchester-united.png"
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchSimulado);

    const servicio = new ServicioEscudoEquipo();
    const url = await servicio.buscar("Manchester Utd");

    expect(url).toBe("https://imagenes.example/manchester-united.png");
    expect(String(fetchSimulado.mock.calls[0][0])).toContain("Manchester%20United");
  });

  it("devuelve null cuando el servicio externo no esta disponible", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sin conexion")));
    const servicio = new ServicioEscudoEquipo();
    await expect(servicio.buscar("Barcelona")).resolves.toBeNull();
  });
});
