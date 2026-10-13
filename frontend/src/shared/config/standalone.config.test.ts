import { afterEach, describe, expect, it, vi } from "vitest";
import { isStandaloneEpic4, STANDALONE_EPIC4_HOME_PATH } from "./standalone.config";

describe("standalone.config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("la pantalla de inicio del modo standalone es Publicar vacante", () => {
    expect(STANDALONE_EPIC4_HOME_PATH).toBe("/recruiters/job-offers/new");
  });

  it("está desactivado cuando la variable no existe", () => {
    vi.stubEnv("NEXT_PUBLIC_STANDALONE_EPIC4", "");
    expect(isStandaloneEpic4()).toBe(false);
  });

  it.each(["false", "1", "TRUE", "yes"])("solo el valor exacto 'true' lo activa (%s no)", (value) => {
    vi.stubEnv("NEXT_PUBLIC_STANDALONE_EPIC4", value);
    expect(isStandaloneEpic4()).toBe(false);
  });

  it("se activa con NEXT_PUBLIC_STANDALONE_EPIC4=true", () => {
    vi.stubEnv("NEXT_PUBLIC_STANDALONE_EPIC4", "true");
    expect(isStandaloneEpic4()).toBe(true);
  });
});
