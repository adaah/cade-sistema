import { cn } from '@/lib/utils';

interface DisciplineFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  activeSemester: number | null;
  onSemesterChange: (semester: number | null) => void;
}

const filters = [
  { id: 'all', label: 'Todas' },
  { id: 'obrigatoria', label: 'Obrigatórias' },
  { id: 'optativa', label: 'Optativas' },
  { id: 'favorites', label: 'Favoritas' },
  { id: 'completed', label: 'Cursadas' },
];

const semesters = [1, 2, 3, 4, 5, 6];

export function DisciplineFilters({ 
  activeFilter, 
  onFilterChange, 
  activeSemester, 
  onSemesterChange 
}: DisciplineFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeFilter === filter.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Semester filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSemesterChange(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            activeSemester === null
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          Todos
        </button>
        {semesters.map((semester) => (
          <button
            key={semester}
            onClick={() => onSemesterChange(semester)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              activeSemester === semester
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {semester}º Sem
          </button>
        ))}
      </div>
    </div>
  );
}
