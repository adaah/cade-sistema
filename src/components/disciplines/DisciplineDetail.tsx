import { X, Clock, Users, Plus, AlertCircle, Check, User } from 'lucide-react';
import { Course, parseSigaaSchedule } from '@/services/api';
import type { Section } from '@/services/api';
import { useCourseSections } from '@/hooks/useApi';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface DisciplineDetailProps {
  discipline: Course;
  onClose: () => void;
}

export function DisciplineDetail({ discipline, onClose }: DisciplineDetailProps) {
  const { scheduledItems, addToSchedule, completedDisciplines, toggleCompletedDiscipline } = useApp();
  const { data: sections = [], isLoading } = useCourseSections(discipline?.code);

  const handleAddClass = (section: Section) => {
    const isAlreadyAdded = scheduledItems.some(
      item => item.disciplineCode === discipline.code && item.classCode === section.section_code
    );

    if (isAlreadyAdded) {
      toast({
        title: "Turma já adicionada",
        description: `${discipline.name} (${section.section_code}) já está no seu planejador.`,
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
          disciplineCode: discipline.code,
          disciplineName: discipline.name,
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
        description: `${discipline.name} (${section.section_code}) foi adicionada ao planejador.`,
      });
    } else {
      const timeCodes = Array.isArray((section as any)?.time_codes) ? (section as any).time_codes.join(', ') : null;
      addToSchedule({
        disciplineCode: discipline.code,
        disciplineName: discipline.name,
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
        description: `${discipline.name} (${section.section_code}) foi adicionada. Horário não disponível.`,
        variant: "default"
      });
    }
  };

  const isCompleted = completedDisciplines.includes(discipline.code);

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-end">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-card shadow-elevated animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <span
            className={cn(
              "inline-block px-3 py-1 rounded-lg text-sm font-semibold mb-3",
              (discipline as any).type === 'obrigatoria'
                ? "bg-primary/10 text-primary"
                : (discipline as any).type
                ? "bg-warning/10 text-warning"
                : "bg-muted text-muted-foreground"
            )}
          >
            {discipline.code}
          </span>
          
          <h2 className="text-xl font-bold text-card-foreground pr-10">
            {discipline.name}
          </h2>

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {typeof (discipline as any).workload === 'number' && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{(discipline as any).workload}h</span>
              </div>
            )}
            {typeof (discipline as any).credits === 'number' && (
              <span>{(discipline as any).credits} créditos</span>
            )}
            {(discipline as any).semester && <span>{(discipline as any).semester}º Semestre</span>}
          </div>

          <button
            onClick={() => toggleCompletedDiscipline(discipline.code)}
            className={cn(
              "mt-4 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              isCompleted
                ? "bg-success text-success-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Check className="w-4 h-4" />
            {isCompleted ? 'Cursada' : 'Marcar como cursada'}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {discipline.description && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Ementa</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {discipline.description}
              </p>
            </div>
          )}

          {(discipline.prerequisites?.length || 0) > 0 && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Pré-requisitos</h3>
              <div className="flex flex-wrap gap-2">
                {discipline.prerequisites?.map((prereq, idx) => (
                  <span
                    key={`${prereq}-${idx}`}
                    className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-sm font-medium"
                  >
                    {prereq}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-card-foreground mb-3">
              Turmas Disponíveis ({sections.length})
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border-2 border-border bg-muted/50 animate-pulse">
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
              <p className="text-muted-foreground text-sm">
                Nenhuma turma disponível para esta disciplina no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {sections.map((section, idx) => {
                  const seatsCount = (section as any)?.seats_count ?? (section.slots ?? 0);
                  const seatsAccepted = (section as any)?.seats_accepted ?? (section.enrolled ?? 0);
                  const available = seatsCount - seatsAccepted;
                  const isFull = available <= 0;
                  const isAlmostFull = available > 0 && available <= 5;
                  const isAdded = scheduledItems.some(
                    item => item.disciplineCode === discipline.code && item.classCode === section.section_code
                  );

                  return (
                    <div
                      key={`${section.course_code || discipline.code}-${section.section_code || idx}`}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        isFull ? "border-destructive/50 bg-destructive/5" :
                        isAlmostFull ? "border-warning/50 bg-warning/5" :
                        isAdded ? "border-success/50 bg-success/5" :
                        "border-border bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-card-foreground">
                              Turma {section.section_code}
                            </span>
                            {isFull && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-destructive text-destructive-foreground">
                                Lotada
                              </span>
                            )}
                            {isAdded && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-success text-success-foreground">
                                Adicionada
                              </span>
                            )}
                          </div>
                          
                          <div className="mb-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span className="truncate block">
                                {Array.isArray((section as any)?.teachers) && (section as any)?.teachers.length > 0
                                  ? (section as any).teachers.join(', ')
                                  : (section.professor || 'Professor(es) a definir')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {section.schedule_raw
                                    || (Array.isArray((section as any)?.time_codes) && (section as any).time_codes.length > 0
                                          ? (section as any).time_codes.join(', ')
                                          : 'Horário a definir')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{seatsAccepted}/{seatsCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddClass(section)}
                          disabled={isFull || isAdded}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                            isFull || isAdded
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
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
          </div>
        </div>
      </div>
    </div>
  );
}
