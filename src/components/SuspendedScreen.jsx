import React from 'react';
import { ShieldAlert, PhoneCall, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SuspendedScreen() {
  const { profile } = useAuth();
  const perumahanNama = profile?.perumahan?.nama || 'Perumahan Anda';

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 max-w-md w-full text-center shadow-xl shadow-slate-100/50">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
          Layanan Ditangguhkan
        </h2>
        
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Akses platform Habitix untuk <strong className="text-slate-800">{perumahanNama}</strong> saat ini ditangguhkan karena masa aktif langganan perumahan telah habis.
        </p>

        <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 text-left space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Bagi Warga</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Silakan hubungi Pengurus / Admin RT/RW perumahan Anda untuk melakukan pembayaran perpanjangan sewa platform.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleReload}
            className="flex-1 bg-slate-900 text-white border border-slate-900 px-5 py-3 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    </div>
  );
}
