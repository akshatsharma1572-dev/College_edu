import { forwardRef } from 'react';

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

const base =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-50 disabled:text-slate-500';

export const TextField = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, className = '', ...props }, ref) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        ref={ref}
        className={`${base} ${error ? 'border-error-500 focus:border-error-500' : 'border-slate-300 focus:border-brand-500'} ${className}`}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-xs text-error-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  )
);
TextField.displayName = 'TextField';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: React.ReactNode;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <select
        ref={ref}
        className={`${base} ${error ? 'border-error-500' : 'border-slate-300 focus:border-brand-500'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-error-600">{error}</span>}
    </label>
  )
);
SelectField.displayName = 'SelectField';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        ref={ref}
        className={`${base} ${error ? 'border-error-500' : 'border-slate-300 focus:border-brand-500'} ${className}`}
        rows={3}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-error-600">{error}</span>}
    </label>
  )
);
TextareaField.displayName = 'TextareaField';
