import { MainLayout } from '@/components/layout/MainLayout';
import { ScheduleGrid } from '@/components/planner/ScheduleGrid';
import { ScheduleSummary } from '@/components/planner/ScheduleSummary';
import { MobileSchedule } from '@/components/planner/MobileSchedule';
import { useIsMobile } from '@/hooks/use-mobile';

const Planejador = () => {
  const isMobile = useIsMobile();

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Meu Planejador
          </h1>
          <p className="text-muted-foreground">
            Organize sua grade horária do semestre
          </p>
        </div>

        {/* Content */}
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
      </div>
    </MainLayout>
  );
};

export default Planejador;
