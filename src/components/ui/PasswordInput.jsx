import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export const PasswordInput = ({ 
  label, 
  value, 
  onChange, 
  error, 
  strength, 
  placeholder = "••••••••",
  ...props 
}) => {
  const [show, setShow] = useState(false);

  // Strength colors: 0 (weak) to 3 (strong)
  const strengthColors = [
    'bg-slate-200',
    'bg-red-500',
    'bg-amber-500',
    'bg-green-500'
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={`
            block w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900
            focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5
            transition-all placeholder:text-slate-300
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          `}
          placeholder={placeholder}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      
      {/* Strength Indicator */}
      {value && strength !== undefined && (
        <div className="flex gap-1 mt-1 px-4">
          {[1, 2, 3].map((level) => (
            <div 
              key={level}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                strength >= level ? strengthColors[strength] : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-0.5 ml-1">
          {error}
        </p>
      )}
    </div>
  );
};
