import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({ 
  label, 
  error, 
  className = '',
  children,
  ...props 
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-bold text-slate-500 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            appearance-none block w-full px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium 
            focus:outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5
            bg-slate-50/50 transition-all cursor-pointer
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      {error && (
        <p className="text-xs font-bold text-red-500 mt-0.5 ml-1">
          {error}
        </p>
      )}
    </div>
  );
};
