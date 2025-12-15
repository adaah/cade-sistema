import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

interface ScheduleItem {
  disciplineCode: string;
  disciplineName: string;
  classCode: string;
  professor: string;
  schedule: string;
  color: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface AppSettings {
  completedDisciplines: string[];
  scheduledItems: ScheduleItem[];
  isOnboarded: boolean;
}

interface AppContextType {
  completedDisciplines: string[];
  toggleCompletedDiscipline: (code: string) => void;
  scheduledItems: ScheduleItem[];
  addToSchedule: (item: ScheduleItem) => void;
  removeFromSchedule: (disciplineCode: string, classCode: string) => void;
  clearSchedule: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const COLORS = [
  'hsl(217, 91%, 60%)',   // Blue
  'hsl(142, 71%, 45%)',   // Green
  'hsl(280, 65%, 60%)',   // Purple
  'hsl(0, 72%, 51%)',     // Red
  'hsl(38, 92%, 50%)',    // Orange
  'hsl(180, 65%, 45%)',   // Teal
  'hsl(320, 65%, 52%)',   // Pink
  'hsl(45, 93%, 47%)',    // Yellow
];

// Atoms with storage (persisted in localStorage)
const completedDisciplinesAtom = atomWithStorage<string[]>('completedDisciplines', []);
const scheduledItemsAtom = atomWithStorage<ScheduleItem[]>('scheduledItems', []);
const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');
const onboardedAtom = atomWithStorage<boolean>('isOnboarded', false);

// Derived write atoms for actions
const toggleCompletedDisciplineAtom = atom(null, (get, set, code: string) => {
  const prev = get(completedDisciplinesAtom);
  const next = prev.includes(code)
    ? prev.filter((c) => c !== code)
    : [...prev, code];
  set(completedDisciplinesAtom, next);
});

const addToScheduleAtom = atom(null, (get, set, item: ScheduleItem) => {
  const current = get(scheduledItemsAtom);

  // Use consistent color per discipline, assign new if needed
  const existingForDiscipline = current.find(
    (s) => s.disciplineCode === item.disciplineCode
  );
  const colorBaseCount = current.filter((s, i, arr) =>
    arr.findIndex((x) => x.disciplineCode === s.disciplineCode) === i
  ).length;

  const color = existingForDiscipline
    ? existingForDiscipline.color
    : COLORS[colorBaseCount % COLORS.length];

  const itemWithColor: ScheduleItem = { ...item, color: item.color || color };
  set(scheduledItemsAtom, [...current, itemWithColor]);
});

const removeFromScheduleAtom = atom(
  null,
  (get, set, disciplineCode: string, classCode: string) => {
    const current = get(scheduledItemsAtom);
    set(
      scheduledItemsAtom,
      current.filter(
        (item) => !(item.disciplineCode === disciplineCode && item.classCode === classCode)
      )
    );
  }
);

const clearScheduleAtom = atom(null, (_get, set) => {
  set(scheduledItemsAtom, []);
});

const toggleThemeAtom = atom(null, (get, set) => {
  const current = get(themeAtom);
  set(themeAtom, current === 'light' ? 'dark' : 'light');
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme] = useAtom(themeAtom);

  // Sync DOM class with theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const completedDisciplines = useAtomValue(completedDisciplinesAtom);
  const setCompletedDisciplines = useSetAtom(completedDisciplinesAtom);
  const toggleCompletedDiscipline = useSetAtom(toggleCompletedDisciplineAtom);

  const scheduledItems = useAtomValue(scheduledItemsAtom);
  const setScheduledItems = useSetAtom(scheduledItemsAtom);
  const addToSchedule = useSetAtom(addToScheduleAtom);
  const removeFromSchedule = useSetAtom(removeFromScheduleAtom);
  const clearSchedule = useSetAtom(clearScheduleAtom);

  const toggleTheme = useSetAtom(toggleThemeAtom);

  const isOnboarded = useAtomValue(onboardedAtom);
  const setIsOnboarded = useSetAtom(onboardedAtom);

  const exportSettings = (): string => {
    const settings: AppSettings = {
      completedDisciplines,
      scheduledItems,
      isOnboarded,
    };
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (json: string): boolean => {
    try {
      const settings = JSON.parse(json) as Partial<AppSettings & { selectedCourse?: string | null }>;
      if (Array.isArray(settings.completedDisciplines))
        setCompletedDisciplines(settings.completedDisciplines);
      if (Array.isArray(settings.scheduledItems))
        setScheduledItems(settings.scheduledItems);
      if (settings.isOnboarded !== undefined) setIsOnboarded(settings.isOnboarded);
      // Legacy support: if a previous export had selectedCourse, migrate it to localStorage
      if (settings.selectedCourse) {
        try {
          localStorage.setItem('selectedPrograms', JSON.stringify([settings.selectedCourse]));
        } catch {}
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        completedDisciplines,
        toggleCompletedDiscipline,
        scheduledItems,
        addToSchedule,
        removeFromSchedule,
        clearSchedule,
        theme,
        toggleTheme,
        isOnboarded,
        setIsOnboarded,
        exportSettings,
        importSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
