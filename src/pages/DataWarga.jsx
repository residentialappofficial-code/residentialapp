import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, ReceiptText } from "lucide-react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  Table,
  Badge,
  Icon,
  Spinner,
  Center,
  Stack,
} from "@chakra-ui/react";
import { InputGroup } from "@/components/ui/chakra/input-group";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/chakra/dialog";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/chakra/select";
import { Field } from "@/components/ui/chakra/field";
import { toaster } from "@/components/ui/chakra/toaster";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function DataWarga() {
  const { profile, selectedPerumahanId } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nama: "",
    blok: "",
    no_hp: "",
    email: "",
    role: "resident",
    status_hunian: "Pemilik",
    status_iuran: "Belum Bayar",
    status_bangunan: "Ready",
    iuran_start_date: "",
    ipl_start_date: "",
    pic_nama_2: "",
    pic_hp_2: "",
    tanggal_akad: "",
    keterangan_akad: "",
    password: ""
  });

  const [historyWarga, setHistoryWarga] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedPerumahanId) {
      const timer = setTimeout(() => {
        fetchData(searchTerm);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, selectedPerumahanId]);

  const fetchData = async (search = "") => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      let query = supabase.from('warga')
        .select('*')
        .eq('perumahan_id', selectedPerumahanId)
        .order('created_at', { ascending: true });
      
      if (search) {
        query = query.or(`nama.ilike.%${search}%,blok.ilike.%${search}%`);
      }

      const { data: residents, error } = await query;
      
      if (error) throw error;
      setData(residents || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      toaster.create({
        title: "Gagal mengambil data",
        description: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data;

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nama: item.nama,
        blok: item.blok,
        no_hp: item.no_hp || "",
        email: item.email || "",
        role: item.role || "resident",
        status_hunian: item.status_hunian,
        status_iuran: item.status_iuran,
        status_bangunan: item.status_bangunan || "Ready",
        iuran_start_date: item.iuran_start_date || "",
        ipl_start_date: item.ipl_start_date || "",
        pic_nama_2: item.pic_nama_2 || "",
        pic_hp_2: item.pic_hp_2 || "",
        tanggal_akad: item.tanggal_akad || "",
        keterangan_akad: item.keterangan_akad || "",
        password: "" // Reset password on edit
      });
    } else {
      setEditingId(null);
      setFormData({
        nama: "",
        blok: "",
        no_hp: "",
        email: "",
        role: "resident",
        status_hunian: "Pemilik",
        status_iuran: "Belum Bayar",
        status_bangunan: "Ready",
        iuran_start_date: "",
        ipl_start_date: "",
        pic_nama_2: "",
        pic_hp_2: "",
        tanggal_akad: "",
        keterangan_akad: "",
        password: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleShowHistory = async (warga) => {
    try {
      setHistoryWarga(warga);
      setIsHistoryOpen(true);
      setHistoryLoading(true);
      const { data: history, error } = await supabase
        .from('pembayaran_iuran')
        .select('*')
        .eq('warga_id', warga.id)
        .order('tahun', { ascending: false })
        .order('bulan', { ascending: false });
      
      if (error) throw error;
      setPaymentHistory(history || []);
    } catch (error) {
      toaster.create({ title: "Gagal memuat riwayat", description: error.message, type: "error" });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('warga')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
        toaster.create({ title: "Berhasil", description: "Data warga berhasil diperbarui", type: "success" });
      } else if (formData.email && formData.password) {
        // JIKA ADA EMAIL & PASSWORD -> BUAT AKUN LOGIN VIA API
        setLoading(true);
        const response = await fetch('/api/create-resident', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            profileData: { ...formData, perumahan_id: selectedPerumahanId, password: undefined }
          })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Gagal membuat akun');

        toaster.create({ title: "Berhasil", description: "Akun login warga berhasil dibuat", type: "success" });
      } else {
        // JIKA BIASA (TANPA AKUN LOGIN)
        const { error } = await supabase
          .from('warga')
          .insert([{ ...formData, perumahan_id: selectedPerumahanId, password: undefined }]);
        
        if (error) throw error;
        toaster.create({ title: "Berhasil", description: "Warga baru berhasil ditambahkan", type: "success" });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toaster.create({
        title: "Terjadi kesalahan",
        description: error.message,
        type: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    
    try {
      const { error } = await supabase
        .from('warga')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toaster.create({
        title: "Berhasil",
        description: "Data warga dihapus",
        type: "success",
      });
      fetchData();
    } catch (error) {
      toaster.create({
        title: "Gagal menghapus data",
        description: error.message,
        type: "error",
      });
    }
  };

  return (
    <VStack spacing={6} align="stretch" width="full">
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4}>
        <Box>
          <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="gray.900">Data Warga</Heading>
          <Text color="gray.500">Kelola informasi warga, status hunian, dan iuran.</Text>
        </Box>
        
        <DialogRoot 
          open={isDialogOpen} 
          onOpenChange={(e) => setIsDialogOpen(e.open)}
          placement="center"
        >
          <Button colorScheme="blue" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={() => handleOpenDialog()}>
            Tambah Warga
          </Button>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Data Warga" : "Tambah Warga Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <DialogBody pb={6}>
                <Stack spacing={4}>
                  <Field label="Nama Lengkap" required>
                    <Input 
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      placeholder="Masukkan nama lengkap"
                    />
                  </Field>
                  
                  <Field label="Blok/No Rumah" required>
                    <Input 
                      placeholder="Contoh: A-12"
                      value={formData.blok}
                      onChange={(e) => setFormData({...formData, blok: e.target.value})}
                    />
                  </Field>
                  
                  <HStack spacing={4}>
                    <Field label="No. HP">
                      <Input 
                        value={formData.no_hp}
                        onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                      />
                    </Field>
                    
                    <Field label="Email">
                      <Input 
                        type="email"
                        placeholder="email@perumahan.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </Field>
                  </HStack>

                  {!editingId && (
                    <Field label="Set Password Login (Minimal 6 karakter)" helperText="Warga akan login menggunakan email dan password ini.">
                      <Input 
                        type="password"
                        placeholder="Tentukan password awal warga"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </Field>
                  )}

                  <HStack spacing={4}>
                    <Field label="PIC 2 Nama">
                      <Input 
                        placeholder="Nama Kontak ke-2"
                        value={formData.pic_nama_2}
                        onChange={(e) => setFormData({...formData, pic_nama_2: e.target.value})}
                      />
                    </Field>
                    <Field label="PIC 2 HP">
                      <Input 
                        placeholder="No HP Kontak ke-2"
                        value={formData.pic_hp_2}
                        onChange={(e) => setFormData({...formData, pic_hp_2: e.target.value})}
                      />
                    </Field>
                  </HStack>

                  <HStack spacing={4}>
                    <Field label="Tanggal Akad">
                      <Input 
                        type="date"
                        value={formData.tanggal_akad}
                        onChange={(e) => setFormData({...formData, tanggal_akad: e.target.value})}
                      />
                    </Field>
                    <Field label="Keterangan Akad">
                      <Input 
                        placeholder="Catatan akad (opsional)"
                        value={formData.keterangan_akad}
                        onChange={(e) => setFormData({...formData, keterangan_akad: e.target.value})}
                      />
                    </Field>
                  </HStack>

                  <HStack spacing={4}>
                    <Field label="Mulai Iuran">
                      <Input 
                        type="date"
                        value={formData.iuran_start_date}
                        onChange={(e) => setFormData({...formData, iuran_start_date: e.target.value})}
                      />
                    </Field>
                    <Field label="Mulai IPL">
                      <Input 
                        type="date"
                        value={formData.ipl_start_date}
                        onChange={(e) => setFormData({...formData, ipl_start_date: e.target.value})}
                      />
                    </Field>
                  </HStack>
                  
                  <HStack spacing={4}>
                    <Field label="Status Bangunan">
                      <SelectRoot 
                        value={[formData.status_bangunan]} 
                        onValueChange={(e) => setFormData({...formData, status_bangunan: e.value[0]})}
                      >
                        <SelectTrigger>
                          <SelectValueText placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem item="Ready" key="Ready">Ready</SelectItem>
                          <SelectItem item="Inprogress" key="Inprogress">Inprogress</SelectItem>
                          <SelectItem item="Empty" key="Empty">Empty</SelectItem>
                        </SelectContent>
                      </SelectRoot>
                    </Field>
                    <Field label="Status Hunian">
                      <SelectRoot 
                        value={[formData.status_hunian]} 
                        onValueChange={(e) => setFormData({...formData, status_hunian: e.value[0]})}
                      >
                        <SelectTrigger>
                          <SelectValueText placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem item="Pemilik" key="Pemilik">Pemilik</SelectItem>
                          <SelectItem item="Kontrak" key="Kontrak">Kontrak</SelectItem>
                          <SelectItem item="Kos" key="Kos">Kos</SelectItem>
                        </SelectContent>
                      </SelectRoot>
                    </Field>
                  </HStack>
                  
                  <Field label="Level Akses / Role">
                    <SelectRoot 
                      value={[formData.role]} 
                      onValueChange={(e) => setFormData({...formData, role: e.value[0]})}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Pilih Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem item="resident" key="resident">Warga / Resident</SelectItem>
                        <SelectItem item="admin" key="admin">Admin Perumahan</SelectItem>
                        <SelectItem item="super_admin" key="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                  
                  <Field label="Status Hunian">
                    <SelectRoot 
                      value={[formData.status_hunian]} 
                      onValueChange={(e) => setFormData({...formData, status_hunian: e.value[0]})}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem item="Pemilik" key="Pemilik">Pemilik</SelectItem>
                        <SelectItem item="Kontrak" key="Kontrak">Kontrak</SelectItem>
                        <SelectItem item="Kos" key="Kos">Kos</SelectItem>
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                </Stack>
              </DialogBody>
              
              <DialogFooter>
                <DialogActionTrigger asChild>
                  <Button variant="ghost">Batal</Button>
                </DialogActionTrigger>
                <Button type="submit" colorScheme="blue">Simpan Data</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </DialogRoot>
      </Flex>

      <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
        <InputGroup startElement={<Icon as={Search} color="gray.400" />}>
          <Input
            placeholder="Cari nama atau blok rumah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            border="none"
            _focus={{ boxShadow: "none" }}
            maxWidth="sm"
          />
        </InputGroup>
      </Box>

      <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
        <Box overflowX="auto">
          <Table.Root variant="simple">
            <Table.Header bg="gray.50">
              <Table.Row>
                <Table.ColumnHeader width="50px">No</Table.ColumnHeader>
                <Table.ColumnHeader>Nama Warga</Table.ColumnHeader>
                <Table.ColumnHeader>Email / Akun</Table.ColumnHeader>
                <Table.ColumnHeader>Blok/No</Table.ColumnHeader>
                <Table.ColumnHeader>Bangunan</Table.ColumnHeader>
                <Table.ColumnHeader>No. HP</Table.ColumnHeader>
                <Table.ColumnHeader>Status Hunian</Table.ColumnHeader>
                <Table.ColumnHeader>Status Iuran</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Aksi</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={9} py={10}>
                    <Center>
                      <HStack spacing={3} color="gray.500">
                        <Spinner size="sm" />
                        <Text>Memuat data warga...</Text>
                      </HStack>
                    </Center>
                  </Table.Cell>
                </Table.Row>
              ) : filteredData.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={9} textAlign="center" py={10} color="gray.500">
                    Tidak ada data warga ditemukan.
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredData.map((warga, index) => (
                  <Table.Row key={warga.id}>
                    <Table.Cell color="gray.500">{index + 1}</Table.Cell>
                    <Table.Cell fontWeight="medium" color="gray.900">{warga.nama}</Table.Cell>
                    <Table.Cell>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm">{warga.email || "-"}</Text>
                        {warga.role && (
                          <Text fontSize="10px" textTransform="uppercase" fontWeight="bold" color="blue.600">
                            {warga.role}
                          </Text>
                        )}
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>{warga.blok}</Table.Cell>
                    <Table.Cell>
                      <Badge variant="subtle" size="sm" colorScheme={warga.status_bangunan === 'Ready' ? 'green' : 'gray'}>
                        {warga.status_bangunan || '-'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{warga.no_hp || "-"}</Table.Cell>
                    <Table.Cell>
                      <Badge 
                        variant="outline" 
                        colorScheme={warga.status_hunian === "Pemilik" ? "blue" : "orange"}
                        bg={warga.status_hunian === "Pemilik" ? "blue.50" : "orange.50"}
                      >
                        {warga.status_hunian}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge 
                        variant="outline" 
                        colorScheme={
                          warga.status_iuran === "Lunas" ? "green" : 
                          warga.status_iuran === "Sebagian" ? "yellow" : "red"
                        }
                        bg={
                          warga.status_iuran === "Lunas" ? "green.50" : 
                          warga.status_iuran === "Sebagian" ? "yellow.50" : "red.50"
                        }
                      >
                        {warga.status_iuran || "Belum Bayar"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack justify="end" spacing={2}>
                        <Button variant="ghost" size="sm" p={1} onClick={() => handleOpenDialog(warga)}>
                          <Icon as={Edit} boxSize={4} color="blue.600" />
                        </Button>
                        <Button variant="ghost" size="sm" p={1} onClick={() => handleShowHistory(warga)}>
                          <Icon as={ReceiptText} boxSize={4} color="emerald.600" />
                        </Button>
                        <Button variant="ghost" size="sm" p={1} onClick={() => handleDelete(warga.id)}>
                          <Icon as={Trash2} boxSize={4} color="red.600" />
                        </Button>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>

      {/* DIALOG RIWAYAT IURAN */}
      <DialogRoot 
        open={isHistoryOpen} 
        onOpenChange={(e) => setIsHistoryOpen(e.open)}
        placement="center"
        size="lg"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Riwayat Iuran: {historyWarga?.nama}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {historyLoading ? (
              <Center py={10}><Spinner /></Center>
            ) : paymentHistory.length === 0 ? (
              <Text textAlign="center" py={10} color="gray.500">Belum ada catatan pembayaran.</Text>
            ) : (
              <Table.Root variant="simple" size="sm">
                <Table.Header bg="gray.50">
                  <Table.Row>
                    <Table.ColumnHeader>Bulan/Tahun</Table.ColumnHeader>
                    <Table.ColumnHeader>Jumlah</Table.ColumnHeader>
                    <Table.ColumnHeader>Tanggal Bayar</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {paymentHistory.map((h) => (
                    <Table.Row key={h.id}>
                      <Table.Cell fontWeight="bold">{h.bulan}/{h.tahun}</Table.Cell>
                      <Table.Cell>Rp {h.jumlah.toLocaleString('id-ID')}</Table.Cell>
                      <Table.Cell>{h.tanggal_bayar || '-'}</Table.Cell>
                      <Table.Cell>
                        <Badge colorScheme={h.status === 'Lunas' ? 'green' : 'orange'}>{h.status}</Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline">Tutup</Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
}
