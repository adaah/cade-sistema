import { Clock, Heart, Check } from 'lucide-react';
import { Discipline } from '@/data/mockData';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface DisciplineCardProps {
  discipline: Discipline;
  onClick: () => void;
}

export function DisciplineCard({ discipline, onClick }: DisciplineCardProps) {
  const { completedDisciplines, toggleCompletedDiscipline, favoriteDisciplines, toggleFavoriteDiscipline } = useApp();

  const isCompleted = completedDisciplines.includes(discipline.code);
  const isFavorite = favoriteDisciplines.includes(discipline.code);

  return (
    <div
      className={cn(
        "group relative bg-card rounded-xl border border-border p-5 cursor-pointer",
        "transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02]",
        isCompleted && "border-success/50 bg-success/5"
      )}
      onClick={onClick}
    >
      {/* Badge */}
      <div className="flex items-start justify-between mb-3">
        <span className={cn(
          "px-3 py-1 rounded-lg text-sm font-semibold",
          discipline.type === 'obrigatoria'
            ? "bg-primary/10 text-primary"
            : "bg-warning/10 text-warning"
        )}>
          {discipline.code}
        </span>
        
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteDiscipline(discipline.code);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isFavorite 
                ? "text-destructive bg-destructive/10" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
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
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">
        {discipline.name}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{discipline.workload}h</span>
        </div>
        <span>{discipline.credits} créditos</span>
      </div>

      {/* Semester indicator */}
      <div className="mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {discipline.semester}º Semestre • {discipline.classes.length} turma{discipline.classes.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-success rounded-md text-xs font-medium text-success-foreground">
          Cursada
        </div>
      )}
    </div>
  );
}
