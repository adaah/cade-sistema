import { useApp } from '@/contexts/AppContext';
import { Clock, BookOpen, Trash2 } from 'lucide-react';
import { useCourses } from '@/hooks/useApi';

export function ScheduleSummary() {
  const { scheduledItems, removeFromSchedule, clearSchedule } = useApp();
  const { data: courses } = useCourses();

  const uniqueDisciplines = scheduledItems.reduce((acc, item) => {
    const key = `${item.disciplineCode}-${item.classCode}`;
    if (!acc.find(d => `${d.disciplineCode}-${d.classCode}` === key)) {
      acc.push(item);
    }
    return acc;
  }, [] as typeof scheduledItems);

  const totalCredits = uniqueDisciplines.reduce((sum, item) => {
    const discipline = courses?.find(d => d.code === item.disciplineCode);
    return sum + (discipline?.credits || 0);
  }, 0);

  const totalWorkload = uniqueDisciplines.reduce((sum, item) => {
    const discipline = courses?.find(d => d.code === item.disciplineCode);
    return sum + (discipline?.workload || 0);
  }, 0);

  if (uniqueDisciplines.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-card-foreground mb-1">Grade Vazia</h3>
        <p className="text-sm text-muted-foreground">
          Adicione turmas pelo catálogo de disciplinas
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">Minha Grade</h3>
        <button
          onClick={clearSchedule}
          className="text-sm text-destructive hover:text-destructive/80 transition-colors"
        >
          Limpar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Carga Horária</span>
          </div>
          <p className="text-xl font-bold text-card-foreground">{totalWorkload}h</p>
        </div>
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs">Créditos</span>
          </div>
          <p className="text-xl font-bold text-card-foreground">{totalCredits}</p>
        </div>
      </div>

      <div className="space-y-2">
        {uniqueDisciplines.map((item) => (
          <div
            key={`${item.disciplineCode}-${item.classCode}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color || '#3b82f6' }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-card-foreground text-sm truncate">
                {item.disciplineName}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.classCode} • {item.professor}
              </p>
            </div>
            <button
              onClick={() => removeFromSchedule(item.disciplineCode, item.classCode)}
              className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
