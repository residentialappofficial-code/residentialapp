import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Edit, Trash2, Download, UserPlus, X, UserMinus, Users, Home, Map, Database, ArrowRight, ShieldCheck, UserCircle, Building2, Mail, Phone, KeyRound, Eye, ArrowUpDown, Calendar, MoreVertical, Upload } from "lucide-react";
import { supabase, supabaseUrl, supabaseAnonKey } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, Card, CardHeader, Badge, Table, THead, TBody, TR, TH, TD, Modal, Select } from "@/components/ui";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SelectionRequired } from "@/components/ui/SelectionRequired";
import { PermissionGuard } from "@/components/PermissionGuard";

// eslint-disable-next-line no-unused-vars
const ResidentStatCard = ({ title, value, icon: Icon, color = "slate" }) => {
  const colorMap = {
    slate: "text-slate-500",
    blue: "text-blue-500",
    green: "text-emerald-500",
    amber: "text-orange-500",
    indigo: "text-indigo-500",
  };
  
  const bgMap = {
    slate: "bg-slate-50",
    blue: "bg-blue-50",
    green: "bg-emerald-50",
    amber: "bg-orange-50",
    indigo: "bg-indigo-50",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:shadow-sm transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
          {title}
        </div>
        <div className={`w-8 h-8 rounded-full ${bgMap[color]} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colorMap[color]}`} />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  );
};

export default function DataWarga() {
  const { selectedPerumahanId, profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [formData, setFormData] = useState({
    nama: "",
    blok: "",
    no_hp: "",
    email: "",
    status_hunian: "Pemilik",
    blok_id: "",
    nama_pemilik: "",
    kontak_pemilik: "",
    tgl_serah_terima: "",
    createAccount: false,
    password: ""
  });

  const [resetData, setResetData] = useState({
    wargaId: "",
    nama: "",
    email: "",
    newPassword: "",
    hasAccount: false
  });

  const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'asc' });
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortConfig.key === 'nama') {
        return sortConfig.direction === 'asc' 
          ? a.nama.localeCompare(b.nama) 
          : b.nama.localeCompare(a.nama);
      }
      if (sortConfig.key === 'blok_no') {
        const valA = a.blok?.blok_no || "";
        const valB = b.blok?.blok_no || "";
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      return 0;
    });
  }, [data, sortConfig]);
  const [blocks, setBlocks] = useState([]);

  const fetchBlocks = useCallback(async () => {
    if (!selectedPerumahanId) return;
    const { data: b, error } = await supabase
      .from('blok')
      .select('id, blok_no')
      .eq('perumahan_id', selectedPerumahanId)
      .order('blok_no', { ascending: true });
    
    if (!error) setBlocks(b || []);
  }, [selectedPerumahanId]);

  useEffect(() => {
    if (selectedPerumahanId) fetchBlocks();
  }, [selectedPerumahanId, fetchBlocks]);

  const fetchData = useCallback(async (search = "", status = "Semua Status") => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      let query = supabase.from('warga')
        .select('*, blok:blok_id(blok_no, luas_tanah)')
        .eq('perumahan_id', selectedPerumahanId)
        .order('nama', { ascending: true });
      
      if (search) {
        query = query.ilike('nama', `%${search}%`);
      }

      if (status !== "Semua Status") {
        query = query.eq('status_hunian', status);
      }

      const { data: residents, error } = await query;
      if (error) throw error;
      setData(residents || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    if (selectedPerumahanId) {
      fetchData(searchTerm, filterStatus);
    }
  }, [selectedPerumahanId, searchTerm, filterStatus, fetchData]);

  const filteredData = data;

  const handleDeleteWarga = async (id) => {
    if (!window.confirm("Hapus data warga ini secara permanen?")) return;
    try {
      const { error } = await supabase.from('warga').delete().eq('id', id);
      if (error) throw error;
      fetchData(searchTerm, filterStatus);
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      nama: item.nama || "",
      blok: item.blok || "",
      no_hp: item.no_hp || "",
      email: item.email || "",
      status_hunian: item.status_hunian || "Pemilik",
      blok_id: item.blok_id || "",
      nama_pemilik: item.nama_pemilik || "",
      kontak_pemilik: item.kontak_pemilik || "",
      tgl_serah_terima: item.tgl_serah_terima || ""
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleResetPassword = (item) => {
    setResetData({
      wargaId: item.id,
      nama: item.nama,
      email: item.email || "",
      newPassword: "",
      hasAccount: !!item.user_id
    });
    setIsResetModalOpen(true);
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    if (resetData.newPassword.length < 6) return alert("Password minimal 6 karakter.");
    
    setIsResetting(true);
    try {
      if (resetData.hasAccount) {
        // Mode: Reset Password
        const response = await fetch(`${supabaseUrl}/functions/v1/reset-resident-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            wargaId: resetData.wargaId,
            newPassword: resetData.newPassword
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Gagal mereset password. Pastikan Edge Function sudah aktif.");
        }
        alert("Password berhasil diubah!");
      } else {
        // Mode: Create New Account for Existing Record
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false }
        });

        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: resetData.email,
          password: resetData.newPassword,
          options: {
            data: {
              nama: resetData.nama,
              role: 'warga',
              perumahan_id: selectedPerumahanId
            }
          }
        });

        if (authError) throw authError;

        // Update the existing warga record with the new user_id
        const { error: updateError } = await supabase
          .from('warga')
          .update({ user_id: authData.user?.id })
          .eq('id', resetData.wargaId);
        
        if (updateError) throw updateError;
        alert("Akun berhasil dibuat dan dihubungkan!");
        fetchData(searchTerm, filterStatus);
      }

      setIsResetModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddWarga = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPerumahanId) return;
    
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('warga')
          .update({
            nama: formData.nama,
            blok: formData.blok,
            no_hp: formData.no_hp,
            email: formData.email,
            status_hunian: formData.status_hunian,
            blok_id: formData.blok_id,
            nama_pemilik: formData.nama_pemilik,
            kontak_pemilik: formData.kontak_pemilik,
            tgl_serah_terima: formData.tgl_serah_terima || null
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        let userId = null;

        if (formData.createAccount) {
          // Create Auth User without logging out the admin
          const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false }
          });

          const { data: authData, error: authError } = await tempClient.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                nama: formData.nama,
                role: 'warga',
                perumahan_id: selectedPerumahanId
              }
            }
          });

          if (authError) throw authError;
          userId = authData.user?.id;
        }

        // Regular data entry + link user_id if created
        const { error } = await supabase
          .from('warga')
          .insert({
            nama: formData.nama,
            blok_id: formData.blok_id,
            no_hp: formData.no_hp,
            email: formData.email,
            status_hunian: formData.status_hunian,
            nama_pemilik: formData.nama_pemilik,
            kontak_pemilik: formData.kontak_pemilik,
            tgl_serah_terima: formData.tgl_serah_terima || null,
            perumahan_id: selectedPerumahanId,
            status_iuran: 'Belum Lunas',
            user_id: userId // Linking to the new Auth user
          });
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      setFormData({ nama: "", blok_id: "", no_hp: "", email: "", status_hunian: "Pemilik", nama_pemilik: "", kontak_pemilik: "", tgl_serah_terima: "", createAccount: false, password: "" });
      fetchData(searchTerm, filterStatus);
    } catch (error) {
      alert("Submission failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    try {
      // Convert to CSV export URL
      let csvUrl = importUrl;
      if (importUrl.includes('/edit')) {
        csvUrl = importUrl.replace(/\/edit.*$/, '/export?format=csv');
        const gidMatch = importUrl.match(/gid=(\d+)/);
        if (gidMatch) csvUrl += `&gid=${gidMatch[1]}`;
      }

      const response = await fetch(csvUrl);
      let text = await response.text();
      
      // Strip BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1);
      }
      
      const lines = text.split(/\r?\n/);
      const residentsToInsert = [];

      // Simple CSV parser that handles quoted commas
      const parseCSVLine = (line) => {
        const result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result.map(v => v.replace(/^"|"$/g, ''));
      };

      // Header is line 0
      for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 11) continue;

        const blok = parts[1]; // Unit No
        const nama = parts[10]; // PIC 1 Nama
        const no_hp = parts[13]; // PIC HP 1
        const email = parts[16]; // PIC Email 1

        if (nama && blok && nama !== "PIC 1 Nama") {
          let mappedStatus = "Kosong";
          const rawStatus = parts[6]?.toLowerCase() || "";
          
          if (rawStatus.includes("ditempati")) {
            mappedStatus = rawStatus.includes("pengontrak") ? "Kontrak" : "Pemilik";
          } else if (rawStatus.includes("kontrak")) {
            mappedStatus = "Kontrak";
          } else if (rawStatus.includes("pemilik")) {
            mappedStatus = "Pemilik";
          }

          const resident = {
            perumahan_id: selectedPerumahanId,
            nama,
            blok,
            no_hp: no_hp || null,
            email: email || null,
            status_hunian: mappedStatus
          };
          
          residentsToInsert.push(resident);
        }
      }

      console.log("Residents to insert count:", residentsToInsert.length);
      if (residentsToInsert.length > 0) {
        console.log("Sample resident:", residentsToInsert[0]);
      }

      console.log("First 5 residents sample:", residentsToInsert.slice(0, 5));
      console.log("Unique status_hunian values:", [...new Set(residentsToInsert.map(r => r.status_hunian))]);
      
      if (residentsToInsert.length === 0) {
        throw new Error("No valid resident data found in the spreadsheet.");
      }

      if (!selectedPerumahanId) {
        throw new Error("Complex selection required before import.");
      }

      const { error } = await supabase
        .from('warga')
        .upsert(residentsToInsert, { 
          onConflict: 'perumahan_id,blok',
          ignoreDuplicates: false
        });

      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }

      alert(`Berhasil mengimpor ${residentsToInsert.length} warga.`);
      setIsImportModalOpen(false);
      fetchData(searchTerm);
    } catch (err) {
      alert("Impor gagal: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleMutation = async (wargaId) => {
    if (!window.confirm("Proses mutasi/pindah warga ini? Akun akan dinonaktifkan.")) return;
    
    try {
      const { data: bills, error: billError } = await supabase
        .from('tagihan')
        .select('id')
        .eq('warga_id', wargaId)
        .eq('status', 'Unpaid');
      
      if (billError) throw billError;
      
      if (bills && bills.length > 0) {
        alert(`Mutasi Gagal: Warga masih memiliki ${bills.length} tagihan yang belum lunas.`);
        return;
      }

      const { error: updateError } = await supabase
        .from('warga')
        .update({ status_aktif: false })
        .eq('id', wargaId);
      
      if (updateError) throw updateError;
      fetchData(searchTerm);
    } catch (err) {
      alert("Mutation Error: " + err.message);
    }
  };

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Database Warga</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola identitas unit, status hunian, dan data luas tanah.</p>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGuard module="warga" action="create">
            <Button 
              variant="outline" 
              icon={Upload} 
              onClick={() => setIsImportModalOpen(true)}
              className="w-9 h-9 !p-0 text-slate-400 hover:text-slate-950 border-slate-200 rounded-xl"
              title="Impor Data"
            />
          </PermissionGuard>
          
          <Button 
            variant="outline" 
            icon={Download} 
            className="w-9 h-9 !p-0 text-slate-400 hover:text-slate-950 border-slate-200 rounded-xl"
            title="Ekspor Data"
          />
          
          <PermissionGuard module="warga" action="create">
            <Button variant="primary" icon={UserPlus} onClick={() => {
              setIsEditMode(false);
              setEditingId(null);
              setFormData({
                nama: "", blok: "", no_hp: "", email: "", 
                status_hunian: "Pemilik", blok_id: "", 
                nama_pemilik: "", kontak_pemilik: "", tgl_serah_terima: "",
                createAccount: false, password: ""
              });
              setIsModalOpen(true);
            }}>Tambah Warga</Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <ResidentStatCard title="Total Penghuni" value={data.length} icon={Users} color="slate" />
        <ResidentStatCard title="Pemilik" value={data.filter(w => w.status_hunian === 'Pemilik').length} icon={Home} color="blue" />
        <ResidentStatCard title="Pengontrak" value={data.filter(w => w.status_hunian === 'Pengontrak').length} icon={Users} color="indigo" />
      </div>

      {/* Data Card */}
      <Card noPadding>
        <CardHeader 
          title="Registri Unit" 
          subtitle="Database administratif komprehensif seluruh warga komplek"
          action={
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <Select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-48 h-full"
              >
                <option value="Semua Status">Semua Penghuni</option>
                <option value="Pemilik">Pemilik</option>
                <option value="Pengontrak">Pengontrak</option>
              </Select>
              <Input 
                placeholder="Cari warga..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                className="w-full sm:w-80"
              />
            </div>
          }
        />

        <div className="hidden md:block">
        <Table>
          <THead>
            <TR isHeader>
              <TH 
                onClick={() => setSortConfig({ key: 'nama', direction: sortConfig.key === 'nama' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Identitas Warga
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </TH>
              <TH 
                onClick={() => setSortConfig({ key: 'blok_no', direction: sortConfig.key === 'blok_no' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  Blok / Unit
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </TH>
              <TH>Detail Kontak</TH>
              <TH>Status Hunian</TH>
              <TH>Status Tagihan</TH>
              <TH textAlign="right">Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <TR key={i}><TD colSpan={7}><div className="h-16 bg-slate-50/50 rounded-2xl animate-pulse"></div></TD></TR>
              ))
            ) : filteredData.length === 0 ? (
              <TR><TD colSpan={7} textAlign="center" className="py-24 text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Tidak ada data ditemukan untuk filter ini.</TD></TR>
            ) : sortedData.map((item) => (
              <TR key={item.id} className="group">
                <TD>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110 duration-500">
                      <span className="font-bold text-xs">{item.nama?.charAt(0) || "?"}</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-slate-900 tracking-tight">{item.nama}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">UID: {item.id.slice(0, 8).toUpperCase()}</p>
                      {item.status_hunian === 'Pengontrak' && item.nama_pemilik && (
                        <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-wider">Pemilik: {item.nama_pemilik}</p>
                      )}
                    </div>
                  </div>
                </TD>
                <TD>
                  <span className="text-sm font-bold text-slate-900 tracking-tight">{item.blok?.blok_no || "-"}</span>
                </TD>
                <TD className="text-slate-500 text-xs font-medium">{item.no_hp || "-"}</TD>
                <TD>
                  <Badge variant={
                    item.status_hunian === 'Pemilik' ? 'blue' : 'indigo'
                  }>
                    {item.status_hunian}
                  </Badge>
                </TD>
                <TD>
                  <Badge variant={item.status_iuran === 'Lunas' ? 'green' : 'red'}>
                    {item.status_iuran === 'Lunas' ? 'Lunas' : 'Menunggak'}
                  </Badge>
                </TD>
                <TD textAlign="right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        const phone = item.no_hp?.replace(/\D/g, '');
                        if (phone) window.open(`https://wa.me/${phone.startsWith('0') ? '62' + phone.slice(1) : phone}`, '_blank');
                      }} 
                      className="text-emerald-500 hover:bg-emerald-50" 
                      title="Chat WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </Button>
                    
                    <PermissionGuard module="warga" action="edit">
                      <Button variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(item)} className="text-slate-400 hover:text-slate-950 hover:bg-slate-50" />
                    </PermissionGuard>

                    <PermissionGuard module="warga" action="edit">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={UserCircle} 
                        onClick={() => handleResetPassword(item)} 
                        className="text-slate-400 hover:text-slate-950 hover:bg-slate-50" 
                        title="Reset Password"
                      />
                    </PermissionGuard>

                    <PermissionGuard module="warga" action="delete">
                      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDeleteWarga(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50" />
                    </PermissionGuard>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden space-y-4 px-4 py-2">
          {sortedData.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              Data warga tidak ditemukan
            </div>
          ) : (
            sortedData.map((item) => (
              <Card key={item.id} className="flex flex-col gap-4 !overflow-visible">
                <div className="flex justify-between items-start relative">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">{item.nama}</span>
                    <span className="text-xs font-semibold text-indigo-600 mt-0.5">Blok {item.blok?.blok_no || "-"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'aktif' ? 'green' : 'amber'}>
                      {item.status || 'aktif'}
                    </Badge>
                    
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                        className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeMenuId === item.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-lg z-20 p-1 flex flex-col gap-0.5">
                            <PermissionGuard module="warga" action="edit">
                              <button 
                                onClick={() => {
                                  handleEdit(item);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-400" /> Edit
                              </button>
                              <button 
                                onClick={() => {
                                  handleResetPassword(item);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50/50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <UserCircle className="w-3.5 h-3.5 text-indigo-400" /> Password
                              </button>
                            </PermissionGuard>
                            
                            <PermissionGuard module="warga" action="delete">
                              <div className="h-px bg-slate-100 my-0.5" />
                              <button 
                                onClick={() => {
                                  handleDeleteWarga(item.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" /> Hapus
                              </button>
                            </PermissionGuard>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-500 font-medium pt-2 border-t border-slate-50">
                  <p className="flex justify-between"><span>Email:</span> <span className="text-slate-900">{item.email || "-"}</span></p>
                  <p className="flex justify-between"><span>Telepon:</span> <span className="text-slate-900">{item.phone || "-"}</span></p>
                  <p className="flex justify-between"><span>Anggota Keluarga:</span> <span className="text-slate-900">{item.family_members || 0} orang</span></p>
                  <p className="flex justify-between"><span>Tgl Serah Terima:</span> <span className="text-slate-900">{item.tgl_serah_terima ? new Date(item.tgl_serah_terima).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}</span></p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-10 py-6 bg-slate-50/30 flex justify-between items-center border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indeks Database Aktif: {data.length} Total Entri</p>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" disabled className="px-6 font-bold text-[9px] uppercase tracking-widest text-slate-400">Sebelumnya</Button>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" className="w-10 h-10 rounded-xl shadow-none">1</Button>
            </div>
            <Button variant="ghost" size="sm" disabled className="px-6 font-bold text-[9px] uppercase tracking-widest text-slate-400">Selanjutnya</Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Resident Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Modify Resident Data" : "New Resident Onboarding"}
      >
        <div className="space-y-8 p-2">
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">Ensure all identifier data matches legal unit documentation for billing accuracy.</p>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <Input 
              label="Nama Lengkap Sesuai Identitas"
              required 
              value={formData.nama} 
              onChange={(e) => setFormData({...formData, nama: e.target.value})}
              placeholder="Contoh: Budi Santoso"
              icon={UserCircle}
            />
            <Select
              label="Blok / Nomor Unit"
              required 
              value={formData.blok_id} 
              onChange={(e) => setFormData({...formData, blok_id: e.target.value})}
            >
              <option value="">Pilih Blok...</option>
              {blocks.map(b => (
                <option key={b.id} value={b.id}>{b.blok_no}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <Input 
              label="Email Administratif"
              type="email"
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="warga@perumahan.com"
              icon={Mail}
            />
            <Input 
              label="WhatsApp / Nomor Kontak"
              value={formData.no_hp} 
              onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
              placeholder="0812..."
              icon={Phone}
            />
          </div>
          <div className="grid grid-cols-2 gap-10">
            <Input 
              label="Tgl Serah Terima (Opsional)"
              type="date"
              value={formData.tgl_serah_terima} 
              onChange={(e) => setFormData({...formData, tgl_serah_terima: e.target.value})}
              icon={Calendar}
            />
            <Select 
              label="Status Kepemilikan"
              value={formData.status_hunian}
              onChange={(e) => setFormData({...formData, status_hunian: e.target.value})}
            >
              <option value="Pemilik">Pemilik</option>
              <option value="Pengontrak">Pengontrak</option>
            </Select>
          </div>

          {formData.status_hunian === 'Pengontrak' && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Informasi Pemilik Aset</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Data administratif pemilik rumah asli</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <Input 
                  label="Nama Pemilik"
                  value={formData.nama_pemilik} 
                  onChange={(e) => setFormData({...formData, nama_pemilik: e.target.value})}
                  placeholder="Nama sesuai sertifikat"
                  icon={UserCircle}
                />
                <Input 
                  label="Kontak Pemilik (WA)"
                  value={formData.kontak_pemilik} 
                  onChange={(e) => setFormData({...formData, kontak_pemilik: e.target.value})}
                  placeholder="0812..."
                  icon={Phone}
                />
              </div>
            </div>
          )}

          {!isEditMode && (
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">Buat Akun Login</span>
                    <span className="text-[10px] text-slate-500 font-medium">Warga bisa langsung login ke aplikasi</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                  checked={formData.createAccount}
                  onChange={(e) => setFormData({...formData, createAccount: e.target.checked})}
                />
              </div>

              {formData.createAccount && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <PasswordInput 
                    label="Password Login Warga"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Minimal 6 karakter"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 italic font-medium">Informasikan password ini kepada warga setelah pendaftaran selesai.</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 py-2.5 font-semibold" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1 py-2.5 font-semibold" onClick={handleAddWarga} isLoading={isSubmitting}>
              {isEditMode ? "Finalize Updates" : "Complete Registry"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title={resetData.hasAccount ? "Account Security" : "Account Activation"}
        size="md"
      >
        <form onSubmit={submitResetPassword} className="space-y-10 p-4">
          <div className="flex flex-col items-center text-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${resetData.hasAccount ? 'bg-amber-500 shadow-amber-200 rotate-3' : 'bg-indigo-600 shadow-indigo-200 -rotate-3'}`}>
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {resetData.hasAccount ? 'Manage Credential' : 'New Access Point'}
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-[240px] mx-auto leading-relaxed">
                {resetData.hasAccount 
                  ? `Updating security access for ${resetData.nama}`
                  : `Establishing digital identity for ${resetData.nama}`}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {!resetData.hasAccount && (
              <Input 
                label="Email Address"
                type="email"
                required
                value={resetData.email}
                onChange={(e) => setResetData({...resetData, email: e.target.value})}
                placeholder="email@warga.com"
                icon={Mail}
              />
            )}

            <PasswordInput 
              label="Password Credential"
              required
              value={resetData.newPassword}
              onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="flex flex-col gap-4 pt-2">
            <button 
              type="submit" 
              disabled={isResetting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95"
            >
              {isResetting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>{resetData.hasAccount ? "Update Security" : "Sign In to Platform"}</span>
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="w-full py-3 text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Cancel Operation
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Residents Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Residents from Google Sheets"
      >
        <div className="space-y-8 p-2">
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Spreadsheet Sync</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Enter the public Google Sheets URL. Ensure the sheet has columns for Unit No (Block), PIC 1 Nama (Name), and PIC HP 1.
              </p>
            </div>
          </div>

          <Input 
            label="Google Sheets URL"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            icon={Map}
          />

          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 py-2.5 font-semibold" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1 py-2.5 font-semibold" onClick={handleImport} isLoading={isImporting}>
              Start Import
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
