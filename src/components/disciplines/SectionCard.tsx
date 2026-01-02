import { AlertCircle, Clock, Plus, Users, Eraser, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Section } from '@/services/api';
import { useMySections } from '@/hooks/useMySections';
import { useApp } from '@/contexts/AppContext';

interface SectionCardProps {
  section: Section;
  isAdded: boolean;
  onAdd: (section: Section) => void;
  onNavigateCourse?: (courseCode: string) => void;
}

export function SectionCard({ section, isAdded, onAdd, onNavigateCourse }: SectionCardProps) {
  const { hasSectionOnCourse, getConflictsForSection } = useMySections();
  const { completedDisciplines } = useApp();
  const seatsCount = section.seats_count;
  const seatsAccepted = section.seats_accepted;
  const available = seatsCount - seatsAccepted;
  const isFull = available <= 0;
  const isAlmostFull = available > 0 && available <= 5;

  const teachers = section.teachers ?? []

  // Compute time conflicts via helper
  const conflicts = getConflictsForSection(section);

  return (
    <div
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
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-card-foreground text-sm">
              {teachers && teachers.length > 0
                ? teachers[0]
                : `Turma ${section.id_ref}`}
            </span>
          </div>

          {/* Tags always below the title (no 'Adicionar' tag) */}
          <div className="mb-2">
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
            {!isFull && conflicts.length > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-warning text-warning-foreground">
                Conflito
              </span>
            )}
          </div>

          {(() => {
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
                  {(Array.isArray(section.time_codes) && section.time_codes.length > 0
                      ? section.time_codes.join(', ')
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

            {(() => {
              if (conflicts.length === 0) return null;
              const currentCourseCode = section.course?.code;
              const uniqueCodes = Array.from(new Set(
                conflicts
                  .map((c) => c.section.course?.code)
                  .filter((code): code is string => Boolean(code) && code !== currentCourseCode)
              ));
              if (uniqueCodes.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-2 mt-3">
                  {uniqueCodes.map((code) => (
                    <button
                      key={`conf-${code}`}
                      onClick={() => onNavigateCourse?.(code)}
                      className="px-2 py-0.5 rounded text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/80 border border-border"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {(() => {
          const courseCode = section.course?.code;
          const isCompleted = courseCode ? completedDisciplines.includes(courseCode) : false;
          if (isCompleted || isFull) return null;
          return (
        <div className="flex items-center gap-2">
          {isAdded ? (
            <button
              onClick={() => onAdd(section)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25'
              )}
            >
              <Eraser className="w-4 h-4" />
              <span className="hidden sm:inline">Remover</span>
            </button>
          ) : (() => {
            const code = section.course?.code as string | undefined;
            const showSwap = !!code && hasSectionOnCourse(code);
            return showSwap ? (
              <button
                onClick={() => onAdd(section)}
                disabled={isFull}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                  isFull
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-lg shadow-warning/25',
                )}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="hidden sm:inline">Trocar</span>
              </button>
            ) : (
              <button
                onClick={() => onAdd(section)}
                disabled={isFull}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                  isFull
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : conflicts.length > 0
                      ? 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-lg shadow-warning/25'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25',
                )}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{conflicts.length > 0 ? 'Sobrescrever' : 'Adicionar'}</span>
              </button>
            );
          })()}
        </div>
          );
        })()}
      </div>

      {isAlmostFull && !isFull && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-warning/30 text-warning text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Poucas vagas restantes ({available})</span>
        </div>
      )}
    </div>
  );
}
