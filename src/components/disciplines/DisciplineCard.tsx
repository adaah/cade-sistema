import { Clock, Check, Users, Heart } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { Course } from '@/services/api';
import { useMode } from '@/hooks/useMode';
import { useFavoriteCourses } from '@/hooks/useFavoriteCourses';

interface DisciplineCardProps {
  discipline: Course;
  onClick: () => void;
  available?: boolean;
  blocked?: boolean;
}

export function DisciplineCard({ discipline, onClick, available, blocked }: DisciplineCardProps) {
  const { completedDisciplines, toggleCompletedDiscipline } = useApp();
  const { isSimplified } = useMode();
  const { isFavorite, toggleFavorite } = useFavoriteCourses();

  const isCompleted = completedDisciplines.includes(discipline.code);
  const favorite = isFavorite(discipline.code);
  const showCompletedStyles = isCompleted;
  const showBlocked = !isSimplified && !!blocked;
  const showAvailable = isSimplified ? !isCompleted : !!available;

  return (
    <div
      className={cn(
        "group relative bg-card rounded-xl border border-border px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 cursor-pointer",
        "flex h-full flex-col",
        "transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02]",
        showCompletedStyles && "border-success/50 bg-success/5",
        !showCompletedStyles && showAvailable && "bg-warning/10 border-warning hover:bg-warning/20",
        !showCompletedStyles && showBlocked && "bg-muted border-muted opacity-60"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span
          className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold",
            (discipline as any).type === 'obrigatoria'
              ? "bg-primary/10 text-primary"
              : (discipline as any).type
              ? "bg-warning/10 text-warning"
              : "bg-muted text-muted-foreground"
          )}
        >
          {discipline.code}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(discipline.code);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors",
              favorite ? "text-rose-600 bg-rose-500/10" : "text-muted-foreground hover:bg-muted"
            )}
            aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={cn("w-4 h-4", favorite && "fill-current")}/>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCompletedDiscipline(discipline.code);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isCompleted
                ? "text-success bg-success/10"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {isCompleted ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="block w-4 h-4 rounded-full border border-current" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2 text-[11px] sm:text-sm md:text-base">
          {discipline.name}
        </h3>

        <div className="flex items-center gap-4 text-[11px] sm:text-sm text-muted-foreground">
          {typeof (discipline as any).workload === 'number' && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{(discipline as any).workload}h</span>
            </div>
          )}
          {typeof (discipline as any).credits === 'number' && (
            <span>{(discipline as any).credits} créditos</span>
          )}
        </div>

        {(discipline as any).prerequisites?.length > 0 && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 truncate">
            Pré-req: {(discipline as any).prerequisites?.join(', ')}
          </p>
        )}
      </div>

      {/* Rodapé compacto com status e contador de turmas */}
      <div className="mt-2 pt-1 border-t border-border">
        <div className="flex items-center justify-between">
          {isCompleted && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-success/10 text-success text-[10px] sm:text-xs font-medium">
              Cursada
            </span>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{(discipline as any).sections_count ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
