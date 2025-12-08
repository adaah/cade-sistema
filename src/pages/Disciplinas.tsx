import { useState, useMemo } from 'react';
import { Search, Check, Lock, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DisciplineCard } from '@/components/disciplines/DisciplineCard';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useApp } from '@/contexts/AppContext';
import { useCourses, usePrograms, useProgramCourses } from '@/hooks/useApi';
import { Course } from '@/services/api';
import { cn } from '@/lib/utils';
import { NewDisciplineModal } from '@/components/disciplines/NewDisciplineModal';

const Disciplinas = () => {
  const { selectedCourse, completedDisciplines, toggleCompletedDiscipline } = useApp();
  const { data: programs } = usePrograms();
  const { data: programCourses, isLoading: loadingProgramCourses } = useProgramCourses(selectedCourse);
  const { data: allCourses, isLoading: loadingAllCourses } = useCourses();
  
  // Buscar detalhes do programa selecionado
  const selectedProgram = programs?.find(p => p.id_ref === selectedCourse);
  
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSemester, setActiveSemester] = useState<number | null>(null);
  const [selectedDisciplineCode, setSelectedDisciplineCode] = useState<string|null>(null);

  const courses = useMemo(() => {
    if (selectedCourse && programCourses) return programCourses;
    return allCourses || [];
  }, [allCourses, programCourses, selectedCourse]);

  // Group courses by semester
  const coursesBySemester = useMemo(() => {
    const grouped: Record<number, Course[]> = {};
    
    courses.forEach(course => {
      const sem = course.semester || 1;
      if (!grouped[sem]) grouped[sem] = [];
      grouped[sem].push(course);
    });
    
    return grouped;
  }, [courses]);

  // Agrupar obrigatórias por semestre
  const obrigatoriasAgrupadasPorSemestre = useMemo(() => {
    const agrupado: Record<number, Course[]> = {};
    courses
      .filter(c => c.type === 'obrigatoria')
      .forEach(c => {
        const sem = c.semester || 1;
        if (!agrupado[sem]) agrupado[sem] = [];
        agrupado[sem].push(c);
      });
    return agrupado;
  }, [courses]);

  // Obter todos os semestres ordenados
  const semestresObrigatorios = useMemo(
    () => Object.keys(obrigatoriasAgrupadasPorSemestre).map(Number).sort((a, b) => a - b),
    [obrigatoriasAgrupadasPorSemestre]
  );

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    
    return courses.filter((d) => {
      const searchMatch = 
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase());

      if (!searchMatch) return false;

      const courseType = d.type;
      const courseSemester = d.semester;

      if (activeFilter === 'obrigatoria' && courseType !== 'obrigatoria') return false;
      if (activeFilter === 'optativa' && courseType !== 'optativa') return false;
      if (activeFilter === 'completed' && !completedDisciplines.includes(d.code)) return false;
      if (activeFilter === 'available' && !canTake(d.code)) return false;

      if (activeSemester && courseSemester !== activeSemester) return false;

      return true;
    });
  }, [courses, search, activeFilter, activeSemester, completedDisciplines]);

  // Check if a course can be taken (prerequisites met)
  const canTake = (code: string): boolean => {
    const course = courses?.find(c => c.code === code);
    if (!course) return false;
    if (completedDisciplines.includes(code)) return false;
    
    const prerequisites = course.prerequisites || [];
    return prerequisites.every(prereq => completedDisciplines.includes(prereq));
  };

  // Remover filtros e toggle de visualização
  // 174|        {/* Filters */}
  // 175-218 REMOVER

  // Legend
  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'obrigatoria', label: 'Obrigatórias' },
    { id: 'optativa', label: 'Optativas' },
    { id: 'completed', label: 'Cursadas' },
    { id: 'available', label: 'Disponíveis' },
  ];

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Catálogo de Disciplinas
          </h1>
          {selectedProgram ? (
            <p className="text-muted-foreground">
              {selectedProgram.title} • {selectedProgram.location}
            </p>
          ) : (
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle className="w-4 h-4" />
              <p className="text-muted-foreground">
                Selecione um curso nas configurações para ver apenas as disciplinas do seu curso
              </p>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquise por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success" />
            <span className="text-sm text-muted-foreground">Cursada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning" />
            <span className="text-sm text-muted-foreground">Disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span className="text-sm text-muted-foreground">Bloqueada</span>
          </div>
        </div>

        {/* Content */}
        {loadingProgramCourses || loadingAllCourses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          // NOVA visão 100% alinhada ao programa: só obrigatórias do programa agrupadas por semestre
          <div className="space-y-6">
            {semestresObrigatorios.map((semester) => {
              const obrigatoriasNoSemestre = obrigatoriasAgrupadasPorSemestre[semester] || [];
              if (!obrigatoriasNoSemestre.length) return null;
              return (
                <div key={semester} className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                    {semester}º Semestre
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {obrigatoriasNoSemestre.map((programCourse) => {
                      // Cruzar detalhes (nome, créditos, workload) pelo banco geral 'courses'.
                      const course = courses?.find(c => c.code === programCourse.code);
                      if (!course) return null; // Não tem detalhes, pula
                      const completed = completedDisciplines.includes(course.code);
                      const available = canTake(course.code); // Mesma regra de disponibilidade
                      const blocked = !completed && !available;
                      return (
                        <button
                          key={course.code}
                          onClick={() => setSelectedDisciplineCode(course.code)}
                          className={cn(
                            "p-3 rounded-xl text-left transition-all border-2",
                            completed && "bg-success/10 border-success",
                            available && !completed && "bg-warning/10 border-warning hover:bg-warning/20",
                            blocked && "bg-muted border-muted opacity-60"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold truncate">{course.code}</span>
                            {completed && <Check className="w-3 h-3 text-success flex-shrink-0" />}
                            {blocked && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                          </div>
                          <p className={cn(
                            "text-xs line-clamp-2",
                            completed ? "text-success" : 
                            available ? "text-warning" : 
                            "text-muted-foreground"
                          )}>{course.name}</p>
                          {(course.prerequisites?.length || 0) > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">
                              Pré-req: {course.prerequisites?.join(', ')}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma obrigatória encontrada para esse curso
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredCourses.length === 0 && viewMode === 'grid' && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma disciplina encontrada com os filtros selecionados
            </p>
          </div>
        )}

        {/* Detail drawer/modal */}
        {selectedDisciplineCode &&
          <NewDisciplineModal
            key={selectedDisciplineCode}
            code={selectedDisciplineCode}
            onClose={() => setSelectedDisciplineCode(null)}
          />
        }
      </div>
    </MainLayout>
  );
};

export default Disciplinas;
