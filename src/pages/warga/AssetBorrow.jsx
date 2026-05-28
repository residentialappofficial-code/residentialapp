import { useState, useEffect, useCallback } from "react";
import { Package, Calendar, Info, CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Card, CardHeader, Badge, Modal, Input, Table, THead, TBody, TR, TH, TD } from "@/components/ui";
import { QRCodeSVG } from "qrcode.react";

export default function AssetBorrow() {
  const { profile } = useAuth();
  const [assets, setAssets] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [tglPinjam, setTglPinjam] = useState("");
  const [tglKembali, setTglKembali] = useState("");
  const [keperluan, setKeperluan] = useState("");

  const fetchData = useCallback(async () => {
    if (!profile?.perumahan_id) {
      console.log("AssetBorrow: profile.perumahan_id is missing", profile);
      return;
    }
    
    console.log("AssetBorrow: Fetching data for perumahan_id:", profile.perumahan_id);
    
    try {
      setLoading(true);
      // Fetch Assets
      const { data: assetData } = await supabase
        .from('aset_komplek')
        .select('*')
        .eq('perumahan_id', profile.perumahan_id)
        .order('nama_aset');
      
      setAssets(assetData || []);

      // Fetch My Requests
      const { data: requestData, error: requestError } = await supabase
        .from('peminjaman_aset')
        .select(`
          *,
          aset:aset_komplek!aset_id(nama_aset)
        `)
        .eq('warga_id', profile.warga_id)
        .order('tanggal_pinjam', { ascending: false });
      
      if (requestError) {
        console.error("AssetBorrow: Request Fetch Error:", requestError);
      }
      setMyRequests(requestData || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenBorrow = (asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!tglPinjam || !tglKembali) {
      alert("Tanggal pinjam dan kembali harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('peminjaman_aset')
        .insert([{
          perumahan_id: profile.perumahan_id,
          aset_id: selectedAsset.id,
          warga_id: profile.warga_id,
          tanggal_pinjam: tglPinjam,
          tanggal_kembali: tglKembali,
          keterangan: keperluan,
          status: 'Pending'
        }]);

      if (error) throw error;

      alert("Permintaan peminjaman telah dikirim. Menunggu persetujuan pengurus.");
      
      setIsModalOpen(false);
      fetchData();
      // Reset form
      setTglPinjam("");
      setTglKembali("");
      setKeperluan("");
    } catch (error) {
      alert("Gagal mengirim pengajuan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pinjam Aset</h1>
          <p className="text-slate-500 text-sm mt-1">Pilih aset yang tersedia untuk kegiatan Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Assets List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Package className="text-white w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Aset Tersedia</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100 animate-pulse"></div>
              ))
            ) : assets.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
                <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Tidak ada aset terdaftar</p>
              </div>
            ) : assets.map((asset) => (
              <Card key={asset.id} className="group hover:border-indigo-100 transition-all">
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{asset.nama_aset}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                        <Info size={12} />
                        Kondisi: {asset.kondisi}
                      </div>
                    </div>
                    <Badge variant={asset.status === 'Available' ? 'green' : 'orange'}>
                      {asset.status === 'Available' ? 'Tersedia' : 'Dipinjam'}
                    </Badge>
                  </div>

                  <Button 
                    variant={asset.status === 'Available' ? 'primary' : 'outline'}
                    size="md"
                    className="w-full rounded-2xl"
                    disabled={asset.status !== 'Available'}
                    onClick={() => handleOpenBorrow(asset)}
                    iconRight={asset.status === 'Available' ? ArrowRight : null}
                  >
                    Ajukan Peminjaman
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar / History */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Clock className="text-white w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Riwayat Peminjaman</h2>
          </div>

          <div className="flex flex-col gap-4">
            {myRequests.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed">
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Belum ada riwayat</p>
              </div>
            ) : myRequests.map((req) => (
              <div key={req.id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{req.aset?.nama_aset}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {req.tanggal_pinjam} • {req.tanggal_kembali}
                    </p>
                  </div>
                  <Badge variant={
                    req.status === 'Returned' ? 'green' : 
                    req.status === 'Borrowed' ? 'orange' :
                    req.status === 'Pending' ? 'indigo' : 
                    req.status === 'Rejected' ? 'rose' : 'slate'
                  }>
                    {req.status === 'Returned' ? 'Dikembalikan' : 
                     req.status === 'Borrowed' ? 'Dipinjam' : 
                     req.status === 'Pending' ? 'Menunggu' : req.status}
                  </Badge>
                </div>
                {req.status === 'Pending' && (
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    <Clock size={12} />
                    Menunggu Verifikasi Admin
                  </div>
                )}
                {(req.status === 'Approved' || req.status === 'Borrowed') && (
                  <div className="flex flex-col items-center gap-3 p-4 bg-orange-50 rounded-xl mt-2 border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider text-center flex items-center gap-1">
                      <Info size={12} /> Tunjukkan QR Code ini saat pengambilan
                    </p>
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <QRCodeSVG value={`ASSET-${req.id}`} size={90} />
                    </div>
                  </div>
                )}
                {req.status === 'Returned' && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    <CheckCircle2 size={12} />
                    Dikembalikan: {new Date(req.tanggal_kembali).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Form Peminjaman Aset"
      >
        <div className="space-y-6 p-2">
          <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Aset Dipilih</p>
              <p className="text-lg font-black text-indigo-900 tracking-tight">{selectedAsset?.nama_aset}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tgl Pinjam</label>
              <Input 
                type="date" 
                value={tglPinjam}
                onChange={(e) => setTglPinjam(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tgl Kembali</label>
              <Input 
                type="date" 
                value={tglKembali}
                onChange={(e) => setTglKembali(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Keperluan</label>
            <textarea 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[100px] transition-all"
              placeholder="Contoh: Acara arisan blok A..."
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1 py-4" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button 
              variant="primary" 
              className="flex-1 py-4" 
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              Kirim Pengajuan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ArrowRight({ size, className }) {
  return <ChevronRight size={size} className={className} />;
}
