import { useState, useMemo, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { reduce, append } from 'ramda'
import { MainLayout } from '@/components/layout/MainLayout';
import { DisciplineCard } from '@/components/disciplines/DisciplineCard';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useApp } from '@/contexts/AppContext';
import { useCourses as useAllCourses, useSections } from '@/hooks/useApi';
import { useMyCourses } from '@/hooks/useMyCourses';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import {Course, CourseApi} from '@/services/api';
import {cn, getSemesterTitle} from '@/lib/utils';
import { fuzzyFilter } from '@/lib/fuzzy';
import { useMode } from '@/hooks/useMode';
import { useFavoriteCourses } from '@/hooks/useFavoriteCourses';
import { useFilter } from '@/hooks/useFilter';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Disciplinas = () => {
  const { completedDisciplines, toggleCompletedDiscipline } = useApp();
  const { myPrograms } = useMyPrograms();
  const { courses, isLoading, levels } = useMyCourses();
  const { isSimplified, isFull } = useMode();
  const { isFavorite, favoriteCodes } = useFavoriteCourses();

  const selectedProgram = myPrograms.find(Boolean);
  
  const [search, setSearch] = useState('');
  // search, semester and modal states
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

  // Type group (exclusive): all | obrigatoria | optativa
  const [typeFilter, setTypeFilter] = useState<'all' | 'obrigatoria' | 'optativa' | 'geral'>('all');

  // Multi-select filters (AND). Exclude type-related ones from this list.
  const filters = [
    ...(isFull ? [{ id: 'available', label: 'Disponíveis' }] as const : []),
    ...(!isSimplified ? [{ id: 'completed', label: 'Cursadas' }] as const : []),
    { id: 'not_completed', label: 'Não Concluídas' },
    { id: 'favorites', label: 'Favoritos' },
    { id: 'offered', label: 'Ofertada' },
  ];

  // Build rules map for useFilter (excluding 'favorites' which controls layout)
  const rules = useMemo(() => ({
    completed: (c: Course) => completedDisciplines.includes(c.code),
    not_completed: (c: Course) => !completedDisciplines.includes(c.code),
    available: (c: Course) => canTake(c.code),
    favorites: (c: Course) => favoriteCodes.includes(c.code),
    offered: (c: Course) => (c.sections_count ?? 0) > 0,
  }), [completedDisciplines, favoriteCodes]);

  const { isActive, isOnly, isAll, activeIds, apply, toggle } = useFilter<Course>({ rules });

  // Order select state: 'name' (default) | 'sections'
  const [orderBy, setOrderBy] = useState<'name' | 'sections'>('name');
  // Catálogo global da universidade
  const { data: allCourses = [] } = useAllCourses();
  const [globalLimit, setGlobalLimit] = useState(60);
  useEffect(() => {
    if (typeFilter === 'geral') {
      setGlobalLimit(60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, orderBy, activeIds, typeFilter]);
  
  

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

        <Collapsible defaultOpen={false}>
          <div className="mb-2 flex items-center justify-between gap-3 max-w-[100vw] overflow-x-auto">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-accent text-sm font-medium'
              )}>
                <span>Filtros</span>
                <Badge variant={isAll ? 'outline' : 'secondary'}>
                  {activeIds.length}
                </Badge>
              </CollapsibleTrigger>
              {/* Ordem dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordem:</span>
                <Select value={orderBy} onValueChange={(v: 'name' | 'sections') => setOrderBy(v)}>
                  <SelectTrigger className="h-9 w-auto min-w-[9rem] rounded-xl border border-border bg-card hover:bg-accent text-sm font-medium px-3">
                    <SelectValue placeholder="Por Nome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sections">Por Turmas</SelectItem>
                    <SelectItem value="name">Por Nome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="inline-flex items-stretch text-sm shrink-0">
              {([
                { id: 'all', label: 'Todos' },
                { id: 'obrigatoria', label: 'Obrigatórias' },
                { id: 'optativa', label: 'Optativas' },
                { id: 'geral', label: 'Global' },
              ] as const).map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setTypeFilter(b.id)}
                  className={cn(
                    'px-2.5 py-1.5 border border-border -ml-px first:ml-0',
                    idx === 0 ? 'rounded-l-xl' : '',
                    idx === 3 ? 'rounded-r-xl' : '',
                    typeFilter === b.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <CollapsibleContent>
            <div className="flex flex-wrap gap-2 mb-6 p-1 max-w-[100vw]">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all",
                    isActive(f.id)
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {!isSimplified && (
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
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : typeFilter === 'geral' ? (
          <div className="space-y-6">
            <motion.div
              key="catalogo-geral"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <h3 className="font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                Catálogo Global
              </h3>
              {(() => {
                const searched = fuzzyFilter<CourseApi>(allCourses, search, ['name', 'code']);
                let filtered = apply(searched);
                // Ordenação
                filtered = [...filtered].sort((a, b) => {
                  if (orderBy === 'sections') {
                    const diff = (b.sections_count ?? 0) - (a.sections_count ?? 0);
                    if (diff !== 0) return diff;
                    return a.name.localeCompare(b.name);
                  }
                  return a.name.localeCompare(b.name);
                });
                const total = filtered.length;
                const items = filtered.slice(0, globalLimit);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                      {items.map((course) => (
                        <motion.div
                          key={course.code}
                          layout
                          layoutId={`course-${course.code}`}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        >
                          <DisciplineCard
                            discipline={course}
                            available={true}
                            blocked={false}
                            onClick={() => setSelectedDiscipline(course)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {globalLimit < total && (
                      <div className="col-span-2 md:col-span-3 flex justify-center mt-2">
                        <Button
                          variant="secondary"
                          className="rounded-xl"
                          onClick={() => setGlobalLimit((v) => Math.min(v + 60, total))}
                        >
                          Mostrar mais ({Math.max(0, total - globalLimit)})
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
            {(() => {
              const optCheck = (l: string) => /optat/i.test(l);
              const orderedLevels = [
                ...levels.filter((l) => !optCheck(l)),
                ...levels.filter((l) => optCheck(l)),
              ];
              return orderedLevels;
            })().map((level) => {
              const semesterCourses = coursesByLevel[level] || [];
              const searched = fuzzyFilter<CourseApi>(semesterCourses, search, ['name', 'code']);
              // Apply AND filters (favorites, completed, available, etc.)
              let filteredSemesterCourses = apply(searched);
              // Apply type group (exclusive)
              if (typeFilter !== 'all') {
                const matchKey = typeFilter === 'obrigatoria' ? 'obrig' : 'optat';
                filteredSemesterCourses = filteredSemesterCourses.filter((c) =>
                  (c.type || '').toString().toLowerCase().includes(matchKey),
                );
              }
              // Apply ordering
              filteredSemesterCourses = [...filteredSemesterCourses].sort((a, b) => {
                if (orderBy === 'sections') {
                  const diff = (b.sections_count ?? 0) - (a.sections_count ?? 0);
                  if (diff !== 0) return diff;
                  return a.name.localeCompare(b.name);
                }
                return a.name.localeCompare(b.name);
              });

              if (filteredSemesterCourses.length === 0) return null;

              return (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <h3 className="font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                    {getSemesterTitle(level)}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                    {filteredSemesterCourses.map((course) => {
                      const completed = completedDisciplines.includes(course.code);
                      const available = canTake(course.code);
                      const blocked = !completed && !available;
                      const availableProp = isSimplified ? true : available;
                      const blockedProp = isSimplified ? false : blocked;

                      return (
                        <motion.div
                          key={course.code}
                          layout
                          layoutId={`course-${course.code}`}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        >
                          <DisciplineCard
                            discipline={course}
                            available={availableProp}
                            blocked={blockedProp}
                            onClick={() => setSelectedDiscipline(course)}
                          />
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
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
