import React from 'react';

export const Input = ({ 
 label, 
 error, 
 icon: Icon,
 className = '',
 ...props 
}) => {
 return (
  <div className="flex flex-col gap-1.5 w-full">
   {label && (
    <label className="text-xs font-bold text-slate-500  ml-1">
     {label}
    </label>
   )}
   <div className="relative">
    {Icon && (
     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-4 w-4 text-slate-400" />
     </div>
    )}
    <input
     className={`
      block w-full px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium 
      focus:outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5
      bg-slate-50/50 transition-all placeholder:text-slate-400
      ${Icon ? 'pl-12' : ''}
      ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
      ${className}
     `}
     {...props}
    />
   </div>
   {error && (
    <p className="text-xs font-bold text-red-500 mt-0.5 ml-1 ">
     {error}
    </p>
   )}
  </div>
 );
};

export const Textarea = ({ 
 label, 
 error, 
 className = '',
 ...props 
}) => {
 return (
  <div className="flex flex-col gap-1.5 w-full">
   {label && (
    <label className="text-xs font-bold text-slate-500  ml-1">
     {label}
    </label>
   )}
   <textarea
    className={`
     block w-full px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium 
     focus:outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5
     bg-slate-50/50 transition-all placeholder:text-slate-400 min-h-[100px]
     ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
     ${className}
    `}
    {...props}
   />
   {error && (
    <p className="text-xs font-bold text-red-500 mt-0.5 ml-1 ">
     {error}
    </p>
   )}
  </div>
 );
};
