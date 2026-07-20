import request from "supertest";
import { describe, expect, it } from "vitest";
import { aplicacion } from "../src/aplicacion.js";

describe("salud", () => {
  it("responde estructura de salud", async () => {
    const respuesta = await request(aplicacion).get("/api/salud");
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.exito).toBe(true);
  });
});

describe("rutas protegidas", () => {
  it("rechaza equipos sin token", async () => {
    const respuesta = await request(aplicacion).get("/api/equipos");
    expect(respuesta.status).toBe(401);
  });
});

