import React from 'react';

export const Table = ({ children, className = '' }) => {
 return (
  <div className={`overflow-x-auto ${className}`}>
   <table className="w-full text-left border-collapse">
    {children}
   </table>
  </div>
 );
};

export const THead = ({ children, className = '' }) => {
 return (
  <thead className={`bg-slate-50 border-b border-slate-200 ${className}`}>
   {children}
  </thead>
 );
};

export const TBody = ({ children, className = '' }) => {
 return (
  <tbody className={className}>
   {children}
  </tbody>
 );
};

export const TR = ({ children, className = '', isHeader = false }) => {
 return (
  <tr className={`
   ${isHeader ? '' : 'hover:bg-slate-50/50 border-b border-slate-100/50 transition-all last:border-0'} 
   ${className}
  `}>
   {children}
  </tr>
 );
};

export const TH = ({ children, className = '', textAlign = 'left' }) => {
 const aligns = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
 };
 return (
  <th className={`px-5 py-3 text-[11px] font-bold text-slate-500 ${aligns[textAlign]} ${className}`}>
   {children}
  </th>
 );
};

export const TD = ({ children, className = '', textAlign = 'left' }) => {
 const aligns = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right'
 };
 return (
  <td className={`px-5 py-4 text-sm font-medium text-slate-700 ${aligns[textAlign]} ${className}`}>
   {children}
  </td>
 );
};
