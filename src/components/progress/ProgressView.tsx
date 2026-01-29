import { ProgressCard } from './ProgressCard';
import { SemesterGrid } from './SemesterGrid';
import { useApp } from '@/contexts/AppContext';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import { GraduationCap, BookOpen, Clock, Info, Upload, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

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
  const { completedDisciplines, toggleCompletedDiscipline } = useApp();
  const { myPrograms } = useMyPrograms();
  
  // Estados para importação de histórico
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedCodes, setParsedCodes] = useState<string[]>([]);
  const [importError, setImportError] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  
  // Função para parsear texto do histórico (mesma da tela Disciplinas)
  const parseHistoryText = (text: string): string[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const approved = new Set<string>();
    
    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Padrões para identificar disciplinas aprovadas
      const patterns = [
        /([A-Z]{3,4}\d{3,4})[\s\*]*.*?(APROVADO|APROV|DISPENSADO|DISP)/i,
        /([A-Z]{3,4}\d{3,4})[\s\*]*.*?(APROVADA|APROV|DISPENSADA|DISP)/i,
        /([A-Z]{3,4}\s*\d{3,4})[\s\*]*.*?(APROVADO|APROV|DISPENSADO|DISP)/i,
        /([A-Z]{3,4}\s*\d{3,4})[\s\*]*.*?(APROVADA|APROV|DISPENSADA|DISP)/i,
      ];
      
      for (const pattern of patterns) {
        const match = cleanLine.match(pattern);
        if (match) {
          const code = match[1].replace(/\s/g, '').toUpperCase();
          approved.add(code);
          break;
        }
      }
    }
    
    return Array.from(approved);
  };
  
  const handleParseImport = (text: string) => {
    setImportError('');
    const codes = parseHistoryText(text);
    setParsedCodes(codes);
    setImportText(text);
    if (codes.length === 0) {
      setImportError('Não foi possível encontrar disciplinas com status aprovado. Confira o texto ou tente outro arquivo.');
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setImportError('');
    
    try {
      if (file.type === 'application/pdf') {
        // Para PDF, precisaria de uma biblioteca como pdf.js
        // Por enquanto, vamos apenas mostrar erro
        setImportError('Leitura de PDF não implementada nesta tela. Por favor, copie e cole o texto do PDF.');
      } else {
        const text = await file.text();
        handleParseImport(text);
      }
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      setImportError('Erro ao processar arquivo. Tente copiar e colar o texto.');
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleApplyImport = () => {
    if (parsedCodes.length === 0) {
      setImportError('Nenhum código aprovado encontrado para aplicar.');
      return;
    }
    
    // Aplicar códigos ao contexto global
    parsedCodes.forEach(code => {
      if (!completedDisciplines.includes(code)) {
        toggleCompletedDiscipline(code);
      }
    });
    
    setShowImportModal(false);
    setParsedCodes([]);
    setImportText('');
    setImportError('');
  };
  
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Progresso</h1>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar histórico
          </button>
        </div>
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

      {/* Aproveitamento Section */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">Aproveitamento</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">Visualização do aproveitamento por semestre cursado.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Semestres cursados com aproveitamento */}
          {Array.from({ length: MOCK_DATA.semesters.completed }).map((_, semesterIndex) => {
            const semesterNumber = semesterIndex + 1;
            // Simular disciplinas por semestre (mock data)
            const disciplinesInSemester = semesterNumber <= 2 ? 6 : semesterNumber <= 4 ? 5 : 4;
            const approvedInSemester = Math.floor(disciplinesInSemester * 0.7); // 70% aprovação
            const failedInSemester = Math.floor(disciplinesInSemester * 0.15); // 15% reprovação
            const droppedInSemester = Math.floor(disciplinesInSemester * 0.1); // 10% trancamento
            const notDoneInSemester = disciplinesInSemester - approvedInSemester - failedInSemester - droppedInSemester;
            
            return (
              <div key={semesterIndex} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{semesterNumber}º Semestre</span>
                  <span className="text-muted-foreground">
                    {approvedInSemester}/{disciplinesInSemester} disciplinas
                  </span>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: disciplinesInSemester }).map((_, discIndex) => {
                    let status: 'approved' | 'failed' | 'dropped' | 'not-done';
                    let colorClass: string;
                    let title: string;
                    
                    if (discIndex < approvedInSemester) {
                      status = 'approved';
                      colorClass = 'bg-green-500';
                      title = 'Aprovação';
                    } else if (discIndex < approvedInSemester + failedInSemester) {
                      status = 'failed';
                      colorClass = 'bg-red-500';
                      title = 'Reprovação';
                    } else if (discIndex < approvedInSemester + failedInSemester + droppedInSemester) {
                      status = 'dropped';
                      colorClass = 'bg-gray-700';
                      title = 'Trancamento';
                    } else {
                      status = 'not-done';
                      colorClass = 'bg-gray-300';
                      title = 'Não feito';
                    }
                    
                    return (
                      <div 
                        key={discIndex}
                        className={`h-4 rounded-sm ${colorClass}`}
                        title={title}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* Estatísticas gerais */}
          <div className="pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm" />
                <span className="text-muted-foreground">Aprovação/Dispensa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                <span className="text-muted-foreground">Reprovação</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-700 rounded-sm" />
                <span className="text-muted-foreground">Trancamento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded-sm" />
                <span className="text-muted-foreground">Não feito</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Modal de Importar Histórico */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-2xl bg-card rounded-2xl shadow-xl border border-border/60 p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Importar histórico</p>
                    <p className="text-sm text-muted-foreground">
                      Envie o PDF ou cole o texto do histórico para atualizar seu progresso.
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Selecionar PDF</span>
                  <input type="file" accept=".pdf,text/plain" className="hidden" onChange={handleFileChange} />
                </label>

                <textarea
                  className="w-full min-h-[140px] rounded-lg border border-border bg-background p-3 text-sm"
                  placeholder="Cole aqui o texto do histórico (Ctrl+A, Ctrl+C no PDF aberto)"
                  value={importText}
                  onChange={(e) => handleParseImport(e.target.value)}
                />

                {isParsing && <p className="text-sm text-muted-foreground">Lendo arquivo...</p>}
                {importError && <p className="text-sm text-destructive">{importError}</p>}

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Disciplinas aprovadas detectadas: {parsedCodes.length}
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-auto border border-border/70 rounded-lg p-2">
                    {parsedCodes.length === 0 ? (
                      <span className="text-xs text-muted-foreground">Nenhuma encontrada ainda.</span>
                    ) : (
                      parsedCodes.map(code => (
                        <span key={code} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                          {code}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setParsedCodes([]);
                    setImportText('');
                    setImportError('');
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyImport}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
                  disabled={isParsing}
                >
                  Aplicar e atualizar progresso
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
