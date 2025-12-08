import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ScheduleGrid } from '@/components/planner/ScheduleGrid';
import { ScheduleSummary } from '@/components/planner/ScheduleSummary';
import { MobileSchedule } from '@/components/planner/MobileSchedule';
import { DisciplineDetail } from '@/components/disciplines/DisciplineDetail';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApp } from '@/contexts/AppContext';
import { useCourses, useSections, usePrograms, useProgramDetail } from '@/hooks/useApi';
import { Course, Section, parseSigaaSchedule } from '@/services/api';
import { Search, Plus, Filter, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const diasSemana = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const mapSiglaParaNome: Record<string, string> = {
  SEG: "Seg",
  TER: "Ter",
  QUA: "Qua",
  QUI: "Qui",
  SEX: "Sex",
  SAB: "Sáb"
};

const horariosGrade = [
  "07:00", "07:55", "08:50", "09:45", "10:40", "11:35", "13:00", "13:55", "14:50", "15:45", "16:40", "17:35", "18:30", "19:25", "20:20", "21:15"
];

// Função auxiliar para parsear horários de uma seção
function parseHorarios(horarioRaw: string | undefined): Array<{ dia: string; horarioInicio: string; horarioFim: string }> {
  if (!horarioRaw) return [];
  
  const schedules = parseSigaaSchedule(horarioRaw);
  return schedules.map(s => ({
    dia: s.day,
    horarioInicio: s.start_time,
    horarioFim: s.end_time
  }));
}

const Planejador = () => {
  const isMobile = useIsMobile();
  const { selectedCourse, scheduledItems, clearSchedule } = useApp();
  const { data: programs } = usePrograms();
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: sections, isLoading: loadingSections } = useSections();
  
  // Buscar detalhes do programa selecionado
  const selectedProgram = programs?.find(p => p.id_ref === selectedCourse);
  const { data: programDetail } = useProgramDetail(selectedProgram?.detail_url);

  const [search, setSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Course | null>(null);
  const [filtroModalOpen, setFiltroModalOpen] = useState(false);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>([]);
  const [logicaFiltroDia, setLogicaFiltroDia] = useState<'OU' | 'E'>('OU');
  const [logicaFiltroHorario, setLogicaFiltroHorario] = useState<'OU' | 'E'>('OU');
  const [diasRestritos, setDiasRestritos] = useState<string[]>([]);
  const [logicaRestricoes, setLogicaRestricoes] = useState<'OU' | 'E'>('OU');
  const [horariosRestritos, setHorariosRestritos] = useState<string[]>([]);
  const [logicaRestricoesHorario, setLogicaRestricoesHorario] = useState<'OU' | 'E'>('OU');

  // Filtrar disciplinas do curso selecionado
  const filteredCoursesByProgram = useMemo(() => {
    if (!courses) return [];
    
    // Se não há curso selecionado, mostrar todas
    if (!selectedCourse || !programDetail) {
      return courses;
    }
    
    // Se o programDetail tem uma lista de courses, usar os códigos
    if (programDetail.courses && Array.isArray(programDetail.courses)) {
      const programCourseCodes = new Set(programDetail.courses.map(c => c.code));
      return courses.filter(c => programCourseCodes.has(c.code));
    }
    
    // Fallback: retornar todas as disciplinas
    return courses;
  }, [courses, selectedCourse, programDetail]);

  // Agrupa disciplinas por código
  const disciplinasOrganizadas = useMemo(() => {
    if (!filteredCoursesByProgram || !sections) return [];

    const disciplinasMap = new Map<string, { course: Course; sections: Section[] }>();

    filteredCoursesByProgram.forEach(course => {
      const courseSections = sections.filter(s => 
        s.course_code === course.code && s.available > 0
      );
      
      if (courseSections.length > 0) {
        disciplinasMap.set(course.code, { course, sections: courseSections });
      }
    });

    return Array.from(disciplinasMap.values());
  }, [filteredCoursesByProgram, sections]);

  // Filtra disciplinas
  const disciplinasFiltradas = useMemo(() => {
    return disciplinasOrganizadas.filter(({ course, sections: courseSections }) => {
      // Filtro de busca
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          course.name.toLowerCase().includes(searchLower) ||
          course.code.toLowerCase().includes(searchLower) ||
          courseSections.some(s => s.professor.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Filtros de dia e horário
      if (diasSelecionados.length > 0 || horariosSelecionados.length > 0 || 
          diasRestritos.length > 0 || horariosRestritos.length > 0) {
        
        const matchesFilter = courseSections.some(section => {
          const horarios = parseHorarios(section.schedule_raw);
          
          // Filtro inclusivo de dias
          let diasOk = true;
          if (diasSelecionados.length > 0) {
            const diasSection = horarios.map(h => {
              const sigla = Object.keys(mapSiglaParaNome).find(s => mapSiglaParaNome[s] === h.dia);
              return sigla;
            }).filter(Boolean) as string[];
            
            if (logicaFiltroDia === 'OU') {
              diasOk = diasSelecionados.some(dia => diasSection.includes(dia));
            } else {
              diasOk = diasSelecionados.every(dia => diasSection.includes(dia));
            }
          }

          // Filtro inclusivo de horários
          let horariosOk = true;
          if (horariosSelecionados.length > 0) {
            const horariosSection = horarios.map(h => h.horarioInicio);
            if (logicaFiltroHorario === 'OU') {
              horariosOk = horariosSelecionados.some(h => horariosSection.includes(h));
            } else {
              horariosOk = horariosSelecionados.every(h => horariosSection.includes(h));
            }
          }

          // Filtro exclusivo de dias
          let restricoesDiasOk = true;
          if (diasRestritos.length > 0) {
            const diasSection = horarios.map(h => {
              const sigla = Object.keys(mapSiglaParaNome).find(s => mapSiglaParaNome[s] === h.dia);
              return sigla;
            }).filter(Boolean) as string[];
            
            if (logicaRestricoes === 'OU') {
              restricoesDiasOk = !diasRestritos.some(dia => diasSection.includes(dia));
            } else {
              restricoesDiasOk = !diasRestritos.every(dia => diasSection.includes(dia));
            }
          }

          // Filtro exclusivo de horários
          let restricoesHorariosOk = true;
          if (horariosRestritos.length > 0) {
            const horariosSection = horarios.map(h => h.horarioInicio);
            if (logicaRestricoesHorario === 'OU') {
              restricoesHorariosOk = !horariosRestritos.some(h => horariosSection.includes(h));
            } else {
              restricoesHorariosOk = !horariosRestritos.every(h => horariosSection.includes(h));
            }
          }

          return diasOk && horariosOk && restricoesDiasOk && restricoesHorariosOk;
        });

        if (!matchesFilter) return false;
      }

      return true;
    });
  }, [disciplinasOrganizadas, search, diasSelecionados, horariosSelecionados, logicaFiltroDia, logicaFiltroHorario, diasRestritos, horariosRestritos, logicaRestricoes, logicaRestricoesHorario]);

  // Get sections for selected discipline
  const selectedSections = useMemo(() => {
    if (!selectedDiscipline || !sections) return [];
    return sections.filter(s => s.course_code === selectedDiscipline.code);
  }, [selectedDiscipline, sections]);

  const limparFiltro = () => {
    setDiasSelecionados([]);
    setHorariosSelecionados([]);
    setLogicaFiltroDia('OU');
    setLogicaFiltroHorario('OU');
    setDiasRestritos([]);
    setLogicaRestricoes('OU');
    setHorariosRestritos([]);
    setLogicaRestricoesHorario('OU');
  };

  const aplicarFiltro = () => {
    setFiltroModalOpen(false);
  };

  const isLoading = loadingCourses || loadingSections;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        {selectedProgram && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">{selectedProgram.title}</span> • {selectedProgram.location}
            </p>
          </div>
        )}
        {!selectedCourse && (
          <div className="mb-4 p-3 bg-warning/10 rounded-lg border border-warning/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            <p className="text-sm text-warning">
              Selecione um curso nas configurações para ver apenas as disciplinas do seu curso
            </p>
          </div>
        )}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {disciplinasFiltradas.length} disciplinas organizadas
              </h1>
            </div>
            {scheduledItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSchedule}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
              placeholder="Buscar disciplina..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
          </div>
          <Button
            variant="outline"
            onClick={() => setFiltroModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </Button>
              </div>

        {/* Modal de Filtro */}
        {filtroModalOpen && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
            onClick={() => setFiltroModalOpen(false)}
          >
            <div 
              className="bg-background rounded-lg p-4 w-full max-w-sm max-h-[85vh] overflow-y-auto md:max-w-lg md:p-6 shadow border" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Filtro de matérias</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFiltroModalOpen(false)} className="hover:bg-gray-100">
                  ✕
                </Button>
                </div>

              <div className="space-y-4">
                {/* Dias da semana */}
                          <div>
                  <div className="font-semibold mb-2 text-sm text-gray-900">Dias da semana:</div>
                  <div className="grid grid-cols-3 gap-2">
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
                  <div className="space-y-2">
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

                {/* Horários */}
                <div>
                  <div className="font-semibold mb-2 text-sm text-gray-900">Horários:</div>
                  <div className="grid grid-cols-4 gap-1 md:gap-2 max-h-32 overflow-y-auto">
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
                  <div className="space-y-2">
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
                  <div className="grid grid-cols-3 gap-2">
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
                  <div className="space-y-2">
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
                  <div className="grid grid-cols-4 gap-1 md:gap-2 max-h-32 overflow-y-auto">
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
                  <div className="space-y-2">
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

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={limparFiltro}
                    className="flex-1"
                  >
                    Limpar
                  </Button>
                  <Button
                    onClick={aplicarFiltro}
                    className="flex-1"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disciplinas List */}
                {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
            {disciplinasFiltradas.map(({ course, sections }) => {
              const totalVagas = sections.reduce((sum, s) => sum + s.available, 0);
                      return (
                <div
                          key={course.code}
                  className="p-3 md:p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedDiscipline(course)}
                >
                  <div className="font-semibold text-sm md:text-base mb-1">{course.code}</div>
                  <div className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">{course.name}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{sections.length} turma(s)</Badge>
                    <Badge variant="outline" className="text-xs">{totalVagas} vagas</Badge>
                              </div>
                            </div>
                      );
                    })}
          </div>
        )}

        {/* Grade Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Grade Atual</h2>
              <p className="text-muted-foreground text-sm">
                Visualize as disciplinas convertidas e organizadas
                      </p>
                  </div>
            {scheduledItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearSchedule}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Grade
              </Button>
                )}
            </div>
            
          {scheduledItems.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 md:p-12 text-center">
              <p className="text-muted-foreground">Grade vazia. Adicione disciplinas para visualizar.</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-4">
              {isMobile ? <MobileSchedule /> : <ScheduleGrid />}
          </div>
        )}
        </div>

        {/* Discipline Detail Modal */}
        {selectedDiscipline && (
          <DisciplineDetail
            discipline={selectedDiscipline}
            sections={selectedSections}
            onClose={() => setSelectedDiscipline(null)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Planejador;
