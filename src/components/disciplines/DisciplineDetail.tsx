import { X, Clock, Users, MapPin, Plus, AlertCircle } from 'lucide-react';
import { Course, Section, parseSigaaSchedule } from '@/services/api';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
<<<<<<< HEAD
import { useQuery } from '@tanstack/react-query';
import { fetchCourseDetail } from '@/services/api';
import { useCourseByCode, useCourseDetail, useCourseSections } from '@/hooks/useApi';

interface DisciplineDetailProps {
  code: string;
  onClose: () => void;
}

export function DisciplineDetail({ code, onClose }: DisciplineDetailProps) {
  // Busca summary para pegar o detail_url
  const { data: summary, isLoading: loadingSummary } = useCourseByCode(code);
  // Busca os detalhes completos
  const { data: detail, isLoading: loadingDetail } = useCourseDetail(summary?.detail_url);
  // Busca as turmas
  const { data: sections, isLoading: loadingSections } = useCourseSections(code);
  const { completedDisciplines, toggleCompletedDiscipline } = useApp();

  // loading
  if (loadingSummary || loadingDetail) {
    return (
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="w-full max-w-lg bg-card p-10 rounded-xl">
          <p className="text-center">Carregando detalhes...</p>
        </div>
      </div>
    )
  }
  if (!detail) return null;

  const handleAddClass = (section: Section) => {
    const isAlreadyAdded = sections?.some(
      item => item.section_code === section.section_code
=======

interface DisciplineDetailProps {
  discipline: Course;
  sections: Section[];
  onClose: () => void;
}

export function DisciplineDetail({ discipline, sections, onClose }: DisciplineDetailProps) {
  const { scheduledItems, addToSchedule } = useApp();

  const handleAddClass = (section: Section) => {
    const isAlreadyAdded = scheduledItems.some(
      item => item.disciplineCode === discipline.code && item.classCode === section.section_code
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
    );

    if (isAlreadyAdded) {
      toast({
        title: "Turma já adicionada",
<<<<<<< HEAD
        description: `${detail?.name} (${section.section_code}) já está no seu planejador.`,
=======
        description: `${discipline.name} (${section.section_code}) já está no seu planejador.`,
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
        variant: "destructive"
      });
      return;
    }

    // Parse schedule
    let schedules = section.schedule;
    
    // If no schedule, try to parse from raw
    if ((!schedules || schedules.length === 0) && section.schedule_raw) {
      schedules = parseSigaaSchedule(section.schedule_raw);
    }

    if (schedules && schedules.length > 0) {
      schedules.forEach(sched => {
<<<<<<< HEAD
        // Assuming addToSchedule is still available or needs to be re-added
        // For now, we'll just toast, as the original code had it removed.
        // If addToSchedule is meant to be re-added, it needs to be imported or re-added.
        // For now, we'll keep the original logic for adding classes, but the context is gone.
        // This part of the logic might need to be re-evaluated based on the new structure.
        // For now, we'll just toast.
        toast({
          title: "Turma adicionada!",
          description: `${detail?.name} (${section.section_code}) foi adicionada ao planejador.`,
=======
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
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
        });
      });

      toast({
        title: "Turma adicionada!",
<<<<<<< HEAD
        description: `${detail?.name} (${section.section_code}) foi adicionada. Horário não disponível.`,
        variant: "default"
      });
    } else {
      // Add without schedule info
      // This part of the logic might need to be re-evaluated based on the new structure.
      // For now, we'll just toast.
      toast({
        title: "Turma adicionada!",
        description: `${detail?.name} (${section.section_code}) foi adicionada. Horário não disponível.`,
=======
        description: `${discipline.name} (${section.section_code}) foi adicionada ao planejador.`,
      });
    } else {
      // Add without schedule info
      addToSchedule({
        disciplineCode: discipline.code,
        disciplineName: discipline.name,
        classCode: section.section_code,
        professor: section.professor,
        schedule: 'Horário a definir',
        color: '',
        day: 'Seg',
        startTime: '08:00',
        endTime: '10:00'
      });

      toast({
        title: "Turma adicionada!",
        description: `${discipline.name} (${section.section_code}) foi adicionada. Horário não disponível.`,
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
        variant: "default"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-end">
<<<<<<< HEAD
      <div className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-lg h-full bg-card shadow-elevated animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
          <span className={cn(
            "inline-block px-3 py-1 rounded-lg text-sm font-semibold mb-3",
            (detail?.type ?? summary?.type) === 'obrigatoria'
              ? "bg-primary/10 text-primary"
              : "bg-warning/10 text-warning"
          )}>{detail.code}</span>
          <h2 className="text-xl font-bold text-card-foreground pr-10">{detail?.name ?? summary?.name}</h2>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{detail?.workload ?? summary?.workload}h</span>
            </div>
            <span>{detail?.credits} créditos</span>
            <span>{detail?.semester}º Semestre</span>
          </div>
          <button onClick={() => toggleCompletedDiscipline(detail.code)}
            className={cn(
              "mt-4 px-4 py-2 rounded-lg font-semibold transition-all",
              completedDisciplines.includes(detail.code)
                ? "bg-success text-success-foreground border border-success"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {completedDisciplines.includes(detail.code) ? 'Cursada' : 'Marcar como cursada'}
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Descrição */}
          {detail?.description && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Ementa</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{detail.description}</p>
            </div>
          )}
          {/* Equivalentes */}
          {detail?.equivalents?.length > 0 && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Equivalentes</h3>
              <div className="flex flex-wrap gap-2">
                {detail.equivalents.map((eq: string) => (
                  <button key={eq} className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-sm font-medium underline" onClick={()=>window.open(`/disciplinas?code=${eq}`)}>{eq}</button>
                ))}
              </div>
            </div>
          )}
          {/* Pré-requisitos */}
          {(detail?.prerequisites?.length ?? 0) > 0 && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Pré-requisitos</h3>
              <div className="flex flex-wrap gap-2">
                {detail.prerequisites.map((pr: string) => (
                  <span key={pr} className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-sm font-medium">{pr}</span>
=======
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg h-full bg-card shadow-elevated animate-slide-in-right overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <span className={cn(
            "inline-block px-3 py-1 rounded-lg text-sm font-semibold mb-3",
            discipline.type === 'obrigatoria'
              ? "bg-primary/10 text-primary"
              : "bg-warning/10 text-warning"
          )}>
            {discipline.code}
          </span>
          
          <h2 className="text-xl font-bold text-card-foreground pr-10">
            {discipline.name}
          </h2>

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{discipline.workload}h</span>
            </div>
            <span>{discipline.credits} créditos</span>
            <span>{discipline.semester}º Semestre</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {discipline.description && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Ementa</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {discipline.description}
              </p>
            </div>
          )}

          {/* Prerequisites */}
          {discipline.prerequisites.length > 0 && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Pré-requisitos</h3>
              <div className="flex flex-wrap gap-2">
                {discipline.prerequisites.map(prereq => (
                  <span
                    key={prereq}
                    className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-sm font-medium"
                  >
                    {prereq}
                  </span>
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
                ))}
              </div>
            </div>
          )}
<<<<<<< HEAD
          {/* Disciplinas liberadas */}
          {detail?.libera?.length > 0 && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Libera</h3>
              <div className="flex flex-wrap gap-2">
                {detail.libera.map((lib: string) => (
                  <button key={lib} className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-sm font-medium underline" onClick={()=>window.open(`/disciplinas?code=${lib}`)}>{lib}</button>
                ))}
              </div>
            </div>
          )}
          {/* Turmas disponíveis */}
          <div>
            <h3 className="font-semibold text-card-foreground mb-3">
              Turmas Disponíveis ({sections?.length || 0})
            </h3>
            {loadingSections ? (
              <p className="text-muted-foreground text-sm">Carregando turmas...</p>
            ) : !sections?.length ? (
              <p className="text-muted-foreground text-sm">Nenhuma turma disponível para esta disciplina no momento.</p>
            ) : (
              <div className="space-y-3">
                {sections?.map((section) => {
                  const isFull = section.available <= 0;
                  const isAlmostFull = section.available > 0 && section.available <= 5;
                  const isAdded = sections?.some(
                    item => item.section_code === section.section_code
=======

          {/* Classes */}
          <div>
            <h3 className="font-semibold text-card-foreground mb-3">
              Turmas Disponíveis ({sections.length})
            </h3>
            
            {sections.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma turma disponível para esta disciplina no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {sections.map((section) => {
                  const isFull = section.available <= 0;
                  const isAlmostFull = section.available > 0 && section.available <= 5;
                  const isAdded = scheduledItems.some(
                    item => item.disciplineCode === discipline.code && item.classCode === section.section_code
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
                  );

                  return (
                    <div
                      key={section.section_code}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        isFull ? "border-destructive/50 bg-destructive/5" :
                        isAlmostFull ? "border-warning/50 bg-warning/5" :
                        isAdded ? "border-success/50 bg-success/5" :
                        "border-border bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
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
                          
                          <p className="text-sm text-muted-foreground mb-1">
                            {section.professor}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{section.schedule_raw || 'Horário a definir'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{section.room}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{section.enrolled}/{section.slots} ({section.available} vagas)</span>
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
                          <span>Poucas vagas restantes ({section.available})</span>
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
