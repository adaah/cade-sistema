import { useState } from 'react';
import { X, Clock, Users, MapPin, ChevronLeft, Check } from 'lucide-react';
import { useCourseByCode, useCourseSections } from '@/hooks/useApi';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface NewDisciplineModalProps {
  code: string;
  onClose: () => void;
}

export function NewDisciplineModal({ code, onClose }: NewDisciplineModalProps) {
  const [navigationStack, setNavigationStack] = useState<string[]>([code]);
  const currentCode = navigationStack[navigationStack.length - 1];

  const { data: discipline, isLoading } = useCourseByCode(currentCode);
  const { data: sections, isLoading: loadingSections } = useCourseSections(currentCode);
  const { completedDisciplines, toggleCompletedDiscipline } = useApp();

  const goToDiscipline = (newCode: string) => setNavigationStack([...navigationStack, newCode]);
  const canGoBack = navigationStack.length > 1;
  const goBack = () => {
    if (canGoBack) setNavigationStack(prev => prev.slice(0, -1));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="w-full max-w-lg bg-card p-10 rounded-xl">
          <p className="text-center">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!discipline) return null;

  const isCompleted = completedDisciplines.includes(discipline.code);

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-end">
      <div className="absolute inset-0" onClick={onClose}/>
      <div className="relative w-full max-w-lg h-full bg-card shadow-elevated animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <button onClick={goBack} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="w-5 h-5"/></button>
            )}
            <span className={cn(
              'inline-block px-3 py-1 rounded-lg text-sm font-semibold',
              discipline.type === 'obrigatoria' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
            )}>
              {discipline.code}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-card-foreground mb-2">{discipline.name}</h2>
          <button onClick={() => toggleCompletedDiscipline(discipline.code)}
            className={cn(
              'mb-4 px-4 py-2 rounded-lg font-semibold transition-all',
              isCompleted ? 'bg-success text-success-foreground border border-success' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {isCompleted ? 'Cursada' : 'Marcar como cursada'}
          </button>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {discipline?.credits !== undefined && <span>{discipline.credits} créditos</span>}
            {discipline?.workload !== undefined && (
              <span className="flex items-center gap-1"><Clock className="w-4 h-4"/>{discipline.workload}h</span>
            )}
            {discipline?.semester && <span>{discipline.semester}º semestre</span>}
          </div>

          {discipline.description && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-1 mt-2">Ementa</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{discipline.description}</p>
            </div>
          )}

          {/* Equivalentes */}
          {discipline.equivalents?.length > 0 && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-1 mt-2">Equivalentes</h3>
              <div className="flex flex-wrap gap-2">
                {discipline.equivalents.map((eq: string) => (
                  <button key={eq} onClick={() => goToDiscipline(eq)} className="px-3 py-1 rounded bg-muted text-muted-foreground text-sm font-medium underline">
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pré-requisitos */}
          {discipline.prerequisites?.length > 0 && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-1 mt-2">Pré-requisitos</h3>
              <div className="flex flex-wrap gap-2">
                {discipline.prerequisites.map((pr: string) => (
                  <span key={pr} className="px-3 py-1 rounded bg-muted text-muted-foreground text-sm font-medium">{pr}</span>
                ))}
              </div>
            </div>
          )}

          {/* Libera */}
          {discipline.libera?.length > 0 && (
            <div>
              <h3 className="font-semibold text-card-foreground mb-1 mt-2">Libera</h3>
              <div className="flex flex-wrap gap-2">
                {discipline.libera.map((lib: string) => (
                  <button key={lib} onClick={() => goToDiscipline(lib)} className="px-3 py-1 rounded bg-muted text-muted-foreground text-sm font-medium underline">
                    {lib}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Turmas */}
          <div>
            <h3 className="font-semibold text-card-foreground mb-1 mt-2">Turmas Disponíveis ({sections?.length || 0})</h3>
            {loadingSections ? (
              <p className="text-muted-foreground text-sm">Carregando turmas...</p>
            ) : !sections?.length ? (
              <p className="text-muted-foreground text-sm">Nenhuma turma disponível para esta disciplina no momento.</p>
            ) : (
              <div className="space-y-2">
                {sections.map(section => (
                  <div key={section.section_code} className="p-3 rounded-xl border-2 border-border bg-muted/20 flex flex-col gap-1">
                    <span className="font-semibold text-card-foreground">Turma {section.section_code}</span>
                    <span className="text-xs text-muted-foreground">{section.professor}</span>
                    <span className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3"/>{section.room}</span>
                    <span className="text-xs flex items-center gap-1"><Users className="w-3 h-3"/>{section.enrolled}/{section.slots} ({section.available} vagas)</span>
                    {section.schedule_raw && (<span className="text-xs">Horário: {section.schedule_raw}</span>)}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
