import { useState, useMemo } from 'react';
import { Search, Check, Lock, AlertCircle } from 'lucide-react';
import { reduce, append } from 'ramda'
import { MainLayout } from '@/components/layout/MainLayout';
import { DisciplineCard } from '@/components/disciplines/DisciplineCard';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useApp } from '@/contexts/AppContext';
import { useSections } from '@/hooks/useApi';
import { useMyCourses } from '@/hooks/useMyCourses';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import { Course } from '@/services/api';
import {cn, getSemesterTitle} from '@/lib/utils';
import { fuzzyFilter } from '@/lib/fuzzy';

const Disciplinas = () => {
  const { completedDisciplines, toggleCompletedDiscipline } = useApp();
  const { myPrograms } = useMyPrograms();
  const { courses, isLoading, levels } = useMyCourses();

  const selectedProgram = myPrograms.find(Boolean);
  
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSemester, setActiveSemester] = useState<number | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Course | null>(null);

  const coursesByLevel = useMemo(
      () =>
          reduce<Course, Record<string, Course[]>>((acc, course) => {
            const level = course.level
            acc[level] = append(course, acc[level] ?? []);
            return acc;
          }, {}, courses),
      [courses]
  );


  const canTake = (code: string): boolean => {
    const course = courses?.find(c => c.code === code);
    if (!course) return false;
    if (completedDisciplines.includes(code)) return false;
    const prerequisites = [];
    return prerequisites.every(prereq => completedDisciplines.includes(prereq));
  };

  // Sections são carregadas internamente pelo DisciplineDetail

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Catálogo de Disciplinas
          </h1>
          {myPrograms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {myPrograms.map((p) => (
                <span
                  key={p.id_ref}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-foreground"
                >
                  {p.title}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle className="w-4 h-4" />
              <p className="text-muted-foreground">
                Selecione um curso nas configurações para ver apenas as disciplinas do seu curso
              </p>
            </div>
          )}
        </div>

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

        <div className="flex flex-wrap gap-2 mb-6">
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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-6">
            {(() => {
              const optCheck = (l: string) => /optat/i.test(l);
              const orderedLevels = [
                ...levels.filter((l) => !optCheck(l)),
                ...levels.filter((l) => optCheck(l)),
              ];
              return orderedLevels;
            })().map((level) => {
              const semesterCourses = coursesByLevel[level] || [];
              const searched = fuzzyFilter(semesterCourses, search, ['name', 'code']);
              const filteredSemesterCourses = searched.filter(c => {
                const typeNorm = (c.type || '').toString().toLowerCase();
                if (activeFilter === 'obrigatoria' && !typeNorm.includes('obrig')) return false;
                if (activeFilter === 'optativa' && !typeNorm.includes('optat')) return false;
                if (activeFilter === 'completed' && !completedDisciplines.includes(c.code)) return false;
                if (activeFilter === 'available' && !canTake(c.code)) return false;
                return true;
              });

              if (filteredSemesterCourses.length === 0) return null;

              return (
                <div key={level} className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                    {getSemesterTitle(level)}
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredSemesterCourses.map((course) => {
                      const completed = completedDisciplines.includes(course.code);
                      const available = canTake(course.code);
                      const blocked = !completed && !available;

                      return (
                        <DisciplineCard
                          key={course.code}
                          discipline={course}
                          available={available}
                          blocked={blocked}
                          onClick={() => setSelectedDiscipline(course)}
                        />
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
              Nenhuma disciplina encontrada
            </p>
          </div>
        )}

        {selectedDiscipline && (
          <DisciplineDetail
            discipline={selectedDiscipline}
            onClose={() => setSelectedDiscipline(null)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Disciplinas;
