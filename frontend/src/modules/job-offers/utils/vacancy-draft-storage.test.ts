import { afterEach, describe, expect, it } from "vitest";
import {
  buildVacancyDraftKey,
  clearVacancyDraft,
  readVacancyDraft,
  saveVacancyDraft,
} from "./vacancy-draft-storage";

const CONDITIONS = {
  title: "Backend",
  modality: null,
  mapsLink: "",
  contractType: "",
  category: "",
  vacancyCount: "",
  salary: "",
  languages: "",
  description: "",
  skills: [],
};

describe("vacancy-draft-storage", () => {
  afterEach(() => window.sessionStorage.clear());

  it("separa los borradores por empresa y por vacante", () => {
    expect(buildVacancyDraftKey("company-1")).toBe("umssy:vacancy-draft:company-1:new");
    expect(buildVacancyDraftKey("company-1", "offer-1")).toBe("umssy:vacancy-draft:company-1:offer-1");
  });

  it("guarda, lee y borra un borrador", () => {
    const key = buildVacancyDraftKey("company-1");
    saveVacancyDraft(key, CONDITIONS);
    expect(readVacancyDraft(key)).toEqual(CONDITIONS);

    clearVacancyDraft(key);
    expect(readVacancyDraft(key)).toBeNull();
  });

  it("ignora un borrador dañado", () => {
    const key = buildVacancyDraftKey("company-1");
    window.sessionStorage.setItem(key, "{no es json");
    expect(readVacancyDraft(key)).toBeNull();

    window.sessionStorage.setItem(key, JSON.stringify({ title: 1 }));
    expect(readVacancyDraft(key)).toBeNull();
  });
});
