import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Section } from "@/services/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSemesterTitle = (level: string) => level.replace("Nível", "Semestre")

// Helpers de vagas reservadas da turma
export function getTotalSportReservedAccepted(aSection: Section): number {
  const list = Array.isArray(aSection?.spots_reserved) ? aSection.spots_reserved : [];
  return list.reduce((sum, item) => {
    const accepted = (item as any)?.seats_accepted ?? 0;
    return sum + Math.max(0, Number(accepted));
  }, 0);
}

export function getTotalSportReservedCount(aSection: Section): number {
  const list = Array.isArray(aSection?.spots_reserved) ? aSection.spots_reserved : [];
  return list.reduce((sum, item) => {
    const count = (item as any)?.seats_count ?? 0;
    return sum + Math.max(0, Number(count));
  }, 0);
}

export function getReservedUnfilledBonus(aSection: Section): number {
  const total = getTotalSportReservedCount(aSection);
  const accepted = getTotalSportReservedAccepted(aSection);
  return Math.max(0, total - accepted);
}

export function getReservedUnfilledForTitles(aSection: Section, titles: Set<string>): number {
  const list = Array.isArray(aSection?.spots_reserved) ? aSection.spots_reserved : [];
  let sum = 0;
  for (const item of list) {
    const title = (((item as any)?.program?.title) || '').trim().toLowerCase();
    if (!title || !titles.has(title)) continue;
    const count = Math.max(0, Number((item as any)?.seats_count ?? 0));
    const accepted = Math.max(0, Number((item as any)?.seats_accepted ?? 0));
    sum += Math.max(0, count - accepted);
  }
  return Math.max(0, sum);
}
