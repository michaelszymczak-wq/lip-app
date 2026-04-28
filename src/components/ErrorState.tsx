import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  message: string;
  endpoint?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, endpoint, onRetry }: Props) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">{message}</p>
        {endpoint && (
          <p className="text-xs text-red-600 font-mono mt-0.5 truncate">
            Endpoint: {endpoint}
          </p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2.5 py-1.5 rounded transition-colors shrink-0"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}
