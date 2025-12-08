import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const dayMap: Record<string, string> = {
  'Seg': 'Seg',
  'Ter': 'Ter',
  'Qua': 'Qua',
  'Qui': 'Qui',
  'Sex': 'Sex',
  'Sáb': 'Sáb'
};

export function MobileSchedule() {
  const [activeDay, setActiveDay] = useState('Seg');
  const { scheduledItems, removeFromSchedule } = useApp();

  const getItemsForDay = (day: string) => {
    return scheduledItems.filter(item => {
      const itemDay = dayMap[item.day] || item.day;
      return itemDay === day;
    });
  };

  const dayItems = getItemsForDay(activeDay);

  // Group by unique discipline-class
  const uniqueItems = dayItems.reduce((acc, item) => {
    const key = `${item.disciplineCode}-${item.classCode}`;
    if (!acc.find(i => `${i.disciplineCode}-${i.classCode}` === key)) {
      acc.push(item);
    }
    return acc;
  }, [] as typeof scheduledItems);

  // Sort by start time
  uniqueItems.sort((a, b) => {
    const aHour = parseInt(a.startTime.split(':')[0]);
    const bHour = parseInt(b.startTime.split(':')[0]);
    return aHour - bHour;
  });

  return (
    <div className="space-y-4">
      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {days.map((day) => {
          const count = getItemsForDay(day).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all relative",
                activeDay === day
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {day}
              {count > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center",
                  activeDay === day
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-primary-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {uniqueItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma aula neste dia
          </div>
        ) : (
          uniqueItems.map((item) => (
            <div
              key={`${item.disciplineCode}-${item.classCode}`}
              className="flex gap-3 animate-fade-in"
            >
              {/* Time */}
              <div className="w-14 flex-shrink-0 text-right">
                <p className="text-sm font-medium text-card-foreground">
                  {item.startTime}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.endTime}
                </p>
              </div>

              {/* Line */}
              <div className="relative flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="w-0.5 flex-1 bg-border" />
              </div>

              {/* Content */}
              <div
                className="flex-1 p-4 rounded-xl border-l-4 bg-card shadow-card mb-2"
                style={{ borderColor: item.color }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-card-foreground">
                      {item.disciplineName}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.classCode} • {item.professor}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromSchedule(item.disciplineCode, item.classCode)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
