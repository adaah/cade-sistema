import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeepFetchProgressProps {
  current: number;
  total: number;
  currentUrl: string;
  isComplete: boolean;
  error: string | null;
  onDismiss?: () => void;
}

export function DeepFetchProgress({
  current,
  total,
  currentUrl,
  isComplete,
  error,
  onDismiss,
}: DeepFetchProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isVisible = !isComplete || error !== null;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-card border-2 border-border rounded-xl shadow-elevated p-4 animate-slide-in-up">
      <div className="flex items-start gap-3">
        {error ? (
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        ) : isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
        ) : (
          <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-card-foreground text-sm">
              {error ? 'Erro ao buscar dados' : isComplete ? 'Busca concluída!' : 'Buscando informações...'}
            </h3>
            {onDismiss && (isComplete || error) && (
              <button
                onClick={onDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors text-xs"
              >
                Fechar
              </button>
            )}
          </div>

          {error ? (
            <p className="text-sm text-destructive mb-2">{error}</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{current} de {total} URLs</span>
                <span>{percentage}%</span>
              </div>

              <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    isComplete ? "bg-success" : "bg-primary"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground truncate" title={currentUrl}>
                {currentUrl}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

