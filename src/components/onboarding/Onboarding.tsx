import { useEffect, useRef, useState } from 'react';
import { Check, GraduationCap, Search, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
  // Dois estados para serializar a animação: UI (check) -> Ordenação (slide)
  const [selectedIdsUI, setSelectedIdsUI] = useState<string[]>(selectedPrograms);
  const [selectedIdsSort, setSelectedIdsSort] = useState<string[]>(selectedPrograms);
  const timersRef = useRef<Record<string, number | ReturnType<typeof setTimeout>>>({});
  const REORDER_DELAY_MS = 420;

  const filteredPrograms = fuzzyFilter(programs, search, [
    'title',
    'location',
    'program_type',
    'mode',
  ]);

  const toggleSelect = (id: string) => {
    // Atualiza imediatamente o estado de UI (aparece/desaparece o check)
    const nextUI = (prev: string[]) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
    setSelectedIdsUI(nextUI);

    // Cancela timer anterior deste id (se houver)
    const prevTimer = timersRef.current[id];
    if (prevTimer) {
      clearTimeout(prevTimer as number);
      delete timersRef.current[id];
    }

    // Agenda a atualização do estado usado na ordenação após o tempo do check
    const schedule = setTimeout(() => {
      // Usa o estado mais recente de UI como fonte da verdade para ordenar
      setSelectedIdsSort(selectedIdsUIRef.current);
      delete timersRef.current[id];
    }, REORDER_DELAY_MS);
    timersRef.current[id] = schedule;
  };

  // Mantém uma ref sincronizada com selectedIdsUI para uso em setTimeout
  const selectedIdsUIRef = useRef(selectedIdsUI);
  selectedIdsUIRef.current = selectedIdsUI;

  // Limpeza de timers ao desmontar
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => clearTimeout(t as number));
      timersRef.current = {} as any;
    };
  }, []);

  const handleSubmit = () => {
    if (selectedIdsUI.length > 0) {
      // Substitui pela seleção atual (permite adicionar e remover em massa)
      setSelectedPrograms(selectedIdsUI);
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
              <AnimatePresence mode="popLayout">
                {[...filteredPrograms]
                  // Ordena com base no estado de ordenação (após delay)
                  .sort((a, b) => Number(selectedIdsSort.includes(b.id_ref)) - Number(selectedIdsSort.includes(a.id_ref)))
                  .slice(0, 50)
                  .map((program) => {
                    const isSelectedUI = selectedIdsUI.includes(program.id_ref);
                    return (
                      <motion.button
                        key={program.id_ref}
                        layout
                        onClick={() => toggleSelect(program.id_ref)}
                        initial={{ opacity: 0, y: 12, scale: 0.992 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.992 }}
                        whileTap={{ scale: 1.06 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 24, mass: 1 }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl",
                          "border-2",
                          isSelectedUI
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
                        {isSelectedUI && (
                          <motion.div
                            layout
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 22, mass: 1 }}
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-2"
                          >
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
              </AnimatePresence>
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
            disabled={selectedIdsUI.length === 0}
            className={cn(
              "w-full mt-6 py-4 rounded-xl font-semibold transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              selectedIdsUI.length > 0
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Confirmar seleção ({selectedIdsUI.length})
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Seus dados são salvos localmente no navegador
        </p>
      </div>
    </div>
  );
}
