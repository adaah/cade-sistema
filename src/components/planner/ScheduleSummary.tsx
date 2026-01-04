import { Calendar, Users, Trash2, Clock, Info } from 'lucide-react';
import { useState } from 'react';
import { useMySections } from '@/hooks/useMySections';
import { useMyCourses } from '@/hooks/useMyCourses.ts';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import type { Course } from '@/services/api';
import { Progress } from '@/components/ui/progress';

export function ScheduleSummary() {
  const { mySections, toggleSection } = useMySections();
  const { courses } = useMyCourses();
  const [selectedDiscipline, setSelectedDiscipline] = useState<Course | null>(null);

  if (mySections.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-card-foreground mb-1">Nenhuma turma adicionada</h3>
        <p className="text-sm text-muted-foreground">
          Adicione turmas pelo catálogo de disciplinas
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">Minhas Turmas</h3>
        <button
          onClick={() => mySections.forEach((s) => toggleSection(s))}
          className="text-sm text-destructive hover:text-destructive/80 transition-colors"
        >
          Limpar
        </button>
      </div>

      <div className="space-y-3">
        {mySections.map((s) => {
          const disciplineCode = s.course?.code || (s as any)?.course_code || '';
          const disciplineName = s.course?.name || disciplineCode;
          const classCode = (s as any)?.section_code || s.id_ref;
          const teachers = Array.isArray((s as any)?.teachers) ? (s as any).teachers : ((s as any)?.professor ? [(s as any).professor] : []);
          const timeCodes = Array.isArray(s.time_codes) ? s.time_codes : [];
          const course = courses?.find(c => c.code === disciplineCode);
          const alternatives = Math.max(0, ((course?.sections_count ?? 1) - 1));
          const seatsAccepted = (s as any)?.seats_accepted ?? 0;
          const seatsCount = (s as any)?.seats_count ?? 0;
          const progress = seatsCount > 0 ? Math.min(100, Math.max(0, Math.round((seatsAccepted / seatsCount) * 100))) : 0;

          return (
            <div key={`${disciplineCode}-${classCode}`} className="p-3 rounded-lg border border-border bg-muted/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">{disciplineCode}</span>
                    {alternatives > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent text-accent-foreground border border-border whitespace-nowrap">
                        + {alternatives} alternativa{alternatives > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-card-foreground truncate">{disciplineName}</p>

                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span className="truncate">{teachers.length > 0 ? teachers.join(', ') : 'Professor(es) a definir'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="truncate">{timeCodes.length > 0 ? timeCodes.join(', ') : 'Horário a definir'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSection(s)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (course) setSelectedDiscipline(course as Course); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-all"
                  aria-label="Mais informações"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Vagas preenchidas</span>
                  <span>{seatsAccepted}/{seatsCount}</span>
                </div>
                <Progress value={progress} />
              </div>
            </div>
          );
        })}
      </div>
      {selectedDiscipline && (
        <DisciplineDetail
          discipline={selectedDiscipline}
          onClose={() => setSelectedDiscipline(null)}
        />
      )}
    </div>
  );
}
