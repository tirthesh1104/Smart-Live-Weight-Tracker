import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border';

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2 text-sm sm:text-base gap-2'
  };

  const variantClasses = {
    primary: 'bg-[#003366] hover:bg-[#002244] text-white border-[#002244]',
    secondary: 'bg-slate-700 hover:bg-slate-800 text-white border-slate-800',
    danger: 'bg-[#b91c1c] hover:bg-[#991b1b] text-white border-[#991b1b]',
    success: 'bg-[#15803d] hover:bg-[#166534] text-white border-[#166534]',
    outline: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border-transparent dark:text-slate-300 dark:hover:bg-slate-800'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
