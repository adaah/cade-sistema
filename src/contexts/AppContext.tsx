import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface AppContextType {
  selectedCourse: string | null;
  setSelectedCourse: (course: string | null) => void;
  completedDisciplines: string[];
  toggleCompletedDiscipline: (code: string) => void;
  favoriteDisciplines: string[];
  toggleFavoriteDiscipline: (code: string) => void;
  scheduledItems: ScheduleItem[];
  addToSchedule: (item: ScheduleItem) => void;
  removeFromSchedule: (disciplineCode: string, classCode: string) => void;
  clearSchedule: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isOnboarded: boolean;
  setIsOnboarded: (value: boolean) => void;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(() => {
    return localStorage.getItem('selectedCourse');
  });
  
  const [completedDisciplines, setCompletedDisciplines] = useState<string[]>(() => {
    const saved = localStorage.getItem('completedDisciplines');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [favoriteDisciplines, setFavoriteDisciplines] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteDisciplines');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [scheduledItems, setScheduledItems] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('scheduledItems');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('isOnboarded') === 'true';
  });

  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem('selectedCourse', selectedCourse);
    }
  }, [selectedCourse]);

  useEffect(() => {
    localStorage.setItem('completedDisciplines', JSON.stringify(completedDisciplines));
  }, [completedDisciplines]);

  useEffect(() => {
    localStorage.setItem('favoriteDisciplines', JSON.stringify(favoriteDisciplines));
  }, [favoriteDisciplines]);

  useEffect(() => {
    localStorage.setItem('scheduledItems', JSON.stringify(scheduledItems));
  }, [scheduledItems]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('isOnboarded', String(isOnboarded));
  }, [isOnboarded]);

  const toggleCompletedDiscipline = (code: string) => {
    setCompletedDisciplines(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleFavoriteDiscipline = (code: string) => {
    setFavoriteDisciplines(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const addToSchedule = (item: ScheduleItem) => {
    const colorIndex = scheduledItems.filter((s, i, arr) => 
      arr.findIndex(x => x.disciplineCode === s.disciplineCode) === i
    ).length;
    
    const itemWithColor = {
      ...item,
      color: item.color || COLORS[colorIndex % COLORS.length]
    };
    
    setScheduledItems(prev => [...prev, itemWithColor]);
  };

  const removeFromSchedule = (disciplineCode: string, classCode: string) => {
    setScheduledItems(prev => 
      prev.filter(item => !(item.disciplineCode === disciplineCode && item.classCode === classCode))
    );
  };

  const clearSchedule = () => {
    setScheduledItems([]);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <AppContext.Provider value={{
      selectedCourse,
      setSelectedCourse,
      completedDisciplines,
      toggleCompletedDiscipline,
      favoriteDisciplines,
      toggleFavoriteDiscipline,
      scheduledItems,
      addToSchedule,
      removeFromSchedule,
      clearSchedule,
      theme,
      toggleTheme,
      isOnboarded,
      setIsOnboarded
    }}>
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
