import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import { ScheduleGrid } from '@/components/planner/ScheduleGrid';
import { ScheduleSummary } from '@/components/planner/ScheduleSummary';
import { MobileSchedule } from '@/components/planner/MobileSchedule';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { scheduledItems, completedDisciplines } = useApp();
  const { myPrograms } = useMyPrograms();
  const isMobile = useIsMobile();


  // Get unique scheduled disciplines
  const scheduledCount = useMemo(() => {
    const unique = new Set(scheduledItems.map(item => item.disciplineCode));
    return unique.size;
  }, [scheduledItems]);

  // Calculate total workload
  const totalWorkload = 0

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Minha Grade do Semestre
          </h1>
          {myPrograms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {myPrograms.map((p) => (
                <span
                  key={p.id_ref}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-foreground"
                >
                  {p.title}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs">Disciplinas</span>
            </div>
            <p className="text-2xl font-bold text-card-foreground">{scheduledCount}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Carga Horária</span>
            </div>
            <p className="text-2xl font-bold text-card-foreground">{totalWorkload}h</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <span className="text-xs">Cursadas</span>
            </div>
            <p className="text-2xl font-bold text-success">{completedDisciplines.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <Link to="/planejador" className="text-xs text-primary hover:underline">
              Editar Grade →
            </Link>
          </div>
        </div>

        {/* Schedule View */}
        {scheduledItems.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-card-foreground mb-2">
              Grade vazia
            </h2>
            <p className="text-muted-foreground mb-4">
              Adicione disciplinas ao seu planejador para visualizar sua grade.
            </p>
            <Link
              to="/planejador"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Ir para o Planejador
            </Link>
          </div>
        ) : (
          <>
            {isMobile ? (
              <div className="space-y-6">
                <ScheduleSummary />
                <MobileSchedule />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <ScheduleSummary />
                </div>
                <div className="lg:col-span-3 bg-card rounded-xl border border-border p-4">
                  <ScheduleGrid />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
