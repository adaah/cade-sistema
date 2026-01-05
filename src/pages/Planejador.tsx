import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ScheduleGrid } from '@/components/planner/ScheduleGrid';
import { ScheduleSummary } from '@/components/planner/ScheduleSummary';
import { MobileSchedule } from '@/components/planner/MobileSchedule';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApp } from '@/contexts/AppContext';
import { Course, Section } from '@/services/api';
import { Clock, Users, Plus, BadgeInfo, AlertTriangle, AlertCircle, Star, Flame, Trash2 } from 'lucide-react';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import { cn, getReservedUnfilledBonus, getReservedUnfilledForTitles } from '@/lib/utils';
import {useMyCourses} from "@/hooks/useMyCourses.ts";
import { fuzzyFilter } from '@/lib/fuzzy';
import { useFavoriteCourses } from '@/hooks/useFavoriteCourses';
import { useFavoriteSections } from '@/hooks/useFavoriteSections';
import { useMySections } from '@/hooks/useMySections';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCompetitionLevel, getPhase1Level, getPhase2Level } from '@/lib/competition';

const Planejador = () => {
  const isMobile = useIsMobile();
  // no scheduledItems here; state moved to useMySections
  const { myPrograms } = useMyPrograms();
  const { courses, isLoading: loadingCourses } = useMyCourses();
  // Não carregar sections.json na tela de planejador
  const sections: Section[] = [];
  const loadingSections = false;

  const [selectedDiscipline, setSelectedDiscipline] = useState<Course | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'M' | 'T' | 'N'>('all');
  const { favoriteCodes } = useFavoriteCourses();
  const { sections: favoriteSections, isLoading: loadingFavSections } = useFavoriteSections(favoriteCodes);
  const { hasSectionOnCourse, toggleSection, getConflictsForSection } = useMySections();
  const myProgramTitles = new Set(myPrograms.map(p => (p.title || '').trim().toLowerCase()));

  // Filtrar turmas do catálogo: somente disciplinas favoritas que ainda não foram selecionadas
  const catalogSections = useMemo(() => {
    const list = Array.isArray(favoriteSections) ? favoriteSections : [];
    const filteredByPeriod = list.filter((s) => {
      const code = s.course?.code || (s as any)?.course_code;
      if (!code) return false;
      return !hasSectionOnCourse(code);
    });
    if (periodFilter === 'all') return filteredByPeriod;
    return filteredByPeriod.filter((s) => {
      const codes = Array.isArray(s.time_codes) ? s.time_codes : [];
      return codes.some((c) => typeof c === 'string' && c.toUpperCase().includes(periodFilter));
    });
  }, [favoriteSections, hasSectionOnCourse]);

  // Sections para a disciplina selecionada serão carregadas pelo DisciplineDetail

  const getCourseStats = (courseCode: string) => {
    const courseSections = sections?.filter(s => ((s as any)?.course?.code || (s as any)?.course_code) === courseCode) || [];
    const totalSpots = courseSections.reduce((sum, s) => sum + ((((s as any).slots ?? 0) - ((s as any).enrolled ?? 0))), 0);
    return { sectionCount: courseSections.length, availableSpots: totalSpots };
  };

  const isLoading = loadingCourses || loadingSections || loadingFavSections;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Planejador de Grade
          </h1>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Monte sua grade horária para o próximo semestre
            </p>
            {myPrograms.length > 0 && (
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
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {/* Minhas Turmas primeiro (invertido) */}
            <ScheduleSummary />

            {/* Catálogo de turmas favoritas */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold text-card-foreground mb-3">Turmas de Disciplinas Favoritas</h3>
              <div className="flex gap-2 mb-3">
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
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
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
                ) : catalogSections.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma Turma Encontrada</p>
                  </div>
                ) : (
                  catalogSections.map((s) => {
                    const disciplineCode = s.course?.code || (s as any)?.course_code || '';
                    const disciplineName = s.course?.name || disciplineCode;
                    const teachers = Array.isArray((s as any)?.teachers) ? (s as any).teachers : ((s as any)?.professor ? [(s as any).professor] : []);
                    const timeCodes = Array.isArray(s.time_codes) ? s.time_codes : [];
                    const course = courses?.find(c => c.code === disciplineCode);
                    const alternatives = Math.max(0, ((course?.sections_count ?? 1) - 1));
                    const seatsAccepted = (s as any)?.seats_accepted ?? 0;
                    const seatsCount = (s as any)?.seats_count ?? 0;
                    const progress = seatsCount > 0 ? Math.min(100, Math.max(0, Math.round((seatsAccepted / seatsCount) * 100))) : 0;
                    const seatsRequested = (s as any)?.seats_requested ?? 0;
                    const seatsRerequested = (s as any)?.seats_rerequested ?? 0;
                    const competition = getCompetitionLevel(seatsCount, seatsRequested, seatsRerequested);
                    const compPhase1 = getPhase1Level(seatsCount, seatsRequested);
                    const compPhase2 = getPhase2Level(seatsCount, seatsAccepted, seatsRerequested);

                    return (
                      <div key={`fav-${disciplineCode}-${s.id_ref}`} className="p-3 rounded-lg border border-border bg-muted/40">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-primary">{disciplineCode}</span>
                            </div>
                            <p className="font-medium text-card-foreground truncate">{disciplineName}</p>

                            <div className="mt-1 space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span className="truncate">{teachers.length > 0 ? teachers.join(', ') : 'Professor(es) a definir'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span className="truncate">{timeCodes.length > 0 ? timeCodes.join(', ') : 'Horário a definir'}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSection(s as any)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                            aria-label="Adicionar turma"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Vagas preenchidas</span>
                              <span>{seatsAccepted}/{seatsCount}</span>
                            </div>
                            <Progress value={progress} />
                            
                            {/* Tags moved to bottom, allow wrap */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {alternatives > 0 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent text-accent-foreground border border-border whitespace-nowrap">
                                  + {alternatives} alternativa{alternatives > 1 ? 's' : ''}
                                </span>
                              )}
                              {(() => {
                                const conflicts = getConflictsForSection(s);
                                const available = Math.max(0, seatsCount - seatsAccepted);
                                const isAlmostFull = available > 0 && available <= 5;
                                const hasExclusive = Array.isArray((s as any)?.spots_reserved) && ((s as any).spots_reserved as any[]).some(r => {
                                  const t = ((r as any)?.program?.title || '').trim().toLowerCase();
                                  return t && myProgramTitles.has(t);
                                });
                                const bonus = getReservedUnfilledBonus(s as any);
                                const reservedMine = getReservedUnfilledForTitles(s as any, myProgramTitles);
                                return (
                                  <>
                                    {conflicts.length > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground inline-flex items-center gap-1 cursor-default">
                                              <AlertTriangle className="w-3 h-3" /> Conflito
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div>Há choque de horário com outra turma selecionada.</div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {isAlmostFull && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1 cursor-default bg-indigo-600 text-white">
                                              <Flame className="w-3 h-3" /> Poucas Vagas
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div>Restam poucas vagas disponíveis nesta turma.</div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {hasExclusive && reservedMine > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary text-primary-foreground inline-flex items-center gap-1 cursor-default">
                                              <Star className="w-3 h-3" /> Reservado ({reservedMine})
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div>Vagas reservadas ao(s) seu(s) programa(s) selecionado(s).</div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {/* Bônus Lixão oculto temporariamente
                                    {bonus > 0 && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent text-accent-foreground border border-border inline-flex items-center gap-1 cursor-default">
                                        <Trash2 className="w-3 h-3" /> Bônus Lixão ({bonus})
                                      </span>
                                    )}
                                    */}
                                  </>
                                );
                              })()}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap inline-flex items-center gap-1 ${compPhase1.colorClass}`}>
                                      <BadgeInfo className="w-3 h-3" /> Etapa 1: {compPhase1.label} ({seatsRequested})
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div>
                                      <div>Solicitações (Etapa 1): {seatsRequested}</div>
                                      <div>Vagas Totais: {seatsCount}</div>
                                      <div>Razão: {compPhase1.ratio.toFixed(2)}</div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap inline-flex items-center gap-1 ${compPhase2.colorClass}`}>
                                      <BadgeInfo className="w-3 h-3" /> Etapa 2: {compPhase2.label} ({seatsRerequested})
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div>
                                      <div>Solicitações (Etapa 2): {seatsRerequested}</div>
                                      <div>Vagas Remanescentes: {Math.max(0, seatsCount - seatsAccepted)}</div>
                                      <div>Razão: {compPhase2.ratio.toFixed(2)}</div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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
            onClose={() => setSelectedDiscipline(null)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Planejador;
