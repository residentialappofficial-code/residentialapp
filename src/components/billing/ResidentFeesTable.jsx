import { ArrowUpDown, ArrowDownRight, ArrowUpRight, CheckCircle2, XCircle, Eye } from "lucide-react";
import { Table, THead, TBody, TR, TH, TD, Button } from "@/components/ui";
import { calculateFinance, formatCurrency, formatDate } from "@/utils/financeUtils";

export default function ResidentFeesTable({
  filteredWarga,
  iuranConfig,
  allBills,
  selectedYear,
  canEdit,
  updatingId,
  loading,
  getMonthStatus,
  handleToggleStatus,
  openWargaBills,
  requestSort,
  sortConfig
}) {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthsFull = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="overflow-x-auto hidden lg:block">
      <Table>
        <THead>
          <TR isHeader className="bg-slate-50/30">
            <TH 
              className="sticky left-0 bg-white/80 backdrop-blur-md z-10 border-r border-slate-100 pl-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-40"
              onClick={() => requestSort('blok')}
            >
              <div className="flex items-center gap-2">
                Unit / Nama
                <ArrowUpDown size={10} className={sortConfig.key === 'blok' ? 'text-indigo-500' : 'text-slate-300'} />
              </div>
            </TH>
            <TH className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap w-px">Tgl Serah Terima</TH>
            <TH 
              textAlign="right" 
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-px whitespace-nowrap px-4"
              onClick={() => requestSort('totalObligation')}
            >
              <div className="flex items-center justify-end gap-2">
                Kewajiban
                <ArrowUpDown size={10} className={sortConfig.key === 'totalObligation' ? 'text-indigo-500' : 'text-slate-300'} />
              </div>
            </TH>
            <TH 
              textAlign="right" 
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-px whitespace-nowrap px-4"
              onClick={() => requestSort('totalPaid')}
            >
              <div className="flex items-center justify-end gap-2">
                Sudah Dibayar
                <ArrowUpDown size={10} className={sortConfig.key === 'totalPaid' ? 'text-indigo-500' : 'text-slate-300'} />
              </div>
            </TH>
            <TH 
              textAlign="right" 
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-px whitespace-nowrap px-4"
              onClick={() => requestSort('kurang')}
            >
              <div className="flex items-center justify-end gap-2">
                Kurang
                <ArrowUpDown size={10} className={sortConfig.key === 'kurang' ? 'text-indigo-500' : 'text-slate-300'} />
              </div>
            </TH>
            <TH 
              textAlign="right" 
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors w-px whitespace-nowrap px-4"
              onClick={() => requestSort('lebih')}
            >
              <div className="flex items-center justify-end gap-2">
                Lebih
                <ArrowUpDown size={10} className={sortConfig.key === 'lebih' ? 'text-indigo-500' : 'text-slate-300'} />
              </div>
            </TH>
            {months.map(m => (
              <TH key={m} textAlign="center" className="text-[9px] font-black uppercase text-slate-400 w-8 px-0 border-l border-slate-50">{m}</TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <TR key={i}><TD colSpan={18}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
            ))
          ) : filteredWarga.length === 0 ? (
            <TR><TD colSpan={18} textAlign="center" className="py-24 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Data warga tidak ditemukan</TD></TR>
          ) : filteredWarga.map((w) => {
            const fin = calculateFinance(w, iuranConfig, allBills);
            return (
              <TR key={w.id} className="group hover:bg-slate-50/50 transition-all text-[11px]">
                <TD className="sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-100 transition-colors py-4">
                  <div className="flex justify-between items-center gap-2 pr-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 tracking-tight">{w.blok}</span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate w-32">{w.nama}</span>
                    </div>
                    <button 
                      onClick={() => openWargaBills(w)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                      title="Lihat Detail Riwayat"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </TD>
                <TD className="text-xs font-medium text-slate-600 whitespace-nowrap w-px">
                  {fin ? formatDate(fin.tglSerahTerima) : "-"}
                </TD>
                <TD textAlign="right" className="font-bold text-slate-900 whitespace-nowrap w-px px-4">
                  {fin ? `Rp ${formatCurrency(fin.totalObligation)}` : "-"}
                </TD>
                <TD textAlign="right" className="font-bold text-green-600 whitespace-nowrap w-px px-4">
                  {fin ? `Rp ${formatCurrency(fin.totalPaid)}` : "-"}
                </TD>
                <TD textAlign="right" className="w-px whitespace-nowrap px-4">
                  {fin?.kurang > 0 ? (
                    <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                      <ArrowDownRight size={12} />
                      Rp {formatCurrency(fin.kurang)}
                    </span>
                  ) : <span className="text-slate-300">-</span>}
                </TD>
                <TD textAlign="right" className="w-px whitespace-nowrap px-4">
                  {fin?.lebih > 0 ? (
                    <span className="inline-flex items-center gap-1 text-blue-600 font-bold">
                      <ArrowUpRight size={12} />
                      Rp {formatCurrency(fin.lebih)}
                    </span>
                  ) : <span className="text-slate-300">-</span>}
                </TD>
                {months.map((_, i) => {
                  const status = getMonthStatus(w.id, i + 1, selectedYear);
                  const bill = allBills.find(b => b.warga_id === w.id && b.bulan === (i + 1) && b.tahun === selectedYear);
                  const isGray = !fin || status === 'None';
                  
                  return (
                    <TD key={i} textAlign="center" className="px-0 border-l border-slate-50/50">
                      {isGray ? (
                        <button 
                          onClick={() => handleToggleStatus(null, w.id, i + 1, selectedYear)}
                          disabled={!canEdit || updatingId === `new-${w.id}-${i+1}`}
                          className={`group flex items-center justify-center w-full h-10 transition-all ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                          title={canEdit ? `Klik untuk tandai LUNAS ${monthsFull[i]} ${selectedYear}` : "Belum mulai iuran"}
                        >
                          <div className={`rounded-full transition-all ${
                            canEdit 
                              ? 'w-4 h-4 border-2 border-dashed border-slate-200 group-hover:border-indigo-400 group-hover:bg-indigo-50 flex items-center justify-center' 
                              : 'w-1.5 h-1.5 bg-slate-100'
                          }`}>
                            {canEdit && <span className="text-[10px] text-slate-300 group-hover:text-indigo-500 font-bold">+</span>}
                          </div>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleStatus(bill)}
                          disabled={!canEdit || updatingId === bill?.id}
                          className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto transition-all ${
                            status === 'Paid' 
                              ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 scale-110' 
                              : 'bg-rose-500 shadow-lg shadow-rose-500/20'
                          } ${(!canEdit || updatingId === bill?.id) ? 'opacity-50' : 'hover:scale-125'} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                          title={status === 'Paid' ? 'Lunas' : 'Belum Bayar'}
                        >
                          {status === 'Paid' ? <CheckCircle2 size={10} className="text-white" /> : <XCircle size={10} className="text-white" />}
                        </button>
                      )}
                    </TD>
                  );
                })}
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
