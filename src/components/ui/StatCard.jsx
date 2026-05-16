import React from 'react';
import { Card } from './Card';
import { AlertCircle } from 'lucide-react';

export const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  isPositive = true, 
  trend, 
  isCircle = false,
  status,
  gaugeValue
}) => {
  return (
    <Card noPadding className="flex flex-col h-full">
      <div className="p-5 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            {title} <AlertCircle className="w-3 h-3 text-slate-200" />
          </div>
          {Icon && !gaugeValue && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex justify-between items-end gap-2">
          <div className="flex flex-col">
            {status ? (
              <>
                <h3 className={`text-xl font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'} tracking-tight leading-none mb-1`}>{status}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status Operasional</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-2">{value}</h3>
                {change && (
                  <p className={`text-[11px] font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {change}
                  </p>
                )}
              </>
            )}
          </div>

          {gaugeValue !== undefined ? (
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-12 h-12 transform -rotate-90">
                <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className={isPositive ? "text-emerald-500" : "text-amber-500"} strokeWidth="3" stroke="currentColor" fill="none" strokeDasharray={`${gaugeValue}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="absolute text-[9px] font-bold text-slate-700">{gaugeValue}%</span>
            </div>
          ) : trend ? (
            <div className="opacity-70 shrink-0">
              {trend}
            </div>
          ) : isCircle ? (
             <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-r-indigo-500 flex items-center justify-center shrink-0"></div>
          ) : null}
        </div>
      </div>
    </Card>
  );
};
