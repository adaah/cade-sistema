import { useApp } from '@/contexts/AppContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { BookOpen, Calendar, GitBranch, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { disciplines } from '@/data/mockData';

const Index = () => {
  const { selectedCourse, scheduledItems, completedDisciplines } = useApp();

  // Get unique scheduled disciplines
  const scheduledCount = scheduledItems.reduce((acc, item) => {
    if (!acc.includes(item.disciplineCode)) {
      acc.push(item.disciplineCode);
    }
    return acc;
  }, [] as string[]).length;

  // Calculate progress
  const totalDisciplines = disciplines.length;
  const progress = Math.round((completedDisciplines.length / totalDisciplines) * 100);

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Olá, estudante! 👋
          </h1>
          <p className="text-muted-foreground">
            Organize sua jornada acadêmica de forma inteligente
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Disciplinas</span>
            </div>
            <p className="text-2xl font-bold text-card-foreground">
              {completedDisciplines.length}/{totalDisciplines}
            </p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Na Grade</span>
            </div>
            <p className="text-2xl font-bold text-card-foreground">
              {scheduledCount}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              turmas selecionadas
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-warning" />
              </div>
              <span className="text-sm text-muted-foreground">Progresso</span>
            </div>
            <p className="text-2xl font-bold text-card-foreground">
              {progress}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              do curso concluído
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Acesso Rápido</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/disciplinas"
              className="group bg-card rounded-xl border border-border p-5 hover:shadow-card-hover hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">
                    Catálogo de Disciplinas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Explore as matérias e adicione ao planejador
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link
              to="/planejador"
              className="group bg-card rounded-xl border border-border p-5 hover:shadow-card-hover hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">
                    Meu Planejador
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Visualize e organize sua grade horária
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link
              to="/fluxograma"
              className="group bg-card rounded-xl border border-border p-5 hover:shadow-card-hover hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">
                    Fluxograma do Curso
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe seu progresso e pré-requisitos
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link
              to="/configuracoes"
              className="group bg-card rounded-xl border border-border p-5 hover:shadow-card-hover hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">
                    Configurações
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Personalize o portal
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
