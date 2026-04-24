import { useState, useEffect } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, WalletCards } from "lucide-react";
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

const StatCard = ({ label, value, icon, color, loading }) => (
  <Box 
    borderLeft="4px solid" 
    borderLeftColor={`${color}.500`} 
    bg="white" 
    p={5} 
    borderRadius="xl" 
    shadow="sm"
    border="1px solid"
    borderColor="gray.100"
  >
    <Flex justify="space-between" align="center" mb={2}>
      <Text fontWeight="medium" color="gray.600" fontSize="sm">{label}</Text>
      <Icon as={icon} color={`${color}.600`} boxSize={5} />
    </Flex>
    <Box>
      {loading ? (
        <Spinner size="sm" color="gray.300" />
      ) : (
        <Text fontSize="2xl" fontStyle="normal" fontWeight="bold" color={color === 'blue' ? 'gray.900' : `${color}.600`}>
          {value}
        </Text>
      )}
    </Box>
  </Box>
);

export default function ArusKas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: "",
    tipe: "Masuk",
    jumlah: 0,
    kategori: "Iuran"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: kas, error } = await supabase
        .from('arus_kas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setData(kas || []);
    } catch {
      toaster.create({
        title: "Gagal mengambil data arus kas",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: "",
      tipe: "Masuk",
      jumlah: 0,
      kategori: "Iuran"
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: lastRecord } = await supabase
        .from('arus_kas')
        .select('saldo_after')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const lastBalance = lastRecord?.[0]?.saldo_after || 0;
      const newBalance = formData.tipe === "Masuk" 
        ? lastBalance + formData.jumlah 
        : lastBalance - formData.jumlah;

      const { error } = await supabase
        .from('arus_kas')
        .insert([{
          ...formData,
          saldo_before: lastBalance,
          saldo_after: newBalance
        }]);

      if (error) throw error;
      
      toaster.create({
        title: "Berhasil",
        description: "Catatan arus kas berhasil disimpan",
        type: "success",
      });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toaster.create({
        title: "Gagal menyimpan data",
        description: error.message,
        type: "error",
      });
    }
  };

  const currentBalance = data[0]?.saldo_after || 0;
  const totalMasuk = data.filter(i => i.tipe === "Masuk").reduce((a, b) => a + b.jumlah, 0);
  const totalKeluar = data.filter(i => i.tipe === "Keluar").reduce((a, b) => a + b.jumlah, 0);

  return (
    <VStack spacing={6} align="stretch" width="full">
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4}>
        <Box>
          <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="gray.900">Arus Kas</Heading>
          <Text color="gray.500">Pantau seluruh pemasukan dan pengeluaran paguyuban.</Text>
        </Box>
        
        <DialogRoot 
          open={isDialogOpen} 
          onOpenChange={(e) => setIsDialogOpen(e.open)}
          placement="center"
        >
          <Button colorScheme="blue" leftIcon={<Icon as={Plus} boxSize={4} />} onClick={handleOpenDialog}>
            Tambah Catatan
          </Button>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Arus Kas</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <DialogBody pb={6}>
                <Stack spacing={4}>
                  <HStack spacing={4}>
                    <Field label="Tipe" required>
                      <SelectRoot 
                        value={[formData.tipe]} 
                        onValueChange={(e) => setFormData({...formData, tipe: e.value[0]})}
                      >
                        <SelectTrigger>
                          <SelectValueText />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem item="Masuk" key="Masuk">Pemasukan</SelectItem>
                          <SelectItem item="Keluar" key="Keluar">Pengeluaran</SelectItem>
                        </SelectContent>
                      </SelectRoot>
                    </Field>
                    <Field label="Tanggal" required>
                      <Input 
                        type="date"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                      />
                    </Field>
                  </HStack>

                  <Field label="Kategori" required>
                    <SelectRoot 
                      value={[formData.kategori]} 
                      onValueChange={(e) => setFormData({...formData, kategori: e.value[0]})}
                    >
                      <SelectTrigger>
                        <SelectValueText />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem item="Iuran" key="Iuran">Iuran Warga</SelectItem>
                        <SelectItem item="Donasi" key="Donasi">Donasi</SelectItem>
                        <SelectItem item="Kebersihan" key="Kebersihan">Kebersihan</SelectItem>
                        <SelectItem item="Keamanan" key="Keamanan">Keamanan</SelectItem>
                        <SelectItem item="Perbaikan" key="Perbaikan">Perbaikan Umum</SelectItem>
                        <SelectItem item="Lainnya" key="Lainnya">Lain-lain</SelectItem>
                      </SelectContent>
                    </SelectRoot>
                  </Field>

                  <Field label="Jumlah (Rp)" required>
                    <Input 
                      type="number"
                      value={formData.jumlah || ""}
                      onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})}
                    />
                  </Field>

                  <Field label="Keterangan" required>
                    <Input 
                      placeholder="Contoh: Pembayaran Gaji Security Jan"
                      value={formData.keterangan}
                      onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                    />
                  </Field>
                </Stack>
              </DialogBody>
              
              <DialogFooter>
                <DialogActionTrigger asChild>
                  <Button variant="ghost">Batal</Button>
                </DialogActionTrigger>
                <Button type="submit" colorScheme="blue">Simpan Catatan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </DialogRoot>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <StatCard
          label="Total Saldo (Saat Ini)"
          value={`Rp ${currentBalance.toLocaleString('id-ID')}`}
          icon={WalletCards}
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Total Pemasukan"
          value={`Rp ${totalMasuk.toLocaleString('id-ID')}`}
          icon={ArrowUpRight}
          color="green"
          loading={loading}
        />
        <StatCard
          label="Total Pengeluaran"
          value={`Rp ${totalKeluar.toLocaleString('id-ID')}`}
          icon={ArrowDownRight}
          color="red"
          loading={loading}
        />
      </SimpleGrid>

      <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
        <Box overflowX="auto">
          <Table.Root variant="simple">
            <Table.Header bg="gray.50">
              <Table.Row>
                <Table.ColumnHeader>Tanggal</Table.ColumnHeader>
                <Table.ColumnHeader>Keterangan</Table.ColumnHeader>
                <Table.ColumnHeader>Kategori</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Jumlah</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Saldo Akhir</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={5} py={10}>
                    <Center>
                      <HStack spacing={3} color="gray.500">
                        <Spinner size="sm" />
                        <Text>Memuat data kas...</Text>
                      </HStack>
                    </Center>
                  </Table.Cell>
                </Table.Row>
              ) : data.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} textAlign="center" py={10} color="gray.500">
                    Belum ada catatan arus kas.
                  </Table.Cell>
                </Table.Row>
              ) : (
                data.map((item) => (
                  <Table.Row key={item.id} _hover={{ bg: "gray.50/50" }}>
                    <Table.Cell fontSize="sm">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontWeight="medium" fontSize="sm">{item.keterangan}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge 
                        variant="outline" 
                        size="sm"
                        colorScheme={item.tipe === "Masuk" ? "green" : "red"}
                      >
                        {item.kategori}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="right" color={item.tipe === "Masuk" ? "green.600" : "red.600"} fontWeight="bold">
                      {item.tipe === "Masuk" ? "+" : "-"} Rp {item.jumlah.toLocaleString('id-ID')}
                    </Table.Cell>
                    <Table.Cell textAlign="right" fontWeight="bold" color="gray.900" bg="gray.50/30">
                      Rp {item.saldo_after.toLocaleString('id-ID')}
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
