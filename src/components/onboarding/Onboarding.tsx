import { useState } from 'react';
import { Check, GraduationCap, Search, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePrograms } from '@/hooks/useApi';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import { cn } from '@/lib/utils';
import { fuzzyFilter } from '@/lib/fuzzy';

export function Onboarding() {
  const { setIsOnboarded } = useApp();
  const { selectedPrograms, setSelectedPrograms } = useMyPrograms();
  const { data: programs, isLoading, error } = usePrograms();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedPrograms);

  const filteredPrograms = fuzzyFilter(programs, search, [
    'title',
    'location',
    'program_type',
    'mode',
  ]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const handleSubmit = () => {
    if (selectedIds.length > 0) {
      // Substitui pela seleção atual (permite adicionar e remover em massa)
      setSelectedPrograms(selectedIds);
      setIsOnboarded(true);
    }
  };

  const selectedProgram = undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">CADE</h1>
          <p className="text-muted-foreground mt-2">Portal Acadêmico UFBA</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-elevated p-6 border border-border">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Quais são seus cursos?
          </h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar curso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {/* Course List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Erro ao carregar cursos</p>
              <p className="text-sm text-muted-foreground mt-1">Tente novamente mais tarde</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...filteredPrograms]
                .sort((a, b) => Number(selectedIds.includes(b.id_ref)) - Number(selectedIds.includes(a.id_ref)))
                .slice(0, 50)
                .map((program) => (
                <button
                  key={program.id_ref}
                  onClick={() => toggleSelect(program.id_ref)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                    "border-2",
                    selectedIds.includes(program.id_ref)
                      ? "border-primary bg-primary/10"
                      : "border-transparent bg-muted hover:bg-accent"
                  )}
                >
                  <div className="text-left">
                    <p className="font-medium text-card-foreground text-sm">{program.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {program.program_type} • {program.location} • {program.mode}
                    </p>
                  </div>
                  {selectedIds.includes(program.id_ref) && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-2">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
              {filteredPrograms.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum curso encontrado
                </p>
              )}
            </div>
          )}

          {/* Selected info */}
          {/* Removed single-selected preview for multi-select */}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0}
            className={cn(
              "w-full mt-6 py-4 rounded-xl font-semibold transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              selectedIds.length > 0
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Confirmar seleção ({selectedIds.length})
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Seus dados são salvos localmente no navegador
        </p>
      </div>
    </div>
  );
}
