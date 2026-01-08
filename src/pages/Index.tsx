import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useMySections } from '@/hooks/useMySections';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import { ScheduleGrid } from '@/components/planner/ScheduleGrid';
import { ScheduleSummary } from '@/components/planner/ScheduleSummary';
import { MobileSchedule } from '@/components/planner/MobileSchedule';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar, BookOpen, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProgressView } from '@/components/progress/ProgressView';

const Index = () => {
  const { completedDisciplines } = useApp();
  const { mySections } = useMySections();
  const { myPrograms } = useMyPrograms();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'schedule' | 'progress'>('schedule');

  // Get unique scheduled disciplines
  const scheduledCount = useMemo(() => {
    const unique = new Set(mySections.map(s => (s as any)?.course?.code || (s as any)?.course_code));
    unique.delete(undefined as unknown as string);
    return unique.size;
  }, [mySections]);

  // Calculate total workload
  const totalWorkload = useMemo(() => {
    return mySections.reduce((sum, section) => {
      const workload = (section as any)?.course?.workload || (section as any)?.workload || 0;
      return sum + (Number(workload) || 0);
    }, 0);
  }, [mySections]);

  const renderTabContent = () => {
    if (activeTab === 'progress') {
      return <ProgressView />;
    }

    // Schedule view (default)
    if (mySections.length === 0) {
      return (
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
      );
    }

    return isMobile ? (
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
    );
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {activeTab === 'schedule' ? 'Minha Grade do Semestre' : 'Meu Progresso'}
            </h1>
            
            {/* Tabs */}
            <div className="inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === 'schedule' 
                    ? 'bg-background text-foreground shadow' 
                    : 'hover:bg-background/50 hover:text-foreground'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Grade
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === 'progress' 
                    ? 'bg-background text-foreground shadow' 
                    : 'hover:bg-background/50 hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Progresso
              </button>
            </div>
          </div>
          
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

        {/* Quick Stats - Only show on schedule tab */}
        {activeTab === 'schedule' && (
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
              <Link to="/planejador" className="text-xs text-primary hover:underline flex items-center">
                {activeTab === 'schedule' ? 'Editar Grade' : 'Ver Grade'}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </MainLayout>
  );
};

export default Index;
