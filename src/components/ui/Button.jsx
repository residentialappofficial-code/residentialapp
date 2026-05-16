import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  icon: Icon,
  iconRight: IconRight,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200/50",
    secondary: "bg-slate-50 text-slate-600 hover:bg-slate-100",
    outline: "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    dark: "bg-slate-950 text-white hover:bg-black",
  };

  const sizes = {
    xs: "px-2.5 py-1.5 text-[11px] rounded-md",
    sm: "px-3.5 py-2 text-xs rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-lg",
    lg: "px-6 py-3 text-sm rounded-xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon && (
        <Icon className={`${children ? 'mr-2.5' : ''} w-4 h-4`} />
      )}
      {children}
      {!isLoading && IconRight && (
        <IconRight className={`${children ? 'ml-2.5' : ''} w-4 h-4`} />
      )}
    </button>
  );
};
