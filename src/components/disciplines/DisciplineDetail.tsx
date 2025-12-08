import { X, Clock, Users, MapPin, Plus, AlertCircle } from 'lucide-react';
import { Discipline } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface DisciplineDetailProps {
  discipline: Discipline;
  onClose: () => void;
}

export function DisciplineDetail({ discipline, onClose }: DisciplineDetailProps) {
  const { scheduledItems, addToSchedule } = useApp();

  const handleAddClass = (classInfo: typeof discipline.classes[0]) => {
    const isAlreadyAdded = scheduledItems.some(
      item => item.disciplineCode === discipline.code && item.classCode === classInfo.code
    );

    if (isAlreadyAdded) {
      toast({
        title: "Turma já adicionada",
        description: `${discipline.name} (${classInfo.code}) já está no seu planejador.`,
        variant: "destructive"
      });
      return;
    }

    // Parse schedule to get day and time
    const scheduleMatch = classInfo.schedule.match(/(\w+\/\w+)\s+(\d+:\d+)-(\d+:\d+)/);
    if (scheduleMatch) {
      const [, days, startTime, endTime] = scheduleMatch;
      const dayList = days.split('/');
      
      dayList.forEach(day => {
        addToSchedule({
          disciplineCode: discipline.code,
          disciplineName: discipline.name,
          classCode: classInfo.code,
          professor: classInfo.professor,
          schedule: classInfo.schedule,
          color: '',
          day: day,
          startTime,
          endTime
        });
      });
    }

    toast({
      title: "Turma adicionada!",
      description: `${discipline.name} (${classInfo.code}) foi adicionada ao planejador.`,
    });
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-end">
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
          <div>
            <h3 className="font-semibold text-card-foreground mb-2">Ementa</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {discipline.description}
            </p>
          </div>

          {/* Prerequisites */}
          {discipline.prerequisites.length > 0 && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Pré-requisitos</h3>
              <div className="flex flex-wrap gap-2">
                {discipline.prerequisites.map(prereq => (
                  <span
                    key={prereq}
                    className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-sm font-medium cursor-pointer hover:bg-accent transition-colors"
                  >
                    {prereq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Classes */}
          <div>
            <h3 className="font-semibold text-card-foreground mb-3">Turmas Disponíveis</h3>
            <div className="space-y-3">
              {discipline.classes.map((classInfo) => {
                const isFull = classInfo.enrolled >= classInfo.slots;
                const isAlmostFull = classInfo.enrolled >= classInfo.slots * 0.9;
                const isAdded = scheduledItems.some(
                  item => item.disciplineCode === discipline.code && item.classCode === classInfo.code
                );

                return (
                  <div
                    key={classInfo.code}
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
                            Turma {classInfo.code}
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
                          {classInfo.professor}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{classInfo.schedule}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{classInfo.room}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{classInfo.enrolled}/{classInfo.slots}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddClass(classInfo)}
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
                        <span>Poucas vagas restantes</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
