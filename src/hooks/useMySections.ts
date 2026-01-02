import { atomWithStorage } from 'jotai/utils';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { produce } from 'immer';
import type { Section } from '@/services/api';
import { useMemo } from 'react';

// Persisted sections selected by the user
const mySectionsAtom = atomWithStorage<Section[]>('mySections', []);

// Toggle add/remove by id_ref
const toggleSectionAtom = atom(null, (get, set, aSection: Section) => {
  const current = get(mySectionsAtom);
  const next = produce(current, (draft) => {
    const idxSameId = draft.findIndex((s) => s.id_ref === aSection.id_ref);
    if (idxSameId >= 0) {
      // Toggle off if same section already selected
      draft.splice(idxSameId, 1);
      return;
    }

    const courseCode = (aSection as any)?.course?.code || (aSection as any)?.course_code;
    if (courseCode) {
      // Remove any existing section from the same course before adding
      for (let i = draft.length - 1; i >= 0; i--) {
        const s = draft[i] as any;
        const sCode = s?.course?.code || s?.course_code;
        if (sCode === courseCode) {
          draft.splice(i, 1);
        }
      }
    }
    draft.push(aSection);
  });
  set(mySectionsAtom, next);
});

const clearSectionsAtom = atom(null, (_get, set) => {
  set(mySectionsAtom, []);
});

export function useMySections() {
  const mySections = useAtomValue(mySectionsAtom);
  const toggleSection = useSetAtom(toggleSectionAtom);
  const clearSections = useSetAtom(clearSectionsAtom);

  // Record keyed by each time code (if any)
  const byTimeCode = useMemo(() => {
    const map: Record<string, Section> = {};
    for (const s of mySections) {
      const timeCodes: string[] = Array.isArray((s as any)?.time_codes)
        ? ((s as any).time_codes as string[])
        : [];
      for (const code of timeCodes) {
        map[code] = s;
      }
    }
    return map;
  }, [mySections]);

  const timeCodeKeys = useMemo(() => Object.keys(byTimeCode), [byTimeCode]);

  // Record keyed by id_ref
  const byIdRef = useMemo(() => {
    const map: Record<string, Section> = {};
    for (const s of mySections) {
      map[s.id_ref] = s;
    }
    return map;
  }, [mySections]);

  // Record keyed by course.code (last one wins if multiple)
  const byCourseCode = useMemo(() => {
    const map: Record<string, Section> = {};
    for (const s of mySections) {
      const code = (s as any)?.course?.code || (s as any)?.course_code;
      if (code) map[code] = s as Section;
    }
    return map;
  }, [mySections]);

  const hasSectionOnCourse = (code: string): boolean => {
    if (!code) return false;
    return !!byCourseCode[code];
  };

  return {
    mySections,
    toggleSection,
    clearSections,
    byTimeCode,
    timeCodeKeys,
    byIdRef,
    byCourseCode,
    hasSectionOnCourse,
  } as const;
}
