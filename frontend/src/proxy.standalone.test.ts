import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

const BASE = "http://localhost:3000";

const call = (path: string) => proxy(new NextRequest(`${BASE}${path}`));
const redirectOf = (response: Response) => response.headers.get("location");
const passes = (response: Response) => response.headers.get("x-middleware-next") === "1" && redirectOf(response) === null;

describe("proxy: modo standalone de Epic 4", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_STANDALONE_EPIC4", "true"));
  afterEach(() => vi.unstubAllEnvs());

  it.each(["/", "/login"])("%s lleva a Publicar vacante con 307, sin sesión", (path) => {
    const response = call(path);
    expect(response.status).toBe(307);
    expect(redirectOf(response)).toBe(`${BASE}/recruiters/job-offers/new`);
  });

  it.each(["/recruiters/job-offers/new", "/recruiters", "/profile", "/ruta-que-no-existe"])(
    "%s pasa sin pedir sesión (nunca redirige al login: evita el bucle)",
    (path) => {
      expect(passes(call(path))).toBe(true);
    },
  );

  it("sin la variable vuelve al comportamiento normal (exige sesión)", () => {
    vi.stubEnv("NEXT_PUBLIC_STANDALONE_EPIC4", "");
    const response = call("/recruiters/job-offers/new");
    expect(response.status).toBe(307);
    expect(redirectOf(response)).toBe(`${BASE}/login?next=%2Frecruiters%2Fjob-offers%2Fnew`);
  });
});
