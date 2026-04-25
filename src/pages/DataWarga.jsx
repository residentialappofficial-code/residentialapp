import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
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
    status_iuran: "Belum Bayar"
  });

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
        status_iuran: item.status_iuran
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
        status_iuran: "Belum Bayar"
      });
    }
    setIsDialogOpen(true);
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
        toaster.create({
          title: "Berhasil",
          description: "Data warga berhasil diperbarui",
          type: "success",
        });
      } else {
        const { error } = await supabase
          .from('warga')
          .insert([{ ...formData, perumahan_id: selectedPerumahanId }]);
        
        if (error) throw error;
        toaster.create({
          title: "Berhasil",
          description: "Warga baru berhasil ditambahkan",
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
                <Table.ColumnHeader>No. HP</Table.ColumnHeader>
                <Table.ColumnHeader>Status Hunian</Table.ColumnHeader>
                <Table.ColumnHeader>Status Iuran</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Aksi</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={8} py={10}>
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
                  <Table.Cell colSpan={8} textAlign="center" py={10} color="gray.500">
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
    </VStack>
  );
}
