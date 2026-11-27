import type { VacancyConditions } from "../types/vacancy-conditions.types";

const DRAFT_KEY_PREFIX = "umssy:vacancy-draft";

function isVacancyConditions(value: unknown): value is VacancyConditions {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;
  return typeof draft.title === "string" && typeof draft.description === "string" && Array.isArray(draft.skills);
}

export function buildVacancyDraftKey(companyId: string, jobOfferId?: string): string {
  return `${DRAFT_KEY_PREFIX}:${companyId}:${jobOfferId ?? "new"}`;
}

export function readVacancyDraft(key: string): VacancyConditions | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const draft: unknown = JSON.parse(raw);
    return isVacancyConditions(draft) ? draft : null;
  } catch {
    return null;
  }
}

export function saveVacancyDraft(key: string, conditions: VacancyConditions): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(conditions));
  } catch {
    return;
  }
}

export function clearVacancyDraft(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    return;
  }
}
