import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'warning' | 'danger' | 'success' | 'overload';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = ''
}) => {
  const styles = {
    info: 'bg-blue-50 border-l-4 border-l-[#003366] border-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    warning: 'bg-amber-50 border-l-4 border-l-[#d97706] border-slate-300 text-slate-800 dark:bg-amber-950/40 dark:text-amber-200',
    danger: 'bg-rose-50 border-l-4 border-l-[#b91c1c] border-slate-300 text-slate-900 dark:bg-rose-950/40 dark:text-rose-200',
    success: 'bg-emerald-50 border-l-4 border-l-[#15803d] border-slate-300 text-slate-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    overload: 'bg-red-100 border-l-4 border-l-[#7f1d1d] border-red-300 text-red-950 font-semibold'
  };

  const icons = {
    info: <Info className="w-4 h-4 text-[#003366] dark:text-blue-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />,
    danger: <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0 mt-0.5" />,
    overload: <AlertTriangle className="w-4 h-4 text-[#7f1d1d] shrink-0 mt-0.5" />
  };

  return (
    <div className={`p-3 border flex items-start gap-3 text-xs sm:text-sm ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="flex-1">
        {title && <strong className="block font-semibold mb-0.5">{title}</strong>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
