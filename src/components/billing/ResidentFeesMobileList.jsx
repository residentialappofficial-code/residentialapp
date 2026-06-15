import { Eye } from "lucide-react";
import { calculateFinance, formatCurrency } from "@/utils/financeUtils";

export default function ResidentFeesMobileList({
  filteredWarga,
  iuranConfig,
  allBills,
  selectedYear,
  canEdit,
  updatingId,
  handleToggleStatus,
  openWargaBills
}) {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  return (
    <div className="block lg:hidden space-y-4 mt-4">
      {filteredWarga.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
          Data warga tidak ditemukan
        </div>
      ) : (
        filteredWarga.map((w) => {
          const fin = calculateFinance(w, iuranConfig, allBills);
          return (
            <div key={w.id} className="p-5 flex flex-col gap-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors shadow-sm relative group">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 tracking-tight">{w.blok}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{w.nama}</span>
                </div>
                <button 
                  onClick={() => openWargaBills(w)}
                  className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                  title="Lihat Detail Riwayat"
                >
                  <Eye size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 text-[11px]">
                <div>
                  <p className="text-slate-400 uppercase font-bold tracking-wider">Kewajiban</p>
                  <p className="text-slate-900 font-bold mt-1 text-xs">Rp {fin ? formatCurrency(fin.totalObligation) : "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-bold tracking-wider">Terbayar</p>
                  <p className="text-green-600 font-bold mt-1 text-xs">Rp {fin ? formatCurrency(fin.totalPaid) : "-"}</p>
                </div>
              </div>
              
              {/* Monthly Payment Grid */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Bulan</p>
                <div className="grid grid-cols-4 gap-2">
                  {months.map((m, idx) => {
                    const monthNum = idx + 1;
                    const bill = allBills.find(b => b.warga_id === w.id && b.bulan === monthNum && b.tahun === selectedYear);
                    const status = bill?.status || 'Unpaid';
                    
                    return (
                      <button
                        key={m}
                        disabled={!canEdit || updatingId === bill?.id}
                        onClick={() => handleToggleStatus(bill, w.id, monthNum, selectedYear)}
                        className={`
                          px-1.5 py-2 text-[10px] font-bold rounded-xl uppercase tracking-wider text-center border transition-all cursor-pointer
                          ${status === 'Paid' 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100/70' 
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}
                          ${(!canEdit || updatingId === bill?.id) ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
                      >
                        <span className="block text-[9px] opacity-60 font-semibold">{m.substring(0, 3)}</span>
                        <span className="block mt-0.5">{status === 'Paid' ? 'LUNAS' : 'BELUM'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
