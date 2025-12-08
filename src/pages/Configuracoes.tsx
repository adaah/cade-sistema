import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { Sun, Moon, Trash2, RotateCcw, User } from 'lucide-react';
import { programs } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

const Configuracoes = () => {
  const { 
    theme, 
    toggleTheme, 
    selectedCourse, 
    setSelectedCourse,
    setIsOnboarded,
    clearSchedule,
    completedDisciplines
  } = useApp();

  const currentProgram = programs.find(p => p.id === selectedCourse);

  const handleResetAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleClearSchedule = () => {
    clearSchedule();
    toast({
      title: "Grade limpa",
      description: "Todas as turmas foram removidas do planejador."
    });
  };

  const handleChangeCourse = () => {
    setIsOnboarded(false);
    setSelectedCourse(null);
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Personalize sua experiência no portal
          </p>
        </div>

        <div className="space-y-6">
          {/* Course */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Meu Curso</h3>
                <p className="text-sm text-muted-foreground">{currentProgram?.name || 'Não selecionado'}</p>
              </div>
            </div>
            <button
              onClick={handleChangeCourse}
              className="w-full py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Alterar curso
            </button>
          </div>

          {/* Theme */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-card-foreground mb-4">Aparência</h3>
            <div className="flex gap-3">
              <button
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>Claro</span>
              </button>
              <button
                onClick={() => theme === 'light' && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span>Escuro</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-card-foreground mb-4">Estatísticas</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disciplinas cursadas</span>
                <span className="font-medium text-card-foreground">{completedDisciplines.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dados salvos localmente</span>
                <span className="font-medium text-success">Ativo</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold text-card-foreground mb-4">Ações</h3>
            <div className="space-y-3">
              <button
                onClick={handleClearSchedule}
                className="w-full flex items-center gap-3 py-3 px-4 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Limpar grade horária</span>
              </button>
              <button
                onClick={handleResetAll}
                className="w-full flex items-center gap-3 py-3 px-4 rounded-lg border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Resetar todos os dados</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>CADE - Portal Acadêmico</p>
            <p className="mt-1">Desenvolvido com ❤️ para estudantes</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Configuracoes;
