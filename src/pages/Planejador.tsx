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
import { Course, Section } from '@/services/api';
import { Search, Plus, Clock, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Planejador = () => {
  const isMobile = useIsMobile();
  const { scheduledItems } = useApp();
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: sections, isLoading: loadingSections } = useSections();

  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'M' | 'T' | 'N'>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Course | null>(null);

  // Get courses with available sections
  const availableCourses = useMemo(() => {
    if (!courses || !sections) return [];

    return courses.filter(course => {
      // Check if has sections with available spots
      const courseSections = sections.filter(s => 
        s.course_code === course.code && s.available > 0
      );
      
      if (courseSections.length === 0) return false;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          course.name.toLowerCase().includes(searchLower) ||
          course.code.toLowerCase().includes(searchLower) ||
          courseSections.some(s => s.professor.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Period filter
      if (periodFilter !== 'all') {
        const hasMatchingPeriod = courseSections.some(s => 
          s.schedule_raw?.includes(periodFilter)
        );
        if (!hasMatchingPeriod) return false;
      }

      return true;
    });
  }, [courses, sections, search, periodFilter]);

  // Get sections for selected discipline
  const selectedSections = useMemo(() => {
    if (!selectedDiscipline || !sections) return [];
    return sections.filter(s => s.course_code === selectedDiscipline.code);
  }, [selectedDiscipline, sections]);

  // Get section count and available spots for a course
  const getCourseStats = (courseCode: string) => {
    const courseSections = sections?.filter(s => s.course_code === courseCode) || [];
    const totalSpots = courseSections.reduce((sum, s) => sum + s.available, 0);
    return { sectionCount: courseSections.length, availableSpots: totalSpots };
  };

  const isLoading = loadingCourses || loadingSections;

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Meu Planejador
          </h1>
          <p className="text-muted-foreground">
            Adicione disciplinas com vagas disponíveis à sua grade
          </p>
        </div>

        {/* Content */}
        {isMobile ? (
          <div className="space-y-6">
            <ScheduleSummary />
            
            {/* Search Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Adicionar Disciplinas</h2>
              
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, código ou professor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              {/* Courses list */}
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableCourses.slice(0, 20).map(course => {
                    const stats = getCourseStats(course.code);
                    return (
                      <button
                        key={course.code}
                        onClick={() => setSelectedDiscipline(course)}
                        className="w-full p-4 bg-card rounded-xl border border-border text-left hover:border-primary/50 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-semibold text-primary">{course.code}</span>
                            <p className="font-medium text-card-foreground">{course.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {stats.sectionCount} turmas • {stats.availableSpots} vagas
                            </p>
                          </div>
                          <Plus className="w-5 h-5 text-primary" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <MobileSchedule />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Available Courses */}
            <div className="lg:col-span-1 space-y-4">
              <ScheduleSummary />
              
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold text-card-foreground mb-3">Adicionar Disciplinas</h3>
                
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                {/* Period filter */}
                <div className="flex gap-1 mb-3">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'M', label: 'Manhã' },
                    { id: 'T', label: 'Tarde' },
                    { id: 'N', label: 'Noite' },
                  ].map(period => (
                    <button
                      key={period.id}
                      onClick={() => setPeriodFilter(period.id as typeof periodFilter)}
                      className={cn(
                        "flex-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                        periodFilter === period.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>

                {/* Courses list */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {availableCourses.slice(0, 30).map(course => {
                      const stats = getCourseStats(course.code);
                      const isScheduled = scheduledItems.some(s => s.disciplineCode === course.code);
                      
                      return (
                        <button
                          key={course.code}
                          onClick={() => setSelectedDiscipline(course)}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-all",
                            isScheduled 
                              ? "bg-success/10 border border-success/50"
                              : "bg-muted/50 hover:bg-muted border border-transparent"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold text-primary">{course.code}</span>
                              <p className="font-medium text-card-foreground text-sm truncate">{course.name}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {stats.sectionCount} turmas
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {stats.availableSpots} vagas
                                </span>
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                    
                    {availableCourses.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Nenhuma disciplina encontrada
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Panel - Schedule */}
            <div className="lg:col-span-3 bg-card rounded-xl border border-border p-4">
              <ScheduleGrid />
            </div>
          </div>
        )}

        {/* Discipline Detail Modal */}
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
