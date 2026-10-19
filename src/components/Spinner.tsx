import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-brand-600 ${className}`} />;
}

export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
      <Spinner size={28} />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ButtonSpinner() {
  return <Loader2 size={16} className="animate-spin" />;
}
