import { useState, useMemo, useEffect } from 'react';
import { Search, AlertCircle, X, BookOpen, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { reduce, append } from 'ramda'
import { MainLayout } from '@/components/layout/MainLayout';
import { DisciplineCard } from '@/components/disciplines/DisciplineCard';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useApp } from '@/contexts/AppContext';
import { useCourses as useAllCourses, useSections } from '@/hooks/useApi';
import { useMyCourses } from '@/hooks/useMyCourses';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import {Course, CourseApi, fetchCourseDetail} from '@/services/api';
import {cn, getSemesterTitle} from '@/lib/utils';
import { fuzzyFilter } from '@/lib/fuzzy';
import { useMode } from '@/hooks/useMode';
import { useFavoriteCourses } from '@/hooks/useFavoriteCourses';
import { useFilter } from '@/hooks/useFilter';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Disciplinas = () => {
  const { completedDisciplines, toggleCompletedDiscipline } = useApp();
  const { myPrograms } = useMyPrograms();
  const { courses, isLoading, levels } = useMyCourses();
  const { isSimplified, isFull, setMode } = useMode();
  const { isFavorite, favoriteCodes, toggleFavorite } = useFavoriteCourses();
  const { data: allCourses = [] } = useAllCourses();

  const selectedProgram = myPrograms.find(Boolean);
  
  const [search, setSearch] = useState('');
  // search, semester and modal states
  const [activeSemester, setActiveSemester] = useState<number | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Course | null>(null);
  const [showDisciplinesModal, setShowDisciplinesModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'completed' | 'favorite' | 'import'; course?: Course; codes?: string[] } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [parsedCodes, setParsedCodes] = useState<string[]>([]);
  const [importError, setImportError] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [prereqCache, setPrereqCache] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    const hasVisited = localStorage.getItem('firstVisitDisciplinas');
    if (!hasVisited) {
      setShowDisciplinesModal(true);
    }
  }, []);

  const handleRestrictedAction = (type: 'completed' | 'favorite', course: Course) => {
    if (type === 'completed' && !hasAllPrereqsDone(course)) {
      setPendingAction({ type, course });
      setShowBlockedModal(true);
      return;
    }

    if (isSimplified) {
      setPendingAction({ type, course });
      setShowUpgradeModal(true);
    } else {
      if (type === 'completed') {
        toggleCompletedDiscipline(course.code);
      } else {
        toggleFavorite(course.code);
      }
    }
  };

  const confirmUpgrade = () => {
    if (pendingAction) {
      setMode('full');
      localStorage.setItem('mode', 'full');
      localStorage.setItem('experienceMode', 'completa');
      setShowUpgradeModal(false);
      // Executar a ação após upgrade
      if (pendingAction.type === 'completed' && pendingAction.course) {
        toggleCompletedDiscipline(pendingAction.course.code);
      } else if (pendingAction.type === 'favorite' && pendingAction.course) {
        toggleFavorite(pendingAction.course.code);
      } else if (pendingAction.type === 'import' && pendingAction.codes) {
        applyImportedCodes(pendingAction.codes);
      }
      setPendingAction(null);
    }
  };

  const getPrerequisitesList = (course: Course): string[] => {
    return findProgramPrereqOption(course);
  };

  const markPrereqsAsCompleted = () => {
    if (pendingAction?.course) {
      const prereqs = getPrerequisitesList(pendingAction.course);
      prereqs.forEach(code => {
        if (!completedDisciplines.includes(code)) {
          toggleCompletedDiscipline(code);
        }
      });
      // Marca a disciplina atual também
      toggleCompletedDiscipline(pendingAction.course.code);
    }
    setShowBlockedModal(false);
    setPendingAction(null);
  };

  const markOnlyCurrentAsCompleted = () => {
    if (pendingAction?.course) {
      toggleCompletedDiscipline(pendingAction.course.code);
    }
    setShowBlockedModal(false);
    setPendingAction(null);
  };

  const codeRegex = /[A-Z]{3,}\d{2,}[A-Z]?/g;
  const approvedTokens = ['APR', 'CUMP', 'DISP'];
  const rejectedTokens = ['REP', 'REPF', 'REPMF', 'TRANC', 'CANC'];

  const parseHistoryText = (text: string) => {
    const approved = new Set<string>();
    
    // Divide o texto em blocos por período (2022.1, 2022.2, etc.)
    const periodBlocks = text.split(/(\d{4}\.\d+)/);
    
    for (let i = 1; i < periodBlocks.length; i += 2) {
      const period = periodBlocks[i];
      const content = periodBlocks[i + 1] || '';
      
      if (!content) continue;
      
      // Junta o período e o conteúdo para análise completa
      const fullBlock = period + content;
      
      // Encontra todos os códigos neste bloco
      const codes = fullBlock.match(codeRegex) || [];
      if (codes.length === 0) continue;
      
      // Verifica se o bloco contém status aprovado
      const hasRejected = rejectedTokens.some(token => fullBlock.includes(token));
      const hasApproved = approvedTokens.some(token => fullBlock.includes(token));
      
      // Se tem aprovação e não tem rejeição, adiciona todos os códigos do bloco
      if (hasApproved && !hasRejected) {
        codes.forEach(c => approved.add(c));
      }
    }
    
    // Processa blocos sem período claro (últimas disciplinas, quebras de página)
    // Procura por padrões de disciplina: nome + professor + status + código
    const disciplinePattern = /([A-ZÀ-Ú][^()]*[A-ZÀ-Ú])\s*\([^)]*\)\s*(APR|CUMP|DISP|REP|REPF|TRANC|CANC)\s+([A-Z]{3,}\d{2,}[A-Z]?)/gi;
    let match;
    while ((match = disciplinePattern.exec(text)) !== null) {
      const status = match[2];
      const code = match[3];
      
      if (approvedTokens.includes(status) && !rejectedTokens.includes(status)) {
        approved.add(code);
      }
    }
    
    // Padrão alternativo: status no final (formato PDF extraído)
    const altPattern = /([A-ZÀ-Ú][^()]*[A-ZÀ-Ú])\s*\([^)]*\)\s+([A-Z]{3,}\d{2,}[A-Z]?)\s+\d+\s+[\d.]+\s+(APR|CUMP|DISP|REP|REPF|TRANC|CANC)/gi;
    while ((match = altPattern.exec(text)) !== null) {
      const code = match[2];
      const status = match[3];
      
      if (approvedTokens.includes(status) && !rejectedTokens.includes(status)) {
        approved.add(code);
      }
    }
    
    // Processamento fallback para linhas individuais (formatos não estruturados)
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const codes = line.match(codeRegex) || [];
      if (codes.length === 0) continue;

      const hasRejected = rejectedTokens.some(token => line.includes(token));
      const hasApproved = approvedTokens.some(token => line.includes(token));
      
      if (hasApproved && !hasRejected) {
        codes.forEach(c => approved.add(c));
      }
    }

    // Equivalências: "Cumpriu <CODE>" ou "Cumpriu CODE - ..."
    const eqRegex = /Cumpriu\s+([A-Z]{3,}\d{2,}[A-Z]?)/gi;
    let eqMatch;
    while ((eqMatch = eqRegex.exec(text)) !== null) {
      approved.add(eqMatch[1]);
    }

    // Equivalências: "através de CODE - NOME"
    const eqThroughRegex = /através de\s+([A-Z]{3,}\d{2,}[A-Z]?)/gi;
    while ((eqMatch = eqThroughRegex.exec(text)) !== null) {
      approved.add(eqMatch[1]);
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
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const pdfjs = await import('pdfjs-dist');
        const { getDocument, GlobalWorkerOptions } = pdfjs as any;
        
        // Configurar o worker corretamente para Vite
        const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        GlobalWorkerOptions.workerSrc = workerSrc;

        const data = await file.arrayBuffer();
        const pdf = await getDocument({ 
          data,
          // Desabilitar worker para evitar problemas de CORS
          disableWorker: true,
          isEvalSupported: false
        }).promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str || '').join(' ');
          fullText += strings + '\n';
        }
        handleParseImport(fullText);
      } else {
        const text = await file.text();
        handleParseImport(text);
      }
    } catch (err) {
      console.error('Erro ao processar PDF:', err);
      setImportError('Não foi possível ler o PDF. Tente copiar e colar o texto do histórico como alternativa.');
    } finally {
      setIsParsing(false);
      if (event.target) event.target.value = '';
    }
  };

  const applyImportedCodes = (codes: string[]) => {
    codes.forEach(code => {
      if (!completedDisciplines.includes(code)) {
        toggleCompletedDiscipline(code);
      }
    });
  };

  const handleApplyImport = () => {
    if (parsedCodes.length === 0) {
      setImportError('Nenhum código aprovado encontrado para aplicar.');
      return;
    }
    if (isSimplified) {
      setPendingAction({ type: 'import', codes: parsedCodes });
      setShowUpgradeModal(true);
      return;
    }
    applyImportedCodes(parsedCodes);
    setShowImportModal(false);
  };

  const coursesByLevel = useMemo(
      () =>
          reduce<Course, Record<string, Course[]>>((acc, course) => {
            const level = course.level
            acc[level] = append(course, acc[level] ?? []);
            return acc;
          }, {}, courses),
      [courses]
  );

  const allCoursesByCode = useMemo(() => new Map(allCourses.map((c) => [c.code, c])), [allCourses]);

  // Prefetch prereqs from course detail for courses without prereqs info
  useEffect(() => {
    const missing = courses
      .filter((c) => getPrereqCodes(c).length === 0 && !prereqCache.has(c.code) && (c as any).detail_url)
      .map((c) => ({ code: c.code, url: (c as any).detail_url }));
    if (missing.length === 0) return;

    (async () => {
      const updates = new Map(prereqCache);
      for (const item of missing) {
        try {
          const detail = await fetchCourseDetail(item.url);
          const prereqs = (detail as any)?.prerequisites ?? [];
          const codes = getPrereqCodes({ prerequisites: prereqs } as any);
          updates.set(item.code, codes);
        } catch (e) {
          console.warn('Falha ao buscar pré-requisitos para', item.code, e);
        }
      }
      setPrereqCache(updates);
    })();
  }, [courses, prereqCache]);


  const normalizeCode = (val: any) => String(val || '').trim();

  const extractCodesFromString = (str: string) => {
    if (!str) return [] as string[];
    const matches = str.match(codeRegex) || [];
    if (matches.length > 0) return matches;
    return str
      .split(/[,;/|]/)
      .map((p) => p.trim())
      .filter(Boolean);
  };

  const baseCode = (code: string) => {
    const clean = code.replace(/[^A-Z0-9]/gi, '');
    const m = clean.match(/^([A-Z]+\d+)([A-Z])?$/);
    if (!m) return clean;
    return m[1];
  };

  const getPrereqCodes = (course?: Course | null) => {
    if (!course) return [] as string[];
    const raw: any =
      (course as any).prerequisites ??
      (course as any).prereqs ??
      (course as any).prerequisite_codes ??
      (course as any).prereq_codes ??
      (course as any).pre_requisites ??
      (course as any).requisites ??
      [];

    const asArray = Array.isArray(raw) ? raw : [raw];

    const extractCodes = (item: any): string[] => {
      if (!item) return [] as string[];
      if (Array.isArray(item)) {
        return item.flatMap(extractCodes);
      }
      // Object with code field
      if (typeof item === 'object') {
        const maybeCode = (item as any).code ?? (item as any).id_ref ?? (item as any).sigla;
        if (maybeCode) return [normalizeCode(maybeCode)];
        return Object.values(item).flatMap(extractCodes);
      }
      // String with codes and description
      const str = normalizeCode(item);
      if (!str) return [] as string[];
      return extractCodesFromString(str);
    };

    const codes = asArray.flatMap(extractCodes);

    return Array.from(new Set(codes));
  };

  // Função para encontrar a opção de pré-requisitos correspondente ao curso do usuário
  const findProgramPrereqOption = (course: Course): string[] => {
    let prereqs = getPrereqCodes(course);
    
    // Se não tem pré-requisitos estruturados, retorna array vazio
    if (!Array.isArray(prereqs) || prereqs.length === 0) {
      return [];
    }
    
    // Se é um array simples (não tem múltiplas opções), retorna como está
    if (!Array.isArray(prereqs[0])) {
      return prereqs;
    }
    
    // Tem múltiplas opções - encontrar a correspondente ao curso
    const options = prereqs as string[][];
    const myProgramTitles = new Set(myPrograms.map(p => (p.title || '').trim().toLowerCase()));
    
    // Para cada opção, verificar se corresponde ao curso do usuário
    for (const option of options) {
      // Buscar detalhes dos pré-requisitos para verificar se pertencem ao curso
      const optionDetails = option.map(code => {
        const course = allCoursesByCode.get(code);
        return course;
      }).filter(Boolean);
      
      // Verificar se algum dos pré-requisitos desta opção pertence ao curso do usuário
      const belongsToMyProgram = optionDetails.some((detail: any) => {
        if (!detail || !detail.program) return false;
        const programTitle = (detail.program.title || '').trim().toLowerCase();
        return myProgramTitles.has(programTitle);
      });
      
      if (belongsToMyProgram) {
        return option;
      }
    }
    
    // Se não encontrar correspondência, retorna a primeira opção (fallback)
    return options[0] || [];
  };

  const hasAllPrereqsDone = (course: Course) => {
    const prereqs = findProgramPrereqOption(course);
    
    if (prereqs.length === 0) {
      return true; // Sem pré-requisitos
    }

    return prereqs.every((code) => {
      const norm = normalizeCode(code);
      const base = baseCode(norm);
      return completedDisciplines.some((c) => {
        const cNorm = normalizeCode(c);
        return cNorm === norm || baseCode(cNorm) === base;
      });
    });
  };

  const canTake = (code: string): boolean => {
    const course = courses?.find(c => c.code === code);
    if (!course) return false;
    if (completedDisciplines.includes(code)) return false;
    return hasAllPrereqsDone(course);
  };

  // Sections são carregadas internamente pelo DisciplineDetail

  // Type group (exclusive): all | obrigatoria | optativa
  const [typeFilter, setTypeFilter] = useState<'all' | 'obrigatoria' | 'optativa' | 'geral'>('all');

  // Multi-select filters (AND). Exclude type-related ones from this list.
  const filters = [
    ...(isFull ? [{ id: 'available', label: 'Disponíveis' }] as const : []),
    ...(!isSimplified ? [{ id: 'completed', label: 'Cursadas' }] as const : []),
    { id: 'not_completed', label: 'Não Concluídas' },
    { id: 'favorites', label: 'Favoritos' },
    { id: 'offered', label: 'Ofertada' },
  ];

  // Build rules map for useFilter (excluding 'favorites' which controls layout)
  const rules = useMemo(() => ({
    completed: (c: Course) => completedDisciplines.includes(c.code),
    not_completed: (c: Course) => !completedDisciplines.includes(c.code),
    available: (c: Course) => canTake(c.code),
    favorites: (c: Course) => favoriteCodes.includes(c.code),
    offered: (c: Course) => (c.sections_count ?? 0) > 0,
  }), [completedDisciplines, favoriteCodes]);

  const { isActive, isOnly, isAll, activeIds, apply, toggle } = useFilter<Course>({ rules });

  // Order select state: 'name' (default) | 'sections'
  const [orderBy, setOrderBy] = useState<'name' | 'sections'>('name');
  // Catálogo global da universidade
  const [globalLimit, setGlobalLimit] = useState(60);
  useEffect(() => {
    if (typeFilter === 'geral') {
      setGlobalLimit(60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, orderBy, activeIds, typeFilter]);
  
  

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto animate-fade-in">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">Catálogo de Disciplinas</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            {myPrograms.length > 0 ? (
              <div className="flex flex-wrap gap-2 items-center justify-between w-full">
                <div className="flex flex-wrap gap-2 items-center">
                  {myPrograms.map((p) => (
                    <span
                      key={p.id_ref}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-foreground"
                    >
                      {p.title}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importar histórico
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2 text-warning">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-muted-foreground">
                    Selecione um curso nas configurações para ver apenas as disciplinas do seu curso
                  </p>
                </div>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importar histórico
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquise por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <Collapsible defaultOpen={false}>
          <div className="mb-2 flex items-center justify-between gap-3 max-w-[100vw] overflow-x-auto">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-accent text-sm font-medium'
              )}>
                <span>Filtros</span>
                <Badge variant={isAll ? 'outline' : 'secondary'}>
                  {activeIds.length}
                </Badge>
              </CollapsibleTrigger>
              {/* Ordem dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordem:</span>
                <Select value={orderBy} onValueChange={(v: 'name' | 'sections') => setOrderBy(v)}>
                  <SelectTrigger className="h-9 w-auto min-w-[9rem] rounded-xl border border-border bg-card hover:bg-accent text-sm font-medium px-3">
                    <SelectValue placeholder="Por Nome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sections">Por Turmas</SelectItem>
                    <SelectItem value="name">Por Nome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <CollapsibleContent>
            <div className="flex flex-wrap gap-2 mb-6 p-1 max-w-[100vw]">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all",
                    isActive(f.id)
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {!isSimplified && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success" />
              <span className="text-sm text-muted-foreground">Cursada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning" />
              <span className="text-sm text-muted-foreground">Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <span className="text-sm text-muted-foreground">Bloqueada</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : typeFilter === 'geral' ? (
          <div className="space-y-6">
            <motion.div
              key="catalogo-geral"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <h3 className="font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                Catálogo Global
              </h3>
              {(() => {
                const searched = fuzzyFilter<CourseApi>(allCourses, search, ['name', 'code']);
                let filtered = apply(searched);
                // Ordenação
                filtered = [...filtered].sort((a, b) => {
                  if (orderBy === 'sections') {
                    const diff = (b.sections_count ?? 0) - (a.sections_count ?? 0);
                    if (diff !== 0) return diff;
                    return a.name.localeCompare(b.name);
                  }
                  return a.name.localeCompare(b.name);
                });
                const total = filtered.length;
                const items = filtered.slice(0, globalLimit);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                      {items.map((course) => (
                        <motion.div
                          key={course.code}
                          layout
                          layoutId={`course-${course.code}`}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        >
                          <DisciplineCard
                            discipline={course}
                            available={true}
                            blocked={false}
                            onClick={() => setSelectedDiscipline(course)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {globalLimit < total && (
                      <div className="col-span-2 md:col-span-3 flex justify-center mt-2">
                        <Button
                          variant="secondary"
                          className="rounded-xl"
                          onClick={() => setGlobalLimit((v) => Math.min(v + 60, total))}
                        >
                          Mostrar mais ({Math.max(0, total - globalLimit)})
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </div>
        ) : courses.length > 0 ? (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
            {(() => {
              const optCheck = (l: string) => /optat/i.test(l);
              const orderedLevels = [
                ...levels.filter((l) => !optCheck(l)),
                ...levels.filter((l) => optCheck(l)),
              ];
              return orderedLevels;
            })().map((level) => {
              const semesterCourses = coursesByLevel[level] || [];
              const searched = fuzzyFilter<CourseApi>(semesterCourses, search, ['name', 'code']);
              // Apply AND filters (favorites, completed, available, etc.)
              let filteredSemesterCourses = apply(searched);
              // Apply type group (exclusive)
              if (typeFilter !== 'all') {
                const matchKey = typeFilter === 'obrigatoria' ? 'obrig' : 'optat';
                filteredSemesterCourses = filteredSemesterCourses.filter((c) =>
                  (c.type || '').toString().toLowerCase().includes(matchKey),
                );
              }
              // Apply ordering
              filteredSemesterCourses = [...filteredSemesterCourses].sort((a, b) => {
                if (orderBy === 'sections') {
                  const diff = (b.sections_count ?? 0) - (a.sections_count ?? 0);
                  if (diff !== 0) return diff;
                  return a.name.localeCompare(b.name);
                }
                return a.name.localeCompare(b.name);
              });

              if (filteredSemesterCourses.length === 0) return null;

              return (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <h3 className="font-semibold text-card-foreground mb-4 pb-2 border-b border-border">
                    {getSemesterTitle(level)}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                    {filteredSemesterCourses.map((course) => {
                      const completed = completedDisciplines.includes(course.code);
                      const available = !completed && hasAllPrereqsDone(course);
                      const blocked = !completed && !available;
                      const availableProp = available;
                      const blockedProp = blocked;

                      return (
                        <motion.div
                          key={course.code}
                          layout
                          layoutId={`course-${course.code}`}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        >
                          <DisciplineCard
                            discipline={course}
                            available={availableProp}
                            blocked={blockedProp}
                            onClick={() => setSelectedDiscipline(course)}
                            onRestrictedAction={handleRestrictedAction}
                          />
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma disciplina encontrada
            </p>
          </div>
        )}

        {selectedDiscipline && (
          <DisciplineDetail
            discipline={selectedDiscipline}
            onClose={() => setSelectedDiscipline(null)}
          />
        )}

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
                        Envie o PDF ou cole o texto do histórico para marcar disciplinas cursadas.
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

                  {isParsing && <p className="text-sm text-muted-foreground">Lendo PDF...</p>}
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
                    Aplicar e marcar cursadas
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Boas-Vindas da tela Disciplinas */}
        <AnimatePresence>
          {showDisciplinesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowDisciplinesModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border/60 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">Disciplinas</p>
                      <p className="text-sm text-muted-foreground">Gerencie sua grade curricular</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDisciplinesModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm text-foreground leading-relaxed">
                    Aqui você pode indicar quais disciplinas já realizou, ver detalhes sobre as disciplinas da grade, 
                    e ter uma visualização otimizada com base no semestre, optativas e obrigatórias.
                  </p>
                  {isFull && (
                    <p className="text-sm text-muted-foreground">
                      Na experiência completa, isso otimiza na hora de fazer o planejamento da grade, 
                      mostrando apenas as disciplinas disponíveis e compatíveis com seu progresso.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  {isSimplified && (
                    <button
                      onClick={() => {
                        setMode('full');
                        setShowDisciplinesModal(false);
                        localStorage.setItem('firstVisitDisciplinas', 'true');
                      }}
                      className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted"
                    >
                      Mudar para modo completo
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDisciplinesModal(false);
                      localStorage.setItem('firstVisitDisciplinas', 'true');
                    }}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
                  >
                    Continuar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Modal de Upgrade para Modo Completo */}
        <AnimatePresence>
          {showUpgradeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowUpgradeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border/60 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">Modo Completo</p>
                      <p className="text-sm text-muted-foreground">Desbloqueie recursos avançados</p>
                    </div>
                  </div>
                  <button onClick={() => setShowUpgradeModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm text-foreground leading-relaxed">
                    {pendingAction?.type === 'favorite' 
                      ? 'Para favoritar disciplinas, você precisa usar o modo completo.'
                      : 'Para marcar disciplinas como cursadas, você precisa usar o modo completo.'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Deseja mudar para o modo completo para acessar esta funcionalidade?
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowUpgradeModal(false);
                      setPendingAction(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmUpgrade}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
                  >
                    Mudar para Completo
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Modal de disciplina bloqueada por pré-requisitos */}
          <AnimatePresence>
            {showBlockedModal && pendingAction?.course && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                onClick={() => setShowBlockedModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 20 }}
                  className="bg-background rounded-xl shadow-xl max-w-md w-full border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">Disciplina Bloqueada</p>
                        <p className="text-sm text-muted-foreground">Pré-requisitos não cursados</p>
                      </div>
                    </div>
                    <button onClick={() => setShowBlockedModal(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{pendingAction.course.code} - {pendingAction.course.name}</span> possui pré-requisitos que ainda não foram cursados:
                    </p>
                    
                    <div className="space-y-2">
                      {getPrerequisitesList(pendingAction.course).map(prereqCode => (
                        <div key={prereqCode} className="flex items-center gap-2 text-sm">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            completedDisciplines.includes(prereqCode) 
                              ? "bg-success" 
                              : "bg-muted"
                          )} />
                          <span className={cn(
                            completedDisciplines.includes(prereqCode)
                              ? "text-success line-through"
                              : "text-foreground"
                          )}>
                            {prereqCode}
                          </span>
                          {completedDisciplines.includes(prereqCode) && (
                            <span className="text-xs text-success">✓ Cursado</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Como você deseja prosseguir?
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end p-6 border-t">
                    <button
                      onClick={() => {
                        setShowBlockedModal(false);
                        setPendingAction(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={markOnlyCurrentAsCompleted}
                      className="px-4 py-2 rounded-lg bg-warning/10 text-warning text-sm font-semibold hover:bg-warning/20"
                    >
                      Marcar apenas esta
                    </button>
                    <button
                      onClick={markPrereqsAsCompleted}
                      className="px-4 py-2 rounded-lg bg-success text-success-foreground text-sm font-semibold hover:bg-success/90"
                    >
                      Marcar pré-requisitos + esta
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};

export default Disciplinas;
