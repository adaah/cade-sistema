import { atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai';
import { produce } from 'immer';
import type { Section } from '@/services/api';
import { useMemo } from 'react';
import { getSpplitedCode } from '@/lib/schedule';

// Persisted sections selected by the user
const mySectionsAtom = atomWithStorage<Section[]>('mySections', []);

export function useMySections() {
  const [mySections, setMySections] = useAtom(mySectionsAtom);

  const toggleSection = (aSection: Section) => {
    setMySections((current) => {
      const conflictingIds = new Set<string>(
        (aSection.time_codes || [])
          .flatMap((code) => hasSectionOnCode(code))
          .map((res) => res.section.id_ref)
      );

      const next = produce(current, (draft) => {
        const idxSameId = draft.findIndex((s) => s.id_ref === aSection.id_ref);
        if (idxSameId >= 0) {
          draft.splice(idxSameId, 1);
          return;
        }

        // Remove all conflicting sections by id_ref first
        if (conflictingIds.size > 0) {
          for (let i = draft.length - 1; i >= 0; i--) {
            if (conflictingIds.has(draft[i].id_ref)) draft.splice(i, 1);
          }
        }

        // Then keep the existing rule: only one section per course
        const courseCode = aSection.course.code;
        if (courseCode) {
          for (let i = draft.length - 1; i >= 0; i--) {
            const s = draft[i];
            if ((s.course?.code || (s as any)?.course_code) === courseCode) {
              draft.splice(i, 1);
            }
          }
        }

        draft.push(aSection);
      });
      return next;
    });
  };

  const clearSections = () => setMySections([]);

  // Record keyed by each time code (if any)
  const byTimeCode = useMemo(() =>
    mySections
      .flatMap((s) => (s.time_codes || []).map((code) => [code, s] as const))
      .reduce((acc, [code, s]) => {
        acc[code] = s;
        return acc;
      }, {} as Record<string, Section>)
  , [mySections]);

  const timeCodeKeys = useMemo(() => Object.keys(byTimeCode), [byTimeCode]);

  // Record keyed by id_ref
  const byIdRef = useMemo(() =>
    mySections.reduce((acc, s) => {
      acc[s.id_ref] = s;
      return acc;
    }, {} as Record<string, Section>)
  , [mySections]);

  // Record keyed by course.code (last one wins if multiple)
  const byCourseCode = useMemo(() =>
    mySections.reduce((acc, s) => {
      const code = s.course.code;
      acc[code] = s;
      return acc;
    }, {} as Record<string, Section>)
  , [mySections]);

  // Record keyed by cartesian split codes from time_codes
  const byCartesianCode = useMemo(() =>
    Object.entries(byTimeCode)
      .flatMap(([time, s]) => getSpplitedCode(time).map((k) => [k, s] as const))
      .reduce((acc, [k, s]) => {
        acc[k] = s;
        return acc;
      }, {} as Record<string, Section>)
  , [byTimeCode]);

  const hasSectionOnCourse = (code: string): boolean => {
    if (!code) return false;
    return !!byCourseCode[code];
  };

  const hasSectionOnCode = (code: string): Array<{ code: string; section: Section }> => {
    if (!code) return [];
    const keys = getSpplitedCode(code);
    return keys
      .map((k) => (byCartesianCode[k] ? { code: k, section: byCartesianCode[k] } : null))
      .filter((x): x is { code: string; section: Section } => !!x);
  };

  const getConflictsForSection = (aSection: Section): Array<{ code: string; section: Section }> => {
    const seen = new Set<string>();
    return (aSection.time_codes || [])
      .flatMap((code) => hasSectionOnCode(code))
      .filter(({ section }) => section.id_ref !== aSection.id_ref)
      .filter(({ section }) => {
        if (seen.has(section.id_ref)) return false;
        seen.add(section.id_ref);
        return true;
      });
  };

  return {
    mySections,
    toggleSection,
    clearSections,
    byTimeCode,
    timeCodeKeys,
    byIdRef,
    byCourseCode,
    byCartesianCode,
    hasSectionOnCourse,
    hasSectionOnCode,
    getConflictsForSection,
  } as const;
}
