import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  SimpleGrid,
  Table,
  Badge,
  Icon,
  Spinner,
  Center,
  Stack,
} from "@chakra-ui/react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/chakra/dialog";
import { Field } from "@/components/ui/chakra/field";
import { toaster } from "@/components/ui/chakra/toaster";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function Penggajian() {
  const { profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nama_pegawai: "",
    jabatan: "",
    gaji_pokok: 0,
    tunjangan: 0,
    potongan: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: payroll, error } = await supabase
        .from('penggajian')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setData(payroll || []);
    } catch {
      toaster.create({
        title: "Gagal mengambil data gaji",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        nama_pegawai: item.nama_pegawai,
        jabatan: item.jabatan,
        gaji_pokok: item.gaji_pokok,
        tunjangan: item.tunjangan,
        potongan: item.potongan,
      });
    } else {
      setEditingId(null);
      setFormData({
        nama_pegawai: "",
        jabatan: "",
        gaji_pokok: 0,
        tunjangan: 0,
        potongan: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const gaji_bersih = Number(formData.gaji_pokok) + Number(formData.tunjangan) - Number(formData.potongan);
      const saveObj = { 
        ...formData, 
        gaji_pokok: Number(formData.gaji_pokok),
        tunjangan: Number(formData.tunjangan),
        potongan: Number(formData.potongan),
        gaji_bersih 
      };

      if (editingId) {
        const { error } = await supabase
          .from('penggajian')
          .update(saveObj)
          .eq('id', editingId);
        if (error) throw error;
        toaster.create({
          title: "Berhasil",
          description: "Data penggajian diperbarui",
          type: "success",
        });
      } else {
        const { error } = await supabase
          .from('penggajian')
          .insert([{ 
            ...saveObj, 
            perumahan_id: profile?.perumahan_id 
          }]);
        if (error) throw error;
        toaster.create({
          title: "Berhasil",
          description: "Pegawai baru ditambahkan",
          type: "success",
        });
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
    if (!confirm("Hapus data ini?")) return;
    try {
      const { error } = await supabase
        .from('penggajian')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toaster.create({
        title: "Berhasil",
        description: "Data dihapus",
        type: "success",
      });
      fetchData();
    } catch {
      toaster.create({
        title: "Gagal menghapus",
        type: "error",
      });
    }
  };

  const totalGajiBulanIni = useMemo(() => {
    return data.reduce((acc, curr) => acc + Number(curr.gaji_bersih), 0);
  }, [data]);

  return (
    <VStack spacing={8} align="stretch" width="full">
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4}>
        <Box>
          <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="gray.900">Penggajian Staf</Heading>
          <Text color="gray.500">Rekap dan manajemen gaji satpam, petugas kebersihan, dll.</Text>
        </Box>
        
        <DialogRoot 
          open={isDialogOpen} 
          onOpenChange={(e) => setIsDialogOpen(e.open)}
          placement="center"
        >
          <Button colorScheme="blue" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={() => handleOpenDialog()}>
            Tambah Pegawai
          </Button>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Data Penggajian" : "Tambah Pegawai"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <DialogBody pb={6}>
                <Stack spacing={4}>
                  <Field label="Nama Pegawai" required>
                    <Input 
                      value={formData.nama_pegawai}
                      onChange={(e) => setFormData({...formData, nama_pegawai: e.target.value})}
                      placeholder="Masukkan nama lengkap"
                    />
                  </Field>
                  
                  <Field label="Posisi / Jabatan" required>
                    <Input 
                      placeholder="Contoh: Satpam"
                      value={formData.jabatan}
                      onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                    />
                  </Field>
                  
                  <Field label="Gaji Pokok" required>
                    <Input 
                      type="number"
                      value={formData.gaji_pokok || ""}
                      onChange={(e) => setFormData({...formData, gaji_pokok: e.target.value})}
                      placeholder="0"
                    />
                  </Field>
                  
                  <HStack spacing={4}>
                    <Field label="Tunjangan">
                      <Input 
                        type="number"
                        value={formData.tunjangan || ""}
                        onChange={(e) => setFormData({...formData, tunjangan: e.target.value})}
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Potongan">
                      <Input 
                        type="number"
                        value={formData.potongan || ""}
                        onChange={(e) => setFormData({...formData, potongan: e.target.value})}
                        placeholder="0"
                      />
                    </Field>
                  </HStack>
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

      <Box p={6} bg="white" borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100" borderLeft="4px solid" borderLeftColor="red.500">
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" fontWeight="medium" color="gray.600">Total Beban Gaji Bulan Ini</Text>
          <Text fontSize="3xl" fontWeight="bold" color="red.600">
            Rp {totalGajiBulanIni.toLocaleString('id-ID')}
          </Text>
        </VStack>
      </Box>

      <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
        <Box overflowX="auto">
          <Table.Root variant="simple">
            <Table.Header bg="gray.50">
              <Table.Row>
                <Table.ColumnHeader>Nama Pegawai</Table.ColumnHeader>
                <Table.ColumnHeader>Jabatan</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Gaji Pokok</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Tunjangan</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right" color="red.600">Potongan</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right" fontWeight="bold" bg="gray.50">Gaji Bersih</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Aksi</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={7} py={10}>
                    <Center>
                      <HStack spacing={3} color="gray.500">
                        <Spinner size="sm" />
                        <Text>Memuat data...</Text>
                      </HStack>
                    </Center>
                  </Table.Cell>
                </Table.Row>
              ) : data.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} textAlign="center" py={10} color="gray.500">
                    Tidak ada data pegawai.
                  </Table.Cell>
                </Table.Row>
              ) : (
                data.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell fontWeight="semibold" color="gray.900">{item.nama_pegawai}</Table.Cell>
                    <Table.Cell color="gray.600">{item.jabatan}</Table.Cell>
                    <Table.Cell textAlign="right">Rp {item.gaji_pokok.toLocaleString('id-ID')}</Table.Cell>
                    <Table.Cell textAlign="right">Rp {item.tunjangan.toLocaleString('id-ID')}</Table.Cell>
                    <Table.Cell textAlign="right" color="red.500">Rp {item.potongan.toLocaleString('id-ID')}</Table.Cell>
                    <Table.Cell textAlign="right" fontWeight="bold" color="gray.900" bg="gray.50/30">
                      Rp {item.gaji_bersih.toLocaleString('id-ID')}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack justify="end" spacing={2}>
                        <Button variant="ghost" size="sm" p={1} onClick={() => handleOpenDialog(item)}>
                          <Icon as={Edit} boxSize={4} color="blue.600" />
                        </Button>
                        <Button variant="ghost" size="sm" p={1} onClick={() => handleDelete(item.id)}>
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
    </VStack>
  );
}
