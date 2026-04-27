import React from 'react';

export const Badge = ({ children, variant = 'indigo', className = '' }) => {
  const variants = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    dark: "bg-slate-900 text-white border-slate-900",
  };

  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
      ${variants[variant] || variants.indigo}
      ${className}
    `}>
      {children}
    </span>
  );
};
