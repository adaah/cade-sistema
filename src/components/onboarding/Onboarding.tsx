import { useState } from 'react';
import { Check, GraduationCap, Search, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePrograms } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export function Onboarding() {
  const { setSelectedCourse, setIsOnboarded } = useApp();
  const { data: programs, isLoading, error } = usePrograms();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filteredPrograms = programs?.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase()) ||
    p.program_type.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSubmit = () => {
    if (selected) {
      setSelectedCourse(selected);
      setIsOnboarded(true);
    }
  };

  const selectedProgram = programs?.find(p => p.id_ref === selected);

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
            Qual o seu curso?
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
              {filteredPrograms.slice(0, 50).map((program) => (
                <button
                  key={program.id_ref}
                  onClick={() => setSelected(program.id_ref)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                    "border-2",
                    selected === program.id_ref
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
                  {selected === program.id_ref && (
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
          {selectedProgram && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-primary">{selectedProgram.title}</p>
              <p className="text-xs text-muted-foreground">
                {selectedProgram.time_code} • {selectedProgram.mode}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className={cn(
              "w-full mt-6 py-4 rounded-xl font-semibold transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              selected
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Entrar no Portal
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Seus dados são salvos localmente no navegador
        </p>
      </div>
    </div>
  );
}
