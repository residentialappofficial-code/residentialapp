import React from 'react';

export const Input = ({ 
  label, 
  error, 
  icon: Icon,
  className = '',
  ...props 
}) => {
  const widthClass = className.split(' ').find(c => c.startsWith('w-')) || 'w-full';
  const otherClasses = className.split(' ').filter(c => !c.startsWith('w-')).join(' ');

  return (
    <div className={`flex flex-col gap-2 ${widthClass}`}>
      {label && (
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          </div>
        )}
        <input
          {...props}
          className={`
            block w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900
            focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5
            transition-all placeholder:text-slate-300
            ${Icon ? 'pl-11 pr-4' : 'px-4'}
            ${props.type === 'date' ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${otherClasses}
          `}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-0.5 ml-1">
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
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`
          block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900
          focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5
          transition-all placeholder:text-slate-300 min-h-[120px]
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
      />
      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-0.5 ml-1">
          {error}
        </p>
      )}
    </div>
  );
};
