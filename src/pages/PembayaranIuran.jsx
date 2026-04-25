import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, CheckCircle2 } from "lucide-react";
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
  Center,
  Stack,
  SimpleGrid,
  Spinner,
  Tabs,
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
import { useAuth } from "@/contexts/AuthContext";

export default function PembayaranIuran() {
  const { profile, selectedPerumahanId } = useAuth();
  const [data, setData] = useState([]);
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    warga_id: "",
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    jumlah: 150000,
    tanggal_bayar: new Date().toISOString().split('T')[0],
    status: "Lunas"
  });

  const [activeTab, setActiveTab] = useState("list");
  const [matrixData, setMatrixData] = useState([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

  useEffect(() => {
    if (selectedPerumahanId) {
      if (activeTab === "list") {
        fetchData();
      } else {
        fetchMatrixData();
      }
      fetchWarga();
    }
  }, [filterMonth, filterYear, selectedPerumahanId, activeTab]);

  const fetchMatrixData = async () => {
    try {
      setMatrixLoading(true);
      const { data: payments, error } = await supabase
        .from('pembayaran_iuran')
        .select('warga_id, bulan, tahun, status')
        .eq('tahun', filterYear);
      
      if (error) throw error;
      setMatrixData(payments || []);
    } catch (error) {
      toaster.create({ title: "Gagal memuat matrix", description: error.message, type: "error" });
    } finally {
      setMatrixLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;

      const { data: payments, error } = await supabase
        .from('pembayaran_iuran')
        .select(`
          *,
          warga!inner(nama, blok, perumahan_id)
        `)
        .eq('warga.perumahan_id', selectedPerumahanId)
        .eq('bulan', filterMonth)
        .eq('tahun', filterYear)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setData(payments || []);
    } catch (error) {
      toaster.create({
        title: "Gagal mengambil data iuran",
        description: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWarga = async () => {
    try {
      if (!selectedPerumahanId) return;
      
      const { data: residents, error } = await supabase
        .from('warga')
        .select('id, nama, blok')
        .eq('perumahan_id', selectedPerumahanId);
      if (error) throw error;
      setWargaList(residents || []);
    } catch {
      toaster.create({
        title: "Gagal mengambil data warga",
        type: "error",
      });
    }
  };

  const filteredData = data.filter(item => 
    item.warga?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.warga?.blok?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = () => {
    setFormData({
      warga_id: "",
      bulan: new Date().getMonth() + 1,
      tahun: new Date().getFullYear(),
      jumlah: 150000,
      tanggal_bayar: new Date().toISOString().split('T')[0],
      status: "Lunas"
    });
    setIsDialogOpen(true);
  };

  const handleMatrixClick = (wargaId, monthIndex) => {
    const existing = matrixData.find(p => p.warga_id === wargaId && p.bulan === (monthIndex + 1));
    
    if (existing) {
      toaster.create({
        title: "Info Pembayaran",
        description: `Warga ini sudah lunas untuk bulan ${months[monthIndex]}`,
        type: "info"
      });
      return;
    }

    setFormData({
      warga_id: wargaId,
      bulan: monthIndex + 1,
      tahun: filterYear,
      jumlah: 150000,
      tanggal_bayar: new Date().toISOString().split('T')[0],
      status: "Lunas"
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.warga_id) {
      toaster.create({ title: "Peringatan", description: "Pilih warga", type: "warning" });
      return;
    }
    try {
      const { error } = await supabase.from('pembayaran_iuran').insert([formData]);
      if (error) throw error;
      toaster.create({ title: "Berhasil", description: "Pembayaran iuran dicatat", type: "success" });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toaster.create({ title: "Gagal", description: error.message, type: "error" });
    }
  };

  const totalPaid = data.reduce((sum, item) => sum + (item.status === 'Lunas' ? item.jumlah : 0), 0);
  const totalPending = data.reduce((sum, item) => sum + (item.status === 'Belum Bayar' ? item.jumlah : 0), 0);

  return (
    <VStack spacing={8} align="stretch" width="full">
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4}>
        <Box>
          <Heading size="lg" fontWeight="bold">Pembayaran Iuran</Heading>
          <Text color="gray.500">Kelola dan pantau iuran bulanan warga.</Text>
        </Box>
        <HStack spacing={3}>
          <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)} placement="center">
            <Button colorScheme="blue" leftIcon={<Icon as={Plus} />} onClick={handleOpenDialog}>Catat Pembayaran</Button>
            <DialogContent>
              <DialogHeader><DialogTitle>Catat Pembayaran Iuran</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit}>
                <DialogBody pb={6}>
                  <Stack spacing={4}>
                    <Field label="Pilih Warga" required>
                      <SelectRoot value={[formData.warga_id]} onValueChange={(e) => setFormData({...formData, warga_id: e.value[0]})}>
                        <SelectTrigger><SelectValueText placeholder="Pilih warga" /></SelectTrigger>
                        <SelectContent>{wargaList.map(w => <SelectItem item={w.id} key={w.id}>{w.nama} - {w.blok}</SelectItem>)}</SelectContent>
                      </SelectRoot>
                    </Field>
                    <HStack spacing={4}>
                      <Field label="Bulan" required>
                        <SelectRoot value={[formData.bulan.toString()]} onValueChange={(e) => setFormData({...formData, bulan: parseInt(e.value[0])})}>
                          <SelectTrigger><SelectValueText /></SelectTrigger>
                          <SelectContent>{months.map((m, i) => <SelectItem item={(i+1).toString()} key={i+1}>{m}</SelectItem>)}</SelectContent>
                        </SelectRoot>
                      </Field>
                      <Field label="Tahun" required>
                        <Input type="number" value={formData.tahun} onChange={(e) => setFormData({...formData, tahun: parseInt(e.target.value)})} />
                      </Field>
                    </HStack>
                    <HStack spacing={4}>
                      <Field label="Jumlah (Rp)" required>
                        <Input type="number" value={formData.jumlah} onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value)})} />
                      </Field>
                      <Field label="Tanggal" required>
                        <Input type="date" value={formData.tanggal_bayar} onChange={(e) => setFormData({...formData, tanggal_bayar: e.target.value})} />
                      </Field>
                    </HStack>
                  </Stack>
                </DialogBody>
                <DialogFooter>
                  <DialogActionTrigger asChild><Button variant="ghost">Batal</Button></DialogActionTrigger>
                  <Button type="submit" colorScheme="blue">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </DialogRoot>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box bg="white" p={5} borderRadius="xl" shadow="sm" borderLeft="4px solid" borderLeftColor="blue.500">
          <Text fontSize="sm" color="gray.500">Total Terkumpul</Text>
          <Text fontSize="2xl" fontWeight="bold">Rp {totalPaid.toLocaleString('id-ID')}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" shadow="sm" borderLeft="4px solid" borderLeftColor="orange.500">
          <Text fontSize="sm" color="gray.500">Total Belum Bayar</Text>
          <Text fontSize="2xl" fontWeight="bold">Rp {totalPending.toLocaleString('id-ID')}</Text>
        </Box>
        <Box bg="white" p={5} borderRadius="xl" shadow="sm" borderLeft="4px solid" borderLeftColor="green.500">
          <Text fontSize="sm" color="gray.500">Target</Text>
          <Text fontSize="2xl" fontWeight="bold">Rp {(totalPaid + totalPending).toLocaleString('id-ID')}</Text>
        </Box>
      </SimpleGrid>

      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)} variant="enclosed">
        <Tabs.List bg="gray.100/50" p={1} borderRadius="xl">
          <Tabs.Trigger value="list" borderRadius="lg" fontWeight="900">Daftar Transaksi</Tabs.Trigger>
          <Tabs.Trigger value="matrix" borderRadius="lg" fontWeight="900">Matrix Iuran (Excel View)</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="list">
          <VStack spacing={6} align="stretch" pt={4}>
            <Box bg="white" p={4} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
              <Flex direction={{ base: "column", lg: "row" }} gap={4}>
                <InputGroup startElement={<Icon as={Search} color="gray.400" />} flex="1">
                  <Input placeholder="Cari nama atau blok..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bg="gray.50" border="none" />
                </InputGroup>
                <HStack spacing={3}>
                  <SelectRoot value={[filterMonth.toString()]} onValueChange={(e) => setFilterMonth(parseInt(e.value[0]))} width="160px">
                    <SelectTrigger><SelectValueText placeholder="Pilih Bulan" /></SelectTrigger>
                    <SelectContent>{months.map((m, i) => <SelectItem item={(i+1).toString()} key={i+1}>{m}</SelectItem>)}</SelectContent>
                  </SelectRoot>
                  <SelectRoot value={[filterYear.toString()]} onValueChange={(e) => setFilterYear(parseInt(e.value[0]))} width="120px">
                    <SelectTrigger><SelectValueText placeholder="Tahun" /></SelectTrigger>
                    <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem item={y.toString()} key={y}>{y}</SelectItem>)}</SelectContent>
                  </SelectRoot>
                </HStack>
              </Flex>
            </Box>

            <Box bg="white" borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
              <Table.Root variant="simple">
                <Table.Header bg="gray.50">
                  <Table.Row>
                    <Table.ColumnHeader>Warga</Table.ColumnHeader>
                    <Table.ColumnHeader>Blok</Table.ColumnHeader>
                    <Table.ColumnHeader>Bulan</Table.ColumnHeader>
                    <Table.ColumnHeader>Jumlah</Table.ColumnHeader>
                    <Table.ColumnHeader>Tanggal</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">Aksi</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {loading ? (
                    <Table.Row>
                      <Table.Cell colSpan={7} py={10}>
                        <Center><Spinner size="sm" mr={3} /> Memuat...</Center>
                      </Table.Cell>
                    </Table.Row>
                  ) : filteredData.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={7} textAlign="center" py={10}>Tidak ada data.</Table.Cell>
                    </Table.Row>
                  ) : filteredData.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell fontWeight="medium">{item.warga?.nama}</Table.Cell>
                      <Table.Cell>{item.warga?.blok}</Table.Cell>
                      <Table.Cell>{months[item.bulan-1]} {item.tahun}</Table.Cell>
                      <Table.Cell>Rp {item.jumlah.toLocaleString('id-ID')}</Table.Cell>
                      <Table.Cell>{item.tanggal_bayar || '-'}</Table.Cell>
                      <Table.Cell><Badge variant="outline" colorScheme={item.status === 'Lunas' ? 'green' : 'orange'}>{item.status}</Badge></Table.Cell>
                      <Table.Cell textAlign="right"><Button variant="ghost" size="sm">Detail</Button></Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="matrix">
          <Box bg="white" borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100" overflowX="auto" mt={4}>
            <Table.Root variant="simple" size="sm">
              <Table.Header bg="gray.50">
                <Table.Row>
                  <Table.ColumnHeader position="sticky" left={0} bg="gray.50" zIndex={1} width="200px">Warga / Unit</Table.ColumnHeader>
                  {shortMonths.map(m => (
                    <Table.ColumnHeader key={m} textAlign="center" fontSize="10px" px={1}>{m}</Table.ColumnHeader>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {matrixLoading ? (
                  <Table.Row><Table.Cell colSpan={13} py={10} textAlign="center"><Spinner /></Table.Cell></Table.Row>
                ) : wargaList.length === 0 ? (
                  <Table.Row><Table.Cell colSpan={13} py={10} textAlign="center">Tidak ada warga.</Table.Cell></Table.Row>
                ) : wargaList.map(w => (
                  <Table.Row key={w.id}>
                    <Table.Cell position="sticky" left={0} bg="white" fontWeight="800" fontSize="xs">
                      <VStack align="start" spacing={0}>
                        <Text>{w.nama}</Text>
                        <Text fontSize="10px" color="gray.400">{w.blok}</Text>
                      </VStack>
                    </Table.Cell>
                    {shortMonths.map((_, i) => {
                      const pay = matrixData.find(p => p.warga_id === w.id && p.bulan === (i+1));
                      const isPaid = pay?.status === 'Lunas';
                      const isSkip = pay?.status === 'Skip';
                      return (
                        <Table.Cell key={i} p={0}>
                          <Center 
                            boxSize="full" 
                            py={2}
                            cursor="pointer"
                            _hover={{ bg: "gray.50" }}
                            onClick={() => handleMatrixClick(w.id, i)}
                          >
                            <Box 
                              boxSize={3} 
                              borderRadius="full" 
                              bg={isPaid ? "green.500" : isSkip ? "orange.400" : "red.400"} 
                              boxShadow={isPaid ? "0 0 8px rgba(72, 187, 120, 0.4)" : "none"}
                              title={isPaid ? "Lunas" : isSkip ? "Skip" : "Klik untuk bayar"}
                            />
                          </Center>
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
}
