import { useApp } from '@/contexts/AppContext';
import { disciplines, flowchartData } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';

export function FlowchartView() {
  const { completedDisciplines, toggleCompletedDiscipline } = useApp();

  const getDiscipline = (code: string) => {
    return disciplines.find(d => d.code === code);
  };

  const canTake = (code: string) => {
    const discipline = getDiscipline(code);
    if (!discipline) return false;
    if (completedDisciplines.includes(code)) return false;
    return discipline.prerequisites.every(prereq => completedDisciplines.includes(prereq));
  };

  const isCompleted = (code: string) => completedDisciplines.includes(code);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success" />
          <span className="text-sm text-muted-foreground">Cursada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-warning" />
          <span className="text-sm text-muted-foreground">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted" />
          <span className="text-sm text-muted-foreground">Bloqueada</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {flowchartData.semesters.map((semester) => (
            <div key={semester.number} className="w-48 flex-shrink-0">
              <h3 className="text-center font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                {semester.number}º Semestre
              </h3>
              
              <div className="space-y-3">
                {semester.disciplines.map((code) => {
                  const discipline = getDiscipline(code);
                  if (!discipline) return null;

                  const completed = isCompleted(code);
                  const available = canTake(code);
                  const blocked = !completed && !available;

                  return (
                    <button
                      key={code}
                      onClick={() => !blocked && toggleCompletedDiscipline(code)}
                      disabled={blocked}
                      className={cn(
                        "w-full p-4 rounded-xl text-left transition-all border-2",
                        completed && "bg-success/10 border-success text-success-foreground",
                        available && !completed && "bg-warning/10 border-warning text-warning-foreground hover:bg-warning/20",
                        blocked && "bg-muted border-muted text-muted-foreground opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{code}</span>
                        {completed && <Check className="w-4 h-4 text-success" />}
                        {blocked && <Lock className="w-4 h-4" />}
                      </div>
                      <p className={cn(
                        "text-xs line-clamp-2",
                        completed ? "text-success" : 
                        available ? "text-warning" : 
                        "text-muted-foreground"
                      )}>
                        {discipline.name}
                      </p>
                      
                      {discipline.prerequisites.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <p className="text-[10px] opacity-70">
                            Pré-req: {discipline.prerequisites.join(', ')}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
