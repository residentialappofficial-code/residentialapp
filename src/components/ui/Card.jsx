import React from 'react';

export const Card = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`p-6 border-b border-slate-50 flex justify-between items-center ${className}`}>
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`p-4 bg-slate-50 border-t border-slate-100 ${className}`}>
      {children}
    </div>
  );
};
