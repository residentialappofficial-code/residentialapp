import React from 'react';

export const Card = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 transition-all duration-300 overflow-hidden ${className}`}>
      <div className={noPadding ? '' : 'p-4'}>
        {children}
      </div>
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`px-4 py-3 border-b border-slate-50 flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center gap-4 ${className}`}>
      <div className="flex-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium leading-normal">{subtitle}</p>}
      </div>
      {action && <div className="w-full sm:w-auto shrink-0">{action}</div>}
    </div>
  );
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`px-4 py-3 bg-slate-50/50 border-t border-slate-100 ${className}`}>
      {children}
    </div>
  );
};
