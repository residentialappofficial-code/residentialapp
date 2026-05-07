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
 const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 active:translate-y-0";
 
 const variants = {
  primary: "bg-slate-950 text-white border border-slate-900 hover:bg-black shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
  ghost: "text-slate-500 hover:bg-slate-100",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
  success: "bg-green-50 text-green-600 hover:bg-green-100",
  dark: "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
 };

 const sizes = {
  xs: "px-5 py-2.5 text-xs rounded-lg",
  sm: "px-5 py-2.5 text-xs rounded-xl",
  md: "px-5 py-2.5 text-xs rounded-xl",
  lg: "px-5 py-2.5 text-sm rounded-xl",
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
