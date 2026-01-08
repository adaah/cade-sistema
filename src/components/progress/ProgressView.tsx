import { ProgressCard } from './ProgressCard';
import { SemesterGrid } from './SemesterGrid';
import { useApp } from '@/contexts/AppContext';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import { GraduationCap, BookOpen, Clock } from 'lucide-react';

// Mock data - replace with actual data from your application
const MOCK_DATA = {
  totalHours: 3200,
  completedHours: 960,
  mandatory: {
    completed: 840,
    total: 2265,
    info: 'Horas de disciplinas obrigatórias do curso.'
  },
  electives: {
    completed: 120,
    total: 480,
    info: 'Horas de disciplinas optativas.'
  },
  complementary: {
    completed: 0,
    total: 455,
    info: 'Horas de atividades complementares.'
  },
  semesters: {
    current: 3,
    total: 9,
    completed: 2,
    info: 'Progresso nos semestres do curso.'
  }
};

export function ProgressView() {
  const { completedDisciplines } = useApp();
  const { myPrograms } = useMyPrograms();
  
  // Calculate overall progress percentage
  const overallProgress = MOCK_DATA.totalHours > 0 
    ? (MOCK_DATA.completedHours / MOCK_DATA.totalHours) * 100 
    : 0;

  // Get the current program name
  const programName = myPrograms[0]?.title || 'Seu Curso';
  const programInfo = 'Noturno'; // Default value since description doesn't exist on Program type

  return (
    <div className="space-y-6">
      {/* Header with program info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <GraduationCap className="w-4 h-4" />
          <span>UFBA • {programName} • {programInfo}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Progresso</h1>
      </div>

      {/* Overall Progress */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Progresso Geral</h2>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">
              {overallProgress.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>{MOCK_DATA.completedHours} / {MOCK_DATA.totalHours} horas</span>
        </div>
        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressCard 
          title="Obrigatórias" 
          current={MOCK_DATA.mandatory.completed} 
          total={MOCK_DATA.mandatory.total}
          showInfo
          infoText={MOCK_DATA.mandatory.info}
        />
        <ProgressCard 
          title="Optativas" 
          current={MOCK_DATA.electives.completed} 
          total={MOCK_DATA.electives.total}
          showInfo
          infoText={MOCK_DATA.electives.info}
        />
        <ProgressCard 
          title="Complementares" 
          current={MOCK_DATA.complementary.completed} 
          total={MOCK_DATA.complementary.total}
          showInfo
          infoText={MOCK_DATA.complementary.info}
        />
      </div>

      {/* Semester Grid */}
      <SemesterGrid 
        currentSemester={MOCK_DATA.semesters.current}
        totalSemesters={MOCK_DATA.semesters.total}
        completedSemesters={MOCK_DATA.semesters.completed}
        showInfo
        infoText={MOCK_DATA.semesters.info}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Disciplinas Cursadas</p>
            <p className="text-xl font-semibold">{completedDisciplines.length}</p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Horas Concluídas</p>
            <p className="text-xl font-semibold">{MOCK_DATA.completedHours}h</p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
            <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Progresso Total</p>
            <p className="text-xl font-semibold">{overallProgress.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
