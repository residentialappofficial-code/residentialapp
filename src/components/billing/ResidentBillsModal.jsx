import { Modal, Badge, Button } from "@/components/ui";
import { formatCurrency } from "@/utils/financeUtils";

export default function ResidentBillsModal({
  isOpen,
  onClose,
  selectedWarga,
  allBills,
  updatingId,
  handleToggleStatus
}) {
  const monthsFull = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedWarga ? `Detail Tagihan: ${selectedWarga.nama} (${selectedWarga.blok})` : "Detail Tagihan"}
      size="lg"
    >
      <div className="p-4">
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {selectedWarga && (
            <div className="space-y-3">
              {allBills
                .filter(b => b.warga_id === selectedWarga.id)
                .sort((a, b) => {
                  if (a.tahun !== b.tahun) return b.tahun - a.tahun;
                  return b.bulan - a.bulan;
                })
                .map(bill => (
                  <div key={bill.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Periode {monthsFull[bill.bulan - 1]} {bill.tahun}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">Rp {formatCurrency(bill.jumlah)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={bill.status === 'Paid' ? 'green' : 'indigo'}>
                        {bill.status === 'Paid' ? 'Lunas' : 'Belum Bayar'}
                      </Badge>
                      <Button 
                        variant={bill.status === 'Paid' ? 'outline' : 'primary'}
                        size="sm"
                        isLoading={updatingId === bill.id}
                        onClick={() => handleToggleStatus(bill)}
                        className={bill.status === 'Paid' ? 'text-slate-600 border-slate-200 hover:bg-slate-100' : ''}
                      >
                        {bill.status === 'Paid' ? 'Batalkan' : 'Tandai Lunas'}
                      </Button>
                    </div>
                  </div>
                ))}
                {allBills.filter(b => b.warga_id === selectedWarga.id).length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm font-medium">Belum ada riwayat tagihan tercatat.</div>
                )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
