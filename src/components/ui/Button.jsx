import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  icon: Icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:opacity-90 shadow-sm",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm",
    ghost: "text-slate-500 hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-50 text-green-600 hover:bg-green-100",
    dark: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
  };

  const sizes = {
    xs: "px-2 py-1 text-[10px] rounded-md",
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
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
        <Icon className={`${children ? 'mr-2' : ''} w-4 h-4`} />
      )}
      {children}
    </button>
  );
};
