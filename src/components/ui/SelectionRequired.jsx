import React from 'react';
import { LayoutGrid, Building2, MousePointerClick } from 'lucide-react';
import { Button } from './Button';
import { Link } from 'react-router-dom';

export const SelectionRequired = ({ title = "Pilih Perumahan" }) => {
 return (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-2xl border border-slate-100  mt-16">
   <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-950 mb-8 animate-bounce ">
    <Building2 className="w-10 h-10" />
   </div>
   <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
   <p className="text-slate-500 max-w-sm mb-8 font-medium">
    Anda masuk sebagai Super Admin. Silakan pilih salah satu perumahan dari daftar untuk melihat dan mengelola datanya.
   </p>
   <Link to="/manage-complexes">
    <Button variant="primary" icon={MousePointerClick} size="lg">
     Ke Manajemen Komplek
    </Button>
   </Link>
  </div>
 );
};
