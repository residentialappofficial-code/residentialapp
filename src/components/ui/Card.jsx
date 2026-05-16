import React from 'react';

export const Card = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 transition-all duration-300 overflow-hidden ${className}`}>
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-slate-50 flex justify-between items-center ${className}`}>
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 bg-slate-50/50 border-t border-slate-100 ${className}`}>
      {children}
    </div>
  );
};
