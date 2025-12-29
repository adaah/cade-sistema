import { X, Clock, Users, Plus, AlertCircle, Check, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Course, parseSigaaSchedule } from '@/services/api';
import type { Section } from '@/services/api';
import { useCourseSections, useCourseByCode, useCourses } from '@/hooks/useApi';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useFavoriteCourses } from '@/hooks/useFavoriteCourses';
import { useEffect, useState } from 'react';
import { LargeDisciplineCard } from '@/components/disciplines/LargeDisciplineCard';
import { BreadcrumbTags } from '@/components/disciplines/BreadcrumbTags';
import { Badge } from '@/components/ui/badge';

interface DisciplineDetailProps {
  discipline: Course;
  onClose: () => void;
}

export function DisciplineDetail({ discipline, onClose }: DisciplineDetailProps) {
  const { scheduledItems, addToSchedule, completedDisciplines, toggleCompletedDiscipline } = useApp();
  // Estado local para navegação dentro do drawer
  const [stack, setStack] = useState<{ code: string }[]>([{ code: discipline.code }]);
  const currentCode = stack[stack.length - 1]?.code || discipline.code;

  const { data: sections = [], isLoading } = useCourseSections(currentCode);
  const { data: currentDetail } = useCourseByCode(currentCode);
  const { data: allCourses = [] } = useCourses();
  const currentName = currentDetail?.name ?? discipline.name;

  // estados de colapso
  const [openClasses, setOpenClasses] = useState(false);
  const [openPrereq, setOpenPrereq] = useState(false);
  const [openCoreq, setOpenCoreq] = useState(false);
  const [openEquiv, setOpenEquiv] = useState(false);

  // seleção de opção para arrays de arrays
  const [prereqOptionIndex, setPrereqOptionIndex] = useState(0);
  const [coreqOptionIndex, setCoreqOptionIndex] = useState(0);

  // quando o discipline externo muda (abrir novo drawer), resetar stack
  useEffect(() => {
    setStack([{ code: discipline.code }]);
    setPrereqOptionIndex(0);
    setCoreqOptionIndex(0);
    setOpenClasses(false);
    setOpenPrereq(false);
    setOpenCoreq(false);
    setOpenEquiv(false);
  }, [discipline.code]);

  // Ao navegar para outra disciplina dentro do drawer, colapsar tudo por padrão
  useEffect(() => {
    setOpenClasses(false);
    setOpenPrereq(false);
    setOpenCoreq(false);
    setOpenEquiv(false);
    setPrereqOptionIndex(0);
    setCoreqOptionIndex(0);
  }, [currentCode]);
  const { isFavorite, toggleFavorite } = useFavoriteCourses();

  const handleAddClass = (section: Section) => {
    const isAlreadyAdded = scheduledItems.some(
      (item) => item.disciplineCode === currentCode && item.classCode === section.section_code,
    );

    if (isAlreadyAdded) {
      toast({
        title: "Turma já adicionada",
        description: `${currentName} (${section.section_code}) já está no seu planejador.`,
        variant: "destructive"
      });
      return;
    }

    let schedules = section.schedule;
    
    if ((!schedules || schedules.length === 0) && section.schedule_raw) {
      schedules = parseSigaaSchedule(section.schedule_raw);
    }

    if (schedules && schedules.length > 0) {
      schedules.forEach(sched => {
        addToSchedule({
          disciplineCode: currentCode,
          disciplineName: currentName,
          classCode: section.section_code,
          professor: section.professor,
          schedule: section.schedule_raw || `${sched.day} ${sched.start_time}-${sched.end_time}`,
          color: '',
          day: sched.day,
          startTime: sched.start_time,
          endTime: sched.end_time
        });
      });

      toast({
        title: "Turma adicionada!",
        description: `${currentName} (${section.section_code}) foi adicionada ao planejador.`,
      });
    } else {
      const timeCodes = Array.isArray((section as any)?.time_codes) ? (section as any).time_codes.join(', ') : null;
      addToSchedule({
        disciplineCode: currentCode,
        disciplineName: currentName,
        classCode: section.section_code,
        professor: section.professor,
        schedule: timeCodes || 'Horário a definir',
        color: '',
        day: 'Seg',
        startTime: '08:00',
        endTime: '10:00'
      });

      toast({
        title: "Turma adicionada!",
        description: `${currentName} (${section.section_code}) foi adicionada. Horário não disponível.`,
        variant: "default"
      });
    }
  };

  const isCompleted = completedDisciplines.includes(currentCode);

  // Local UI components (small and focused)
  const SectionHeader = ({
    title,
    count,
    open,
    onToggle,
  }: { title: string; count?: number; open: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3
          className="font-semibold text-card-foreground cursor-pointer select-none"
          onClick={onToggle}
        >
          {title}
        </h3>
        {typeof count === 'number' && (
          <Badge variant="secondary" className="px-2 py-0.5">
            {count}
          </Badge>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:bg-muted"
        aria-label={open ? 'Recolher' : 'Expandir'}
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  );

  const CollapseAnimated: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => (
    <>{open ? <div className="pt-2">{children}</div> : null}</>
  );

  const CompletedButton = ({
    completed,
    onClick,
  }: { completed: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
        completed ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
      )}
    >
      {completed ? <Check className="w-4 h-4" /> : <span className="block w-4 h-4 rounded-full border border-current" />}
      <span>{completed ? 'Cursada' : 'Marcar como cursada'}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-end">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-card shadow-elevated overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-3">
            <BreadcrumbTags
              items={stack}
              onSelectIndex={(idx) => {
                // voltar para um nível do breadcrumb
                setStack((prev) => prev.slice(0, idx + 1));
              }}
            />
          </div>
          
          <div className="flex items-center justify-between gap-3 pr-10">
            <h2 className="text-xl font-bold text-card-foreground">{currentName}</h2>
            <button
              onClick={() => toggleFavorite(currentCode)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isFavorite(currentCode) ? 'text-rose-600 bg-rose-500/10' : 'text-muted-foreground hover:bg-muted',
              )}
              aria-label={isFavorite(currentCode) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={cn('w-5 h-5', isFavorite(currentCode) && 'fill-current')} />
            </button>
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {typeof (currentDetail as any)?.workload === 'number' && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{(currentDetail as any)?.workload}h</span>
              </div>
            )}
            {typeof (currentDetail as any)?.credits === 'number' && (
              <span>{(currentDetail as any)?.credits} créditos</span>
            )}
            {(currentDetail as any)?.semester && <span>{(currentDetail as any)?.semester}º Semestre</span>}
          </div>

          <CompletedButton completed={isCompleted} onClick={() => toggleCompletedDiscipline(currentCode)} />
        </div>

        <div className="p-6 space-y-6">
          {currentDetail?.description && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Ementa</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentDetail.description}
              </p>
            </div>
          )}

          {/* Turmas Disponíveis com collapse */}
          <div className="space-y-3">
            <SectionHeader
              title="Turmas Disponíveis"
              count={sections.length}
              open={openClasses}
              onToggle={() => setOpenClasses((v) => !v)}
            />

            <CollapseAnimated open={openClasses}>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 rounded-xl border-2 border-border bg-muted/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-40 bg-muted rounded" />
                            <div className="h-3 w-48 bg-muted rounded" />
                            <div className="h-3 w-32 bg-muted rounded" />
                          </div>
                          <div className="h-9 w-24 bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sections.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma turma disponível para esta disciplina no momento.</p>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section, idx) => {
                      const seatsCount = (section as any)?.seats_count ?? (section.slots ?? 0);
                      const seatsAccepted = (section as any)?.seats_accepted ?? (section.enrolled ?? 0);
                      const available = seatsCount - seatsAccepted;
                      const isFull = available <= 0;
                      const isAlmostFull = available > 0 && available <= 5;
                      const isAdded = scheduledItems.some(
                        (item) => item.disciplineCode === currentCode && item.classCode === section.section_code,
                      );

                      return (
                        <div
                          key={`${section.course_code || currentCode}-${section.section_code || idx}`}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all',
                            isFull
                              ? 'border-destructive/50 bg-destructive/5'
                              : isAlmostFull
                              ? 'border-warning/50 bg-warning/5'
                              : isAdded
                              ? 'border-success/50 bg-success/5'
                              : 'border-border bg-muted/50',
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-card-foreground text-sm">
                                  {(() => {
                                    const teachers = Array.isArray((section as any)?.teachers)
                                      ? (section as any).teachers
                                      : undefined;
                                    if (teachers && teachers.length > 0) return teachers[0];
                                    return section.professor || `Turma ${section.section_code}`;
                                  })()}
                                </span>
                                {isFull && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-destructive text-destructive-foreground">Lotada</span>
                                )}
                                {isAdded && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-success text-success-foreground">Adicionada</span>
                                )}
                              </div>

                              {(() => {
                                const teachers = Array.isArray((section as any)?.teachers)
                                  ? (section as any).teachers
                                  : undefined;
                                if (teachers && teachers.length > 1) {
                                  const extra = teachers.length - 1;
                                  return (
                                    <div className="mb-2">
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        <span className="truncate block">+ {extra} professor{extra > 1 ? 'es' : ''}</span>
                                      </div>
                                    </div>
                                  );
                                }
                                if (!teachers || teachers.length === 0) {
                                  return (
                                    <div className="mb-2">
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        <span className="truncate block">Professor(es) a definir</span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              <div className="mt-2 pt-2 border-t border-border">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {section.schedule_raw ||
                                        (Array.isArray((section as any)?.time_codes) && (section as any).time_codes.length > 0
                                          ? (section as any).time_codes.join(', ')
                                          : 'Horário a definir')}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>
                                      {seatsAccepted}/{seatsCount}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddClass(section)}
                              disabled={isFull || isAdded}
                              className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                                isFull || isAdded
                                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25',
                              )}
                            >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">Adicionar</span>
                            </button>
                            </div>

                          {isAlmostFull && !isFull && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-warning/30 text-warning text-sm">
                              <AlertCircle className="w-4 h-4" />
                              <span>Poucas vagas restantes ({available})</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </CollapseAnimated>
          </div>

          {/* Pré-requisitos */}
          {(currentDetail?.prerequisites?.length || 0) > 0 && (
            <div className="space-y-3">
              <SectionHeader
                title="Pré-requisitos"
                count={currentDetail?.prerequisites?.length}
                open={openPrereq}
                onToggle={() => setOpenPrereq((v) => !v)}
              />

              <CollapseAnimated open={openPrereq}>
                  {(currentDetail?.prerequisites?.length || 0) > 1 && (
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {currentDetail!.prerequisites!.map((_, i) => (
                        <button
                          key={`pr-option-${i}`}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                            prereqOptionIndex === i
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                              : 'bg-muted text-muted-foreground hover:bg-accent',
                          )}
                          onClick={() => setPrereqOptionIndex(i)}
                        >
                          {`Opção ${i + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {(currentDetail!.prerequisites![prereqOptionIndex] || []).map((pr) => {
                      const synced = !!(pr as any).name;
                      const code = pr.code;
                      const name = (pr as any).name as string | undefined;
                      const summary = allCourses.find((c) => c.code === code) || null;
                      return (
                        <LargeDisciplineCard
                          key={`pre-${code}`}
                          code={code}
                          synced={synced}
                          name={name}
                          summary={summary}
                          onClick={synced ? () => setStack((prev) => [...prev, { code }]) : undefined}
                        />
                      );
                    })}
                  </div>
              </CollapseAnimated>
            </div>
          )}

          {/* Correquisitos */}
          {(currentDetail?.corequisites?.length || 0) > 0 && (
            <div className="space-y-3">
              <SectionHeader
                title="Correquisitos"
                count={currentDetail?.corequisites?.length}
                open={openCoreq}
                onToggle={() => setOpenCoreq((v) => !v)}
              />

              <CollapseAnimated open={openCoreq}>
                  {(currentDetail?.corequisites?.length || 0) > 1 && (
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {currentDetail!.corequisites!.map((_, i) => (
                        <button
                          key={`co-option-${i}`}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                            coreqOptionIndex === i
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                              : 'bg-muted text-muted-foreground hover:bg-accent',
                          )}
                          onClick={() => setCoreqOptionIndex(i)}
                        >
                          {`Opção ${i + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {(currentDetail!.corequisites![coreqOptionIndex] || []).map((co) => {
                      const synced = !!(co as any).name;
                      const code = co.code;
                      const name = (co as any).name as string | undefined;
                      const summary = allCourses.find((c) => c.code === code) || null;
                      return (
                        <LargeDisciplineCard
                          key={`co-${code}`}
                          code={code}
                          synced={synced}
                          name={name}
                          summary={summary}
                          onClick={synced ? () => setStack((prev) => [...prev, { code }]) : undefined}
                        />
                      );
                    })}
                  </div>
              </CollapseAnimated>
            </div>
          )}

          {/* Equivalentes */}
          {(currentDetail?.equivalences?.length || 0) > 0 && (() => {
            // Flatten + dedupe por código
            const flat = (currentDetail?.equivalences || []).flat();
            const seen = new Set<string>();
            const unique = flat.filter((eq) => {
              if (!eq?.code) return false;
              if (seen.has(eq.code)) return false;
              seen.add(eq.code);
              return true;
            });
            if (unique.length === 0) return null;
            return (
              <div className="space-y-3">
                <SectionHeader
                  title="Equivalentes"
                  count={unique.length}
                  open={openEquiv}
                  onToggle={() => setOpenEquiv((v) => !v)}
                />
                <CollapseAnimated open={openEquiv}>
                  <div className="grid grid-cols-1 gap-3">
                    {unique.map((eq) => {
                      const synced = !!(eq as any).name;
                      const code = eq.code;
                      const name = (eq as any).name as string | undefined;
                      const summary = allCourses.find((c) => c.code === code) || null;
                      return (
                        <LargeDisciplineCard
                          key={`eq-${code}`}
                          code={code}
                          synced={synced}
                          name={name}
                          summary={summary}
                          onClick={synced ? () => setStack((prev) => [...prev, { code }]) : undefined}
                        />
                      );
                    })}
                  </div>
                </CollapseAnimated>
              </div>
            );
          })()}
          
        </div>
      </div>
    </div>
  );
}
