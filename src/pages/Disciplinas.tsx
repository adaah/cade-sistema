import { useState, useMemo } from 'react';
<<<<<<< HEAD
import { Search, Check, Lock, AlertCircle } from 'lucide-react';
=======
import { Search, Loader2, Check, Lock } from 'lucide-react';
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
import { MainLayout } from '@/components/layout/MainLayout';
import { DisciplineCard } from '@/components/disciplines/DisciplineCard';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useApp } from '@/contexts/AppContext';
<<<<<<< HEAD
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
=======
import { useCourses, useSections } from '@/hooks/useApi';
import { Course } from '@/services/api';
import { cn } from '@/lib/utils';

const Disciplinas = () => {
  const { completedDisciplines, toggleCompletedDiscipline } = useApp();
  const { data: courses, isLoading } = useCourses();
  const { data: sections } = useSections();
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
  
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSemester, setActiveSemester] = useState<number | null>(null);
<<<<<<< HEAD
  const [selectedDisciplineCode, setSelectedDisciplineCode] = useState<string|null>(null);

  const courses = useMemo(() => {
    if (selectedCourse && programCourses) return programCourses;
    return allCourses || [];
  }, [allCourses, programCourses, selectedCourse]);

  // Group courses by semester
  const coursesBySemester = useMemo(() => {
    const grouped: Record<number, Course[]> = {};
    
=======
  const [selectedDiscipline, setSelectedDiscipline] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'flowchart'>('flowchart');

  // Group courses by semester
  const coursesBySemester = useMemo(() => {
    if (!courses) return {};
    
    const grouped: Record<number, Course[]> = {};
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
    courses.forEach(course => {
      const sem = course.semester || 1;
      if (!grouped[sem]) grouped[sem] = [];
      grouped[sem].push(course);
    });
<<<<<<< HEAD
    
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
=======
    return grouped;
  }, [courses]);

  const semesters = Object.keys(coursesBySemester).map(Number).sort((a, b) => a - b);
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    
    return courses.filter((d) => {
      const searchMatch = 
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase());

      if (!searchMatch) return false;

<<<<<<< HEAD
      const courseType = d.type;
      const courseSemester = d.semester;

      if (activeFilter === 'obrigatoria' && courseType !== 'obrigatoria') return false;
      if (activeFilter === 'optativa' && courseType !== 'optativa') return false;
      if (activeFilter === 'completed' && !completedDisciplines.includes(d.code)) return false;
      if (activeFilter === 'available' && !canTake(d.code)) return false;

      if (activeSemester && courseSemester !== activeSemester) return false;
=======
      if (activeFilter === 'obrigatoria' && d.type !== 'obrigatoria') return false;
      if (activeFilter === 'optativa' && d.type !== 'optativa') return false;
      if (activeFilter === 'completed' && !completedDisciplines.includes(d.code)) return false;
      if (activeFilter === 'available' && !canTake(d.code)) return false;

      if (activeSemester && d.semester !== activeSemester) return false;
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae

      return true;
    });
  }, [courses, search, activeFilter, activeSemester, completedDisciplines]);

  // Check if a course can be taken (prerequisites met)
  const canTake = (code: string): boolean => {
    const course = courses?.find(c => c.code === code);
    if (!course) return false;
    if (completedDisciplines.includes(code)) return false;
<<<<<<< HEAD
    
    const prerequisites = course.prerequisites || [];
    return prerequisites.every(prereq => completedDisciplines.includes(prereq));
  };

  // Remover filtros e toggle de visualização
  // 174|        {/* Filters */}
  // 175-218 REMOVER

  // Legend
=======
    return course.prerequisites.every(prereq => completedDisciplines.includes(prereq));
  };

  // Get sections for selected discipline
  const selectedSections = useMemo(() => {
    if (!selectedDiscipline || !sections) return [];
    return sections.filter(s => s.course_code === selectedDiscipline.code);
  }, [selectedDiscipline, sections]);

>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
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
<<<<<<< HEAD
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
=======
          <p className="text-muted-foreground">
            Marque as disciplinas cursadas para ver quais estão disponíveis
          </p>
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
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

<<<<<<< HEAD
=======
        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('flowchart')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                viewMode === 'flowchart'
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              Por Semestre
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                viewMode === 'grid'
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              Grade
            </button>
          </div>
        </div>

>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
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
<<<<<<< HEAD
        {loadingProgramCourses || loadingAllCourses ? (
=======
        {isLoading ? (
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
<<<<<<< HEAD
        ) : courses.length > 0 ? (
          // NOVA visão 100% alinhada ao programa: só obrigatórias do programa agrupadas por semestre
          <div className="space-y-6">
            {semestresObrigatorios.map((semester) => {
              const obrigatoriasNoSemestre = obrigatoriasAgrupadasPorSemestre[semester] || [];
              if (!obrigatoriasNoSemestre.length) return null;
=======
        ) : viewMode === 'flowchart' ? (
          /* Flowchart View - Vertical (each row is a semester) */
          <div className="space-y-6">
            {semesters.map((semester) => {
              const semesterCourses = coursesBySemester[semester] || [];
              const filteredSemesterCourses = semesterCourses.filter(c => {
                const searchMatch = 
                  c.name.toLowerCase().includes(search.toLowerCase()) ||
                  c.code.toLowerCase().includes(search.toLowerCase());
                if (!searchMatch) return false;
                
                if (activeFilter === 'obrigatoria' && c.type !== 'obrigatoria') return false;
                if (activeFilter === 'optativa' && c.type !== 'optativa') return false;
                if (activeFilter === 'completed' && !completedDisciplines.includes(c.code)) return false;
                if (activeFilter === 'available' && !canTake(c.code)) return false;
                
                return true;
              });

              if (filteredSemesterCourses.length === 0) return null;

>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
              return (
                <div key={semester} className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                    {semester}º Semestre
                  </h3>
<<<<<<< HEAD
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
=======
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredSemesterCourses.map((course) => {
                      const completed = completedDisciplines.includes(course.code);
                      const available = canTake(course.code);
                      const blocked = !completed && !available;

                      return (
                        <button
                          key={course.code}
                          onClick={() => !blocked ? toggleCompletedDiscipline(course.code) : setSelectedDiscipline(course)}
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
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
<<<<<<< HEAD
                          )}>{course.name}</p>
                          {(course.prerequisites?.length || 0) > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">
                              Pré-req: {course.prerequisites?.join(', ')}
=======
                          )}>
                            {course.name}
                          </p>
                          {course.prerequisites.length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">
                              Pré-req: {course.prerequisites.join(', ')}
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
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
<<<<<<< HEAD
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma obrigatória encontrada para esse curso
            </p>
          </div>
=======
          /* Grid View */
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredCourses.length} disciplina{filteredCourses.length !== 1 ? 's' : ''} encontrada{filteredCourses.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((discipline) => (
                <DisciplineCard
                  key={discipline.code}
                  discipline={discipline}
                  onClick={() => setSelectedDiscipline(discipline)}
                />
              ))}
            </div>
          </>
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
        )}

        {/* Empty state */}
        {!isLoading && filteredCourses.length === 0 && viewMode === 'grid' && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma disciplina encontrada com os filtros selecionados
            </p>
          </div>
        )}

<<<<<<< HEAD
        {/* Detail drawer/modal */}
        {selectedDisciplineCode &&
          <NewDisciplineModal
            key={selectedDisciplineCode}
            code={selectedDisciplineCode}
            onClose={() => setSelectedDisciplineCode(null)}
          />
        }
=======
        {/* Detail drawer */}
        {selectedDiscipline && (
          <DisciplineDetail
            discipline={selectedDiscipline}
            sections={selectedSections}
            onClose={() => setSelectedDiscipline(null)}
          />
        )}
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
      </div>
    </MainLayout>
  );
};

export default Disciplinas;
