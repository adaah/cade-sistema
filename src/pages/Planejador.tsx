import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ScheduleGrid } from '@/components/planner/ScheduleGrid';
import { ScheduleSummary } from '@/components/planner/ScheduleSummary';
import { MobileSchedule } from '@/components/planner/MobileSchedule';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApp } from '@/contexts/AppContext';
import { useCourses, useSections } from '@/hooks/useApi';
import { Course } from '@/services/api';
import { Search, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const Planejador = () => {
  const isMobile = useIsMobile();
  const { scheduledItems } = useApp();
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: sections, isLoading: loadingSections } = useSections();

  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'M' | 'T' | 'N'>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Course | null>(null);

  const availableCourses = useMemo(() => {
    if (!courses || !sections) return [];

    return courses.filter(course => {
      const courseSections = sections.filter(s => 
        s.course_code === course.code && s.available > 0
      );
      
      if (courseSections.length === 0) return false;

      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          course.name.toLowerCase().includes(searchLower) ||
          course.code.toLowerCase().includes(searchLower) ||
          courseSections.some(s => s.professor.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      if (periodFilter !== 'all') {
        const hasMatchingPeriod = courseSections.some(s => 
          s.schedule_raw?.includes(periodFilter)
        );
        if (!hasMatchingPeriod) return false;
      }

      return true;
    });
  }, [courses, sections, search, periodFilter]);

  const selectedSections = useMemo(() => {
    if (!selectedDiscipline || !sections) return [];
    return sections.filter(s => s.course_code === selectedDiscipline.code);
  }, [selectedDiscipline, sections]);

  const getCourseStats = (courseCode: string) => {
    const courseSections = sections?.filter(s => s.course_code === courseCode) || [];
    const totalSpots = courseSections.reduce((sum, s) => sum + s.available, 0);
    return { sectionCount: courseSections.length, availableSpots: totalSpots };
  };

  const isLoading = loadingCourses || loadingSections;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Planejador de Grade
          </h1>
          <p className="text-muted-foreground">
            Monte sua grade horária para o próximo semestre
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar disciplina ou professor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div className="flex gap-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'M', label: 'Manhã' },
                { id: 'T', label: 'Tarde' },
                { id: 'N', label: 'Noite' },
              ].map((period) => (
                <button
                  key={period.id}
                  onClick={() => setPeriodFilter(period.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-1",
                    periodFilter === period.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {period.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {isLoading ? (
                [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
              ) : availableCourses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma disciplina encontrada</p>
                </div>
              ) : (
                availableCourses.map((course) => {
                  const stats = getCourseStats(course.code);
                  return (
                    <button
                      key={course.code}
                      onClick={() => setSelectedDiscipline(course)}
                      className="w-full p-3 rounded-lg bg-card border border-border text-left hover:bg-accent transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-primary">{course.code}</span>
                          <p className="font-medium text-card-foreground line-clamp-2">{course.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{course.workload}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{stats.availableSpots} vagas</span>
                        </div>
                        <span>{stats.sectionCount} turma(s)</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <ScheduleSummary />
          </div>

          <div className="lg:col-span-2">
            {isMobile ? (
              <MobileSchedule />
            ) : (
              <ScheduleGrid />
            )}
          </div>
        </div>

        {selectedDiscipline && (
          <DisciplineDetail
            discipline={selectedDiscipline}
            sections={selectedSections}
            onClose={() => setSelectedDiscipline(null)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Planejador;
