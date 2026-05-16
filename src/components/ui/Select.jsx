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
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          className={`
            block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900
            focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5
            transition-all appearance-none outline-none
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-0.5 ml-1">
          {error}
        </p>
      )}
    </div>
  );
};
