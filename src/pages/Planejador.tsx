import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ScheduleGrid } from '@/components/planner/ScheduleGrid';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { useApp } from '@/contexts/AppContext';
import { Course, Section } from '@/services/api';
import { Clock, Users, Plus, BadgeInfo, AlertTriangle, AlertCircle, Star, Flame, Trash2, BookOpen, GraduationCap, School, Filter, X, Calendar, CheckCircle } from 'lucide-react';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import { cn, getReservedUnfilledBonus, getReservedUnfilledForTitles } from '@/lib/utils';
import { useMyCourses } from "@/hooks/useMyCourses.ts";
import { useMySections } from '@/hooks/useMySections';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCompetitionLevel, getPhase1Level, getPhase2Level } from '@/lib/competition';
import { useCourseSections } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getSpplitedCode } from '@/lib/schedule';

const diasSemana = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const mapSiglaParaNome = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado"
};
const horariosGrade = [
  "07:00", "07:55", "08:50", "09:45", "10:40", "11:35", "13:00", "13:55", 
  "14:50", "15:45", "16:40", "17:35", "18:30", "19:25", "20:20", "21:15"
];

// Função helper para parsear time_codes e converter para formato de horários
const parseTimeCodes = (timeCodes: string[]): Array<{ dia: string; horarioInicio: string; horarioFim: string }> => {
  const horarios: Array<{ dia: string; horarioInicio: string; horarioFim: string }> = [];
  
  const dayMap: Record<string, string> = {
    '2': 'Segunda',
    '3': 'Terça',
    '4': 'Quarta',
    '5': 'Quinta',
    '6': 'Sexta',
    '7': 'Sábado',
  };

  for (const code of timeCodes) {
    const discreteCodes = getSpplitedCode(code);
    for (const discreteCode of discreteCodes) {
      const match = discreteCode.match(/^([2-7])([MTN])([1-6])$/i);
      if (!match) continue;
      
      const [, dayNum, shift, slotStr] = match;
      const day = dayMap[dayNum];
      const base = shift === 'M' ? 7 : shift === 'T' ? 13 : 18;
      const slot = parseInt(slotStr, 10);
      const startHour = base + (slot - 1);
      const endHour = startHour + 1;
      
      if (day) {
        horarios.push({
          dia: day,
          horarioInicio: `${startHour.toString().padStart(2, '0')}:00`,
          horarioFim: `${endHour.toString().padStart(2, '0')}:00`
        });
      }
    }
  }

  return horarios;
};

const Planejador = () => {
  const { myPrograms } = useMyPrograms();
  const { courses, isLoading: loadingCourses } = useMyCourses();
  const [selectedDiscipline, setSelectedDiscipline] = useState<Course | null>(null);
  const [showSections, setShowSections] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroModalOpen, setFiltroModalOpen] = useState(false);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>([]);
  const [logicaFiltroDia, setLogicaFiltroDia] = useState<'OU' | 'E'>('OU');
  const [logicaFiltroHorario, setLogicaFiltroHorario] = useState<'OU' | 'E'>('OU');
  // Estados para restrições de horário
  const [diasRestritos, setDiasRestritos] = useState<string[]>([]);
  const [logicaRestricoes, setLogicaRestricoes] = useState<'OU' | 'E'>('OU');
  const [horariosRestritos, setHorariosRestritos] = useState<string[]>([]);
  const [logicaRestricoesHorario, setLogicaRestricoesHorario] = useState<'OU' | 'E'>('OU');
  
  const { hasSectionOnCourse, toggleSection, getConflictsForSection, mySections, clearSections } = useMySections();
  const myProgramTitles = new Set(myPrograms.map(p => (p.title || '').trim().toLowerCase()));

  const isLoading = loadingCourses;

  // Filtrar disciplinas por termo de busca e filtros
  const disciplinasFiltradas = useMemo(() => {
    if (!courses) return [];
    
    let result = [...courses];
    
    // Aplicar filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(course => 
        course.code.toLowerCase().includes(term) || 
        course.name.toLowerCase().includes(term)
      );
    }
    
    // Nota: A filtragem por horários/dias será feita quando as seções forem carregadas
    // Por enquanto, apenas retornamos as disciplinas filtradas por busca
    
    return result;
  }, [courses, searchTerm]);

  // Função para carregar as turmas de uma disciplina
  const handleShowSections = (course: Course) => {
    setSelectedCourse(course);
    setShowSections(true);
  };

  // Fechar o modal de turmas
  const handleCloseSections = () => {
    setShowSections(false);
    setSelectedCourse(null);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setDiasSelecionados([]);
    setHorariosSelecionados([]);
    setLogicaFiltroDia('OU');
    setLogicaFiltroHorario('OU');
    setDiasRestritos([]);
    setLogicaRestricoes('OU');
    setHorariosRestritos([]);
    setLogicaRestricoesHorario('OU');
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setFiltroModalOpen(false);
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Planejador de Grade
          </h1>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Monte sua grade horária para o próximo semestre
            </p>
            {myPrograms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {myPrograms.map((p) => (
                  <span
                    key={p.id_ref}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-foreground"
                  >
                    {p.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da esquerda - Disciplinas */}
          <div className="lg:col-span-1 space-y-4">
            {/* Card de Disciplinas */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-card-foreground">Disciplinas do Curso</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border cursor-default">
                  {courses?.length || 0} disciplinas
                </span>
              </div>

              {/* Barra de busca e filtros */}
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-3 gap-2">
                <input
                  type="text"
                  placeholder="Buscar disciplina..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300 md:w-auto"
                  style={{ minWidth: 0 }}
                />
                <button
                  type="button"
                  className="flex items-center gap-1 border rounded px-3 py-2 text-sm bg-muted hover:bg-muted/70 transition"
                  onClick={() => setFiltroModalOpen(true)}
                >
                  <Filter className="w-4 h-4" />
                  Filtrar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {isLoading ? (
                  [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
                ) : disciplinasFiltradas?.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">Nenhuma disciplina encontrada</p>
                    {searchTerm && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setSearchTerm('')}
                      >
                        Limpar busca
                      </Button>
                    )}
                  </div>
                ) : (
                  disciplinasFiltradas.map((course) => (
                    <div 
                      key={course.code}
                      onClick={() => handleShowSections(course)}
                      className="p-3 md:p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="font-semibold text-xs md:text-sm mb-1">{course.code}</div>
                      <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {course.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {course.sections_count} turma{course.sections_count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Coluna da direita - Grade Horária */}
          <div className="lg:col-span-2">
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Grade Atual</h2>
                  <p className="text-sm md:text-base text-gray-600">
                    Visualize as disciplinas convertidas e organizadas
                  </p>
                </div>
                {mySections.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearSections} className="w-full sm:w-auto">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Grade
                  </Button>
                )}
              </div>

              {mySections.length === 0 ? (
                <Card>
                  <CardContent className="p-8 md:p-12 text-center">
                    <Calendar className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-base md:text-lg font-semibold mb-2">Grade vazia</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Adicione turmas da lista de disciplinas para visualizar a grade horária.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-card">
                  <ScheduleGrid onSectionClick={(section) => setSelectedSection(section)} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Filtros */}
        <AnimatePresence>
          {filtroModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setFiltroModalOpen(false)}>
              <motion.div 
                className="bg-background rounded-lg p-4 w-full max-w-sm max-h-[85vh] overflow-y-auto md:max-w-lg md:p-6 shadow-lg border" 
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Filtro de matérias</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFiltroModalOpen(false)}
                    className="hover:bg-gray-100"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {/* Filtro por Dia */}
                  <div>
                    <div className="font-semibold mb-2 text-sm text-gray-900">Dias da semana:</div>
                    <div className="grid grid-cols-3 md:flex md:flex-wrap gap-2">
                      {diasSemana.map(dia => (
                        <label key={dia} className="flex items-center gap-2 p-2 border rounded bg-white hover:bg-blue-50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={diasSelecionados.includes(dia)}
                            onChange={e => {
                              if (e.target.checked) setDiasSelecionados([...diasSelecionados, dia]);
                              else setDiasSelecionados(diasSelecionados.filter(d => d !== dia));
                            }}
                            className="accent-blue-600"
                          />
                          <span className="text-sm font-medium">{dia}</span>
                        </label>
                      ))}
                    </div>
                    <div className="font-semibold mt-3 mb-2 text-sm text-gray-900">Lógica para dias:</div>
                    <div className="space-y-2 md:flex md:gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={logicaFiltroDia === 'OU'}
                          onChange={() => setLogicaFiltroDia('OU')}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">OU (um dia ou outro)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={logicaFiltroDia === 'E'}
                          onChange={() => setLogicaFiltroDia('E')}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">E (um dia e outro)</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Filtro por Horário */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-gray-900">Horários</h4>
                    <div className="grid grid-cols-4 md:flex md:flex-wrap gap-1 md:gap-2 max-h-32 overflow-y-auto">
                      {horariosGrade.map(horario => (
                        <label key={horario} className="flex items-center gap-1 p-1 md:p-2 border rounded text-xs md:text-sm bg-white hover:bg-blue-50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={horariosSelecionados.includes(horario)}
                            onChange={e => {
                              if (e.target.checked) setHorariosSelecionados([...horariosSelecionados, horario]);
                              else setHorariosSelecionados(horariosSelecionados.filter(h => h !== horario));
                            }}
                            className="accent-blue-600"
                          />
                          <span className="font-medium">{horario}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="font-semibold mt-3 mb-2 text-sm text-gray-900">Lógica para horários:</div>
                    <div className="space-y-2 md:flex md:gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={logicaFiltroHorario === 'OU'}
                          onChange={() => setLogicaFiltroHorario('OU')}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">OU (um horário ou outro)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={logicaFiltroHorario === 'E'}
                          onChange={() => setLogicaFiltroHorario('E')}
                          className="accent-blue-600"
                        />
                        <span className="text-sm">E (um horário e outro)</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Restrições de Dias */}
                  <div>
                    <div className="font-semibold mb-2 text-sm text-gray-900">Restrições de Dias (dias que NÃO quer):</div>
                    <div className="grid grid-cols-3 md:flex md:flex-wrap gap-2">
                      {diasSemana.map(dia => (
                        <label key={dia} className="flex items-center gap-2 p-2 border rounded bg-white hover:bg-blue-50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={diasRestritos.includes(dia)}
                            onChange={e => {
                              if (e.target.checked) setDiasRestritos([...diasRestritos, dia]);
                              else setDiasRestritos(diasRestritos.filter(d => d !== dia));
                            }}
                            className="accent-red-600"
                          />
                          <span className="text-sm font-medium">{dia}</span>
                        </label>
                      ))}
                    </div>
                    <div className="font-semibold mt-3 mb-2 text-sm text-gray-900">Lógica para restrições de dias:</div>
                    <div className="space-y-2 md:flex md:gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={logicaRestricoes === 'OU'}
                          onChange={() => setLogicaRestricoes('OU')}
                          className="accent-red-600"
                        />
                        <span className="text-sm">OU (um dia restrito ou outro)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={logicaRestricoes === 'E'}
                          onChange={() => setLogicaRestricoes('E')}
                          className="accent-red-600"
                        />
                        <span className="text-sm">E (um dia restrito e outro)</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Restrições de Horário */}
                  <div>
                    <div className="font-semibold mb-2 text-sm text-gray-900">Restrições de Horário (horários que NÃO quer):</div>
                    <div className="grid grid-cols-4 md:flex md:flex-wrap gap-1 md:gap-2 max-h-32 overflow-y-auto">
                      {horariosGrade.map(horario => (
                        <label key={horario} className="flex items-center gap-1 p-1 md:p-2 border rounded text-xs md:text-sm bg-white hover:bg-blue-50 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={horariosRestritos.includes(horario)}
                            onChange={e => {
                              if (e.target.checked) setHorariosRestritos([...horariosRestritos, horario]);
                              else setHorariosRestritos(horariosRestritos.filter(h => h !== horario));
                            }}
                            className="accent-red-600"
                          />
                          <span className="font-medium">{horario}</span>
                        </label>
                      ))}
                    </div>
                    <div className="font-semibold mt-3 mb-2 text-sm text-gray-900">Lógica para restrições de horário:</div>
                    <div className="space-y-2 md:flex md:gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={logicaRestricoesHorario === 'OU'}
                          onChange={() => setLogicaRestricoesHorario('OU')}
                          className="accent-red-600"
                        />
                        <span className="text-sm">OU (um horário restrito ou outro)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={logicaRestricoesHorario === 'E'}
                          onChange={() => setLogicaRestricoesHorario('E')}
                          className="accent-red-600"
                        />
                        <span className="text-sm">E (um horário restrito e outro)</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Botões de ação */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium transition-colors"
                      onClick={limparFiltros}
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                      onClick={aplicarFiltros}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal de Turmas Disponíveis */}
        <AnimatePresence>
          {showSections && selectedCourse && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseSections}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-background rounded-lg p-4 w-full max-w-sm max-h-[85vh] overflow-y-auto md:max-w-2xl md:p-6 shadow border"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">{selectedCourse.code}</h3>
                    <p className="text-muted-foreground">{selectedCourse.name}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleCloseSections}>✕</Button>
                </div>
                
                <div className="space-y-6">
                  <SectionsList courseCode={selectedCourse.code} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal de Detalhes da Seção */}
        {selectedSection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSection(null)}>
            <div className="bg-background rounded-lg p-4 w-full max-w-sm max-h-[85vh] overflow-y-auto md:max-w-2xl md:p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">
                    {(selectedSection as any)?.course?.code || (selectedSection as any)?.course_code || 'N/A'}
                  </h3>
                  <p className="text-muted-foreground">
                    {(selectedSection as any)?.course?.name || 'Nome não disponível'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSection(null)}>✕</Button>
              </div>
              
              <div className="space-y-6">
                <div className="border rounded-lg p-4 md:p-6 bg-muted/30">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs md:text-sm px-3 py-1">
                        {(selectedSection as any)?.section_code || selectedSection.id_ref}
                      </Badge>
                      <Badge variant="outline" className="text-xs md:text-sm px-3 py-1">
                        {((selectedSection as any)?.seats_count ?? 0) === 0 
                          ? 'Sem informação' 
                          : `${(selectedSection as any)?.seats_count} vagas`}
                      </Badge>
                      {(() => {
                        const conflicts = getConflictsForSection(selectedSection);
                        if (conflicts.length > 0) {
                          return (
                            <Badge variant="destructive" className="text-xs md:text-sm px-3 py-1">
                              Conflito de horário
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="mt-2 md:mt-0 px-4 py-2 text-xs md:text-sm flex items-center gap-2"
                      onClick={() => {
                        toggleSection(selectedSection);
                        setSelectedSection(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remover da Grade
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-muted-foreground">Docente:</span>
                        <p className="mt-1">
                          {Array.isArray((selectedSection as any)?.teachers) && (selectedSection as any).teachers.length > 0
                            ? (selectedSection as any).teachers.join(', ')
                            : ((selectedSection as any)?.professor || 'Professor(a) não definido')}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-muted-foreground">Período:</span>
                        <p className="mt-1">{(selectedSection as any)?.period || 'Não informado'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-muted-foreground">Horários:</span>
                        <p className="mt-1">
                          {Array.isArray(selectedSection.time_codes) && selectedSection.time_codes.length > 0
                            ? selectedSection.time_codes.join(', ')
                            : 'Horário não definido'}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(() => {
                            const timeCodes = Array.isArray(selectedSection.time_codes) ? selectedSection.time_codes : [];
                            const horariosParsed = parseTimeCodes(timeCodes);
                            if (horariosParsed.length > 0) {
                              return horariosParsed.map((h, idx) => (
                                <span key={idx} className="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs font-mono">
                                  {h.dia} {h.horarioInicio} - {h.horarioFim}
                                </span>
                              ));
                            }
                            return (
                              <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">Horário não informado</span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações de vagas */}
                  {((selectedSection as any)?.seats_count ?? 0) > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>
                          Vagas: {(selectedSection as any)?.seats_accepted ?? 0}/{(selectedSection as any)?.seats_count ?? 0}
                        </span>
                        <span>
                          {Math.round((((selectedSection as any)?.seats_accepted ?? 0) / ((selectedSection as any)?.seats_count ?? 1)) * 100)}% preenchido
                        </span>
                      </div>
                      <Progress 
                        value={Math.round((((selectedSection as any)?.seats_accepted ?? 0) / ((selectedSection as any)?.seats_count ?? 1)) * 100)} 
                        className="h-2" 
                      />
                    </div>
                  )}

                  {/* Conflitos */}
                  {(() => {
                    const conflicts = getConflictsForSection(selectedSection);
                    if (conflicts.length > 0) {
                      // Agrupar conflitos por código de disciplina para evitar duplicatas
                      const uniqueConflicts = conflicts.reduce((acc, conflict) => {
                        const conflictSection = conflict.section;
                        const conflictCode = (conflictSection as any)?.course?.code || (conflictSection as any)?.course_code || 'N/A';
                        if (!acc.find(c => c.code === conflictCode)) {
                          acc.push({
                            code: conflictCode,
                            name: (conflictSection as any)?.course?.name || 'Nome não disponível',
                            section: conflictSection
                          });
                        }
                        return acc;
                      }, [] as Array<{ code: string; name: string; section: Section }>);

                      return (
                        <div className="mt-4 pt-4 border-t border-destructive/20">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
                            <span className="font-semibold text-destructive">Conflitos de horário detectados:</span>
                          </div>
                          <div className="space-y-2">
                            {uniqueConflicts.map((conflict, idx) => {
                              const conflictTimeCodes = Array.isArray(conflict.section.time_codes) ? conflict.section.time_codes : [];
                              const conflictHorariosParsed = parseTimeCodes(conflictTimeCodes);
                              
                              return (
                                <div key={idx} className="p-3 bg-destructive/10 border-2 border-destructive/50 shadow-destructive/10 rounded-lg flex gap-2 items-center">
                                  <span className="flex items-center px-1 py-0.5 bg-destructive text-white text-xs rounded select-none"><AlertTriangle className="w-3 h-3 mr-1"/> Conflito</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-destructive text-xs mb-0.5 truncate">
                                      {conflict.code}
                                    </div>
                                    <div className="text-muted-foreground text-[10px] mb-1 truncate">
                                      {conflict.name}
                                    </div>
                                    {conflictHorariosParsed.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                        {conflictHorariosParsed.map((h, hIdx) => (
                                          <span key={hIdx} className="inline-block bg-destructive/20 text-destructive rounded px-2 py-0.5 text-xs font-mono border border-destructive/30">
                                            {h.dia} {h.horarioInicio} - {h.horarioFim}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-destructive mt-3 italic font-semibold flex gap-2 items-center">
                            <AlertTriangle className="w-4 h-4" /> Há choque de horário com outra(s) turma(s) selecionada(s).
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

// Componente para listar as seções de uma disciplina
function SectionsList({ courseCode }: { courseCode: string }) {
  const { data: sections = [], isLoading } = useCourseSections(courseCode);
  const { toggleSection, hasSectionOnCourse, getConflictsForSection } = useMySections();
  const { myPrograms } = useMyPrograms();
  const myProgramTitles = new Set(myPrograms.map(p => (p.title || '').trim().toLowerCase()));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma turma disponível para esta disciplina.</p>
      </div>
    );
  }

  return (
    <>
      {sections.map((section, index) => {
        const teachers = Array.isArray((section as any)?.teachers) 
          ? (section as any).teachers 
          : ((section as any)?.professor ? [(section as any).professor] : []);
        const timeCodes = Array.isArray(section.time_codes) ? section.time_codes : [];
        const seatsAccepted = (section as any)?.seats_accepted ?? 0;
        const seatsCount = (section as any)?.seats_count ?? 0;
        const progress = seatsCount > 0 ? Math.min(100, Math.max(0, Math.round((seatsAccepted / seatsCount) * 100))) : 0;
        const seatsRequested = (section as any)?.seats_requested ?? 0;
        const seatsRerequested = (section as any)?.seats_rerequested ?? 0;
        const competition = getCompetitionLevel(seatsCount, seatsRequested, seatsRerequested);
        const compPhase1 = getPhase1Level(seatsCount, seatsRequested);
        const compPhase2 = getPhase2Level(seatsCount, seatsAccepted, seatsRerequested);
        const isSelected = hasSectionOnCourse(courseCode);
        const conflicts = getConflictsForSection(section);
        const hasConflict = conflicts.length > 0;
        const available = Math.max(0, seatsCount - seatsAccepted);
        const isAlmostFull = available > 0 && available <= 5;
        const hasExclusive = Array.isArray((section as any)?.spots_reserved) && 
          ((section as any).spots_reserved as any[]).some((r: any) => {
            const t = ((r as any)?.program?.title || '').trim().toLowerCase();
            return t && myProgramTitles.has(t);
          });
        const reservedMine = getReservedUnfilledForTitles(section as any, myProgramTitles);
        const horariosParsed = parseTimeCodes(timeCodes);

        return (
          <div key={section.id_ref} className="border rounded-lg p-4 md:p-6 bg-muted/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs md:text-sm px-3 py-1">
                  {section.code || `Turma ${section.id_ref}`}
                </Badge>
                <Badge variant="outline" className="text-xs md:text-sm px-3 py-1">
                  {seatsCount === 0 ? 'Sem informação' : `${seatsCount} vagas`}
                </Badge>
                {isSelected && (
                  <Badge variant="default" className="text-xs md:text-sm px-3 py-1">
                    Selecionada
                  </Badge>
                )}
                {hasConflict && (
                  <Badge variant="destructive" className="text-xs md:text-sm px-3 py-1">
                    Conflito
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                className="mt-2 md:mt-0 px-4 py-2 text-xs md:text-sm flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
                onClick={() => toggleSection(section)}
                disabled={isSelected && hasConflict}
                variant={isSelected ? "destructive" : "default"}
              >
                <Plus className="w-4 h-4 mr-1" />
                {isSelected ? 'Remover' : 'Adicionar'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-muted-foreground">Docente:</span>
                  <p className="mt-1">{teachers.length > 0 ? teachers.join(', ') : 'Professor(a) não definido'}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Período:</span>
                  <p className="mt-1">{(section as any)?.period || 'Não informado'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-muted-foreground">Horários:</span>
                  <p className="mt-1">{timeCodes.length > 0 ? timeCodes.join(', ') : 'Horário não definido'}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {horariosParsed.length > 0 ? (
                      horariosParsed.map((h, idx) => (
                        <span key={idx} className="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs font-mono">
                          {h.dia} {h.horarioInicio} - {h.horarioFim}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">Horário não informado</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {seatsCount > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Vagas: {seatsAccepted}/{seatsCount}</span>
                  <span>{progress}% preenchido</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mt-3">
              {isAlmostFull && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-600/10 text-indigo-600 inline-flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Poucas Vagas
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Restam apenas {available} vagas disponíveis</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {hasExclusive && reservedMine > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary inline-flex items-center gap-1">
                        <Star className="w-3 h-3" /> Reservado ({reservedMine})
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Vagas reservadas para seu(s) curso(s)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {competition === 'high' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-600/10 text-amber-600">
                        Alta concorrência
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Muitos alunos interessados nesta turma</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default Planejador;
