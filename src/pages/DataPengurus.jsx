import { useState, useEffect } from "react";
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

export default function DataPengurus() {
  const { profile } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nama: "",
    jabatan: "Anggota",
    no_hp: "",
    periode: "2025-2027"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: staff, error } = await supabase
        .from('pengurus')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      setData(staff || []);
    } catch {
      toaster.create({
        title: "Gagal mengambil data pengurus",
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
        nama: item.nama,
        jabatan: item.jabatan,
        no_hp: item.no_hp || "",
        periode: item.periode
      });
    } else {
      setEditingId(null);
      setFormData({
        nama: "",
        jabatan: "Anggota",
        no_hp: "",
        periode: "2025-2027"
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('pengurus')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
        toaster.create({
          title: "Berhasil",
          description: "Data pengurus berhasil diperbarui",
          type: "success",
        });
      } else {
        const { error } = await supabase
          .from('pengurus')
          .insert([{ 
            ...formData, 
            perumahan_id: profile?.perumahan_id 
          }]);
        
        if (error) throw error;
        toaster.create({
          title: "Berhasil",
          description: "Pengurus baru berhasil ditambahkan",
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
    if (!confirm("Hapus data pengurus ini?")) return;
    try {
      const { error } = await supabase
        .from('pengurus')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toaster.create({
        title: "Berhasil",
        description: "Data pengurus dihapus",
        type: "success",
      });
      fetchData();
    } catch (error) {
      toaster.create({
        title: "Gagal menghapus",
        description: error.message,
        type: "error",
      });
    }
  };

  const getJabatanColor = (jabatan) => {
    if (jabatan.includes("Ketua")) return "blue";
    if (jabatan.includes("Sekretaris") || jabatan.includes("Bendahara")) return "purple";
    return "gray";
  };

  return (
    <VStack spacing={6} align="stretch" width="full">
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4}>
        <Box>
          <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="gray.900">Data Pengurus Paguyuban</Heading>
          <Text color="gray.500">Kelola informasi kepengurusan RT/RW atau Paguyuban Perumahan.</Text>
        </Box>
        
        <DialogRoot 
          open={isDialogOpen} 
          onOpenChange={(e) => setIsDialogOpen(e.open)}
          placement="center"
        >
          <Button colorScheme="blue" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={() => handleOpenDialog()}>
            Tambah Pengurus
          </Button>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Data Pengurus" : "Tambah Pengurus"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <DialogBody pb={6}>
                <Stack spacing={4}>
                  <Field label="Nama Lengkap" required>
                    <Input 
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      placeholder="Nama lengkap pengurus"
                    />
                  </Field>
                  
                  <Field label="Jabatan" required>
                    <SelectRoot 
                      value={[formData.jabatan]} 
                      onValueChange={(e) => setFormData({...formData, jabatan: e.value[0]})}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Pilih jabatan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem item="Ketua Paguyuban" key="Ketua Paguyuban">Ketua</SelectItem>
                        <SelectItem item="Wakil Ketua" key="Wakil Ketua">Wakil Ketua</SelectItem>
                        <SelectItem item="Sekretaris" key="Sekretaris">Sekretaris</SelectItem>
                        <SelectItem item="Bendahara" key="Bendahara">Bendahara</SelectItem>
                        <SelectItem item="Seksi Keamanan" key="Seksi Keamanan">Seksi Keamanan</SelectItem>
                        <SelectItem item="Seksi Lingkungan" key="Seksi Lingkungan">Seksi Lingkungan</SelectItem>
                        <SelectItem item="Anggota" key="Anggota">Anggota</SelectItem>
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                  
                  <Field label="No. HP">
                    <Input 
                      value={formData.no_hp}
                      onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                      placeholder="0812..."
                    />
                  </Field>
                  
                  <Field label="Periode Jabatan" required>
                    <Input 
                      placeholder="Contoh: 2025-2027"
                      value={formData.periode}
                      onChange={(e) => setFormData({...formData, periode: e.target.value})}
                    />
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

      <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
        <Box overflowX="auto">
          <Table.Root variant="simple">
            <Table.Header bg="gray.50">
              <Table.Row>
                <Table.ColumnHeader>Nama Pengurus</Table.ColumnHeader>
                <Table.ColumnHeader>Jabatan</Table.ColumnHeader>
                <Table.ColumnHeader>No. HP</Table.ColumnHeader>
                <Table.ColumnHeader>Periode</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Aksi</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={5} py={10}>
                    <Center>
                      <HStack spacing={3} color="gray.500">
                        <Spinner size="sm" />
                        <Text>Memuat data pengurus...</Text>
                      </HStack>
                    </Center>
                  </Table.Cell>
                </Table.Row>
              ) : data.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} textAlign="center" py={10} color="gray.500">
                    Belum ada data pengurus.
                  </Table.Cell>
                </Table.Row>
              ) : (
                data.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell fontWeight="medium" color="gray.900">{item.nama}</Table.Cell>
                    <Table.Cell>
                      <Badge 
                        variant="outline" 
                        colorScheme={getJabatanColor(item.jabatan)}
                        bg={`${getJabatanColor(item.jabatan)}.50`}
                      >
                        {item.jabatan}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{item.no_hp || "-"}</Table.Cell>
                    <Table.Cell>{item.periode}</Table.Cell>
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
