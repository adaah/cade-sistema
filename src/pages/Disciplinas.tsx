import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DisciplineCard } from '@/components/disciplines/DisciplineCard';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import { DisciplineFilters } from '@/components/disciplines/DisciplineFilters';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useApp } from '@/contexts/AppContext';
import { disciplines, Discipline } from '@/data/mockData';

const Disciplinas = () => {
  const { completedDisciplines, favoriteDisciplines } = useApp();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSemester, setActiveSemester] = useState<number | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredDisciplines = useMemo(() => {
    return disciplines.filter((d) => {
      // Search filter
      const searchMatch = 
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase()) ||
        d.classes.some(c => c.professor.toLowerCase().includes(search.toLowerCase()));

      if (!searchMatch) return false;

      // Type filter
      if (activeFilter === 'obrigatoria' && d.type !== 'obrigatoria') return false;
      if (activeFilter === 'optativa' && d.type !== 'optativa') return false;
      if (activeFilter === 'favorites' && !favoriteDisciplines.includes(d.code)) return false;
      if (activeFilter === 'completed' && !completedDisciplines.includes(d.code)) return false;

      // Semester filter
      if (activeSemester && d.semester !== activeSemester) return false;

      return true;
    });
  }, [search, activeFilter, activeSemester, completedDisciplines, favoriteDisciplines]);

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Catálogo de Disciplinas
          </h1>
          <p className="text-muted-foreground">
            Encontre e gerencie suas matérias
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquise por nome, código ou professor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <DisciplineFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            activeSemester={activeSemester}
            onSemesterChange={setActiveSemester}
          />
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredDisciplines.length} disciplina{filteredDisciplines.length !== 1 ? 's' : ''} encontrada{filteredDisciplines.length !== 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDisciplines.map((discipline) => (
              <DisciplineCard
                key={discipline.code}
                discipline={discipline}
                onClick={() => setSelectedDiscipline(discipline)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredDisciplines.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma disciplina encontrada com os filtros selecionados
            </p>
          </div>
        )}

        {/* Detail drawer */}
        {selectedDiscipline && (
          <DisciplineDetail
            discipline={selectedDiscipline}
            onClose={() => setSelectedDiscipline(null)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Disciplinas;
