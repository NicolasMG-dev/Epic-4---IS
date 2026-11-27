import "@/shared/testing/indexed-db.mock";
import "@/modules/job-offers/testing/current-company.mock";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { createQueryWrapper } from "@/shared/testing/create-query-wrapper";
import { jobOffersService } from "../services/job-offers.service";
import { buildSessionToken, COMPANY_ID, DOCKER } from "../testing/vacancy-fixtures";
import type { JobOfferDetailsResponse } from "../types/job-offer-details-response.types";
import { buildVacancyDraftKey } from "../utils/vacancy-draft-storage";
import { useJobOfferForm } from "./use-job-offer-form";

vi.mock("../services/job-offers.service", () => ({ jobOffersService: { getByCompanyAndId: vi.fn() } }));

const OFFER: JobOfferDetailsResponse = {
  id: "offer-1",
  title: "DevOps Senior",
  description: "Descripción original",
  category: "Tecnología",
  modality: "Híbrido",
  contractType: "Tiempo completo",
  status: "Publicada",
  positionsAvailable: 2,
  salaryRange: "Bs 6.500 - 8.000",
  languages: "Español",
  locationUrl: "https://maps.app.goo.gl/TechBolivia",
  expiresAt: null,
  publishedAt: "2026-10-12T00:00:00.000Z",
  createdAt: "2026-10-12T00:00:00.000Z",
  company: { id: COMPANY_ID, name: "TechBolivia" },
  skills: [DOCKER],
};

const NEW_DRAFT_KEY = buildVacancyDraftKey(COMPANY_ID);
const EDIT_DRAFT_KEY = buildVacancyDraftKey(COMPANY_ID, "offer-1");

describe("useJobOfferForm conserva lo escrito si la sesión se cierra", () => {
  beforeEach(async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_COMPANY_ID", COMPANY_ID);
    await saveAccessToken(buildSessionToken("empresa"));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    clearAccessToken();
    window.sessionStorage.clear();
  });

  it("recupera una vacante nueva a medio escribir al volver a abrir el formulario", () => {
    const first = renderHook(() => useJobOfferForm(), createQueryWrapper());
    act(() => first.result.current.updateField("title", "Backend Python"));
    first.unmount();

    const { result } = renderHook(() => useJobOfferForm(), createQueryWrapper());

    expect(result.current.conditions.title).toBe("Backend Python");
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it("recupera los cambios de una edición en lugar de los datos guardados", async () => {
    vi.mocked(jobOffersService.getByCompanyAndId).mockResolvedValue(OFFER);
    window.sessionStorage.setItem(
      EDIT_DRAFT_KEY,
      JSON.stringify({
        title: "DevOps Senior",
        modality: "Híbrido",
        mapsLink: "https://maps.app.goo.gl/TechBolivia",
        contractType: "Tiempo completo",
        category: "Tecnología",
        vacancyCount: "2",
        salary: "Bs 6.500 - 8.000",
        languages: "Español",
        description: "Descripción editada",
        skills: [DOCKER],
      }),
    );

    const { result } = renderHook(() => useJobOfferForm("offer-1"), createQueryWrapper());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conditions.description).toBe("Descripción editada");
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it("no usa el borrador de otra vacante", async () => {
    vi.mocked(jobOffersService.getByCompanyAndId).mockResolvedValue(OFFER);
    window.sessionStorage.setItem(
      buildVacancyDraftKey(COMPANY_ID, "offer-2"),
      JSON.stringify({ title: "Otra vacante", description: "Otra", skills: [] }),
    );

    const { result } = renderHook(() => useJobOfferForm("offer-1"), createQueryWrapper());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.conditions.title).toBe("DevOps Senior");
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("borra el borrador al reiniciar o descartar el formulario", () => {
    const { result } = renderHook(() => useJobOfferForm(), createQueryWrapper());
    act(() => result.current.updateField("title", "Backend Python"));
    expect(window.sessionStorage.getItem(NEW_DRAFT_KEY)).not.toBeNull();

    act(() => result.current.reset());
    expect(window.sessionStorage.getItem(NEW_DRAFT_KEY)).toBeNull();

    act(() => result.current.updateField("title", "Frontend"));
    act(() => result.current.discardDraft());
    expect(window.sessionStorage.getItem(NEW_DRAFT_KEY)).toBeNull();
  });
});
