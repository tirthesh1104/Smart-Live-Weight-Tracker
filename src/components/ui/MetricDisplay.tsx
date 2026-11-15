import React from 'react';

export interface MetricDisplayProps {
  value: string | number;
  unit?: string;
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  trend?: 'up' | 'down' | 'neutral';
  status?: 'normal' | 'moderate' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
  prefix?: string;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  value,
  unit,
  label,
  sublabel,
  size = 'md',
  status = 'neutral',
  className = '',
  prefix
}) => {
  const sizeClasses = {
    sm: 'text-lg sm:text-xl font-bold',
    md: 'text-xl sm:text-2xl font-bold',
    lg: 'text-2xl sm:text-3xl font-bold',
    xl: 'text-3xl sm:text-4xl font-extrabold'
  };

  const unitSizeClasses = {
    sm: 'text-[11px] font-medium',
    md: 'text-xs font-medium',
    lg: 'text-xs sm:text-sm font-medium',
    xl: 'text-sm sm:text-base font-semibold'
  };

  const statusColors = {
    normal: 'text-emerald-700 dark:text-emerald-400',
    moderate: 'text-amber-700 dark:text-amber-400',
    warning: 'text-amber-600 dark:text-amber-300',
    danger: 'text-red-700 dark:text-red-400',
    info: 'text-sky-700 dark:text-sky-400',
    neutral: 'text-slate-900 dark:text-slate-100'
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </span>
      )}
      <div className="flex items-baseline gap-1 leading-none">
        {prefix && (
          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono">
            {prefix}
          </span>
        )}
        <span
          className={`font-tabular tracking-tight tabular-nums ${sizeClasses[size]} ${statusColors[status]}`}
        >
          {value}
        </span>
        {unit && (
          <span className={`text-slate-500 dark:text-slate-400 font-sans ${unitSizeClasses[size]}`}>
            {unit}
          </span>
        )}
      </div>
      {sublabel && (
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          {sublabel}
        </span>
      )}
    </div>
  );
};
