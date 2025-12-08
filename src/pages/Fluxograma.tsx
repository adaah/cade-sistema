import { MainLayout } from '@/components/layout/MainLayout';
import { FlowchartView } from '@/components/flowchart/FlowchartView';

const Fluxograma = () => {
  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Fluxograma do Curso
          </h1>
          <p className="text-muted-foreground">
            Visualize seu progresso e planeje os próximos semestres
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-primary">
            <strong>Dica:</strong> Clique nas disciplinas para marcá-las como cursadas. 
            Isso desbloqueará automaticamente as matérias que dependem delas.
          </p>
        </div>

        {/* Flowchart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <FlowchartView />
        </div>
      </div>
    </MainLayout>
  );
};

export default Fluxograma;
