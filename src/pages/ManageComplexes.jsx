import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Building2, Calendar, ShieldCheck, Users } from "lucide-react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Table,
  Badge,
  Icon,
  Spinner,
  Center,
  SimpleGrid,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/chakra/toaster";

export default function ManageComplexes() {
  const [perumahan, setPerumahan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerumahan();
  }, []);

  const fetchPerumahan = async () => {
    try {
      setLoading(true);
      // Mengambil data perumahan beserta jumlah warga
      const { data, error } = await supabase
        .from('perumahan')
        .select(`
          *,
          warga:warga(count)
        `)
        .order('nama');
      
      if (error) throw error;
      setPerumahan(data || []);
    } catch (error) {
      toaster.create({
        title: "Gagal memuat data",
        description: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={8} align="stretch" width="full">
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4}>
        <Box>
          <Heading size="lg" fontWeight="900" letterSpacing="tight">Manajemen Komplek</Heading>
          <Text color="gray.500">Pantau dan kelola semua perumahan yang terdaftar di platform.</Text>
        </Box>
        <Button 
          colorScheme="emerald" 
          px={6} 
          borderRadius="xl"
          boxShadow="0 4px 12px rgba(16, 185, 129, 0.2)"
          leftIcon={<Icon as={Plus} />}
        >
          Tambah Komplek Baru
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box bg="white" p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
          <HStack spacing={4}>
            <Center boxSize={12} bg="emerald.50" color="emerald.600" borderRadius="xl">
              <Icon as={Building2} boxSize={6} />
            </Center>
            <Box>
              <Text fontSize="xs" fontWeight="800" color="gray.400" textTransform="uppercase">Total Komplek</Text>
              <Text fontSize="2xl" fontWeight="900">{perumahan.length}</Text>
            </Box>
          </HStack>
        </Box>
        
        <Box bg="white" p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
          <HStack spacing={4}>
            <Center boxSize={12} bg="blue.50" color="blue.600" borderRadius="xl">
              <Icon as={Users} boxSize={6} />
            </Center>
            <Box>
              <Text fontSize="xs" fontWeight="800" color="gray.400" textTransform="uppercase">Total Pengguna</Text>
              <Text fontSize="2xl" fontWeight="900">
                {perumahan.reduce((sum, p) => sum + (p.warga?.[0]?.count || 0), 0)}
              </Text>
            </Box>
          </HStack>
        </Box>

        <Box bg="white" p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
          <HStack spacing={4}>
            <Center boxSize={12} bg="orange.50" color="orange.600" borderRadius="xl">
              <Icon as={ShieldCheck} boxSize={6} />
            </Center>
            <Box>
              <Text fontSize="xs" fontWeight="800" color="gray.400" textTransform="uppercase">Langganan Aktif</Text>
              <Text fontSize="2xl" fontWeight="900">
                {perumahan.filter(p => p.subscription_status === 'active').length}
              </Text>
            </Box>
          </HStack>
        </Box>
      </SimpleGrid>

      <Box bg="white" borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        <Table.Root variant="simple">
          <Table.Header bg="gray.50">
            <Table.Row>
              <Table.ColumnHeader py={4}>Nama Perumahan</Table.ColumnHeader>
              <Table.ColumnHeader>Alamat</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="center">Jumlah Warga</Table.ColumnHeader>
              <Table.ColumnHeader>Status Langganan</Table.ColumnHeader>
              <Table.ColumnHeader>Masa Berlaku</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Aksi</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={6} py={20}>
                  <Center>
                    <VStack>
                      <Spinner color="emerald.500" size="xl" />
                      <Text color="gray.500" fontSize="sm" fontWeight="600">Menarik data komplek...</Text>
                    </VStack>
                  </Center>
                </Table.Cell>
              </Table.Row>
            ) : perumahan.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} textAlign="center" py={10}>Belum ada perumahan terdaftar.</Table.Cell>
              </Table.Row>
            ) : perumahan.map((p) => (
              <Table.Row key={p.id} _hover={{ bg: "gray.50/50" }} transition="all 0.2s">
                <Table.Cell fontWeight="800" color="gray.900" py={5}>{p.nama}</Table.Cell>
                <Table.Cell color="gray.500" fontSize="sm" maxW="200px">{p.alamat || "-"}</Table.Cell>
                <Table.Cell textAlign="center">
                  <Badge variant="subtle" colorScheme="blue" borderRadius="md">
                    {p.warga?.[0]?.count || 0} Warga
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Badge 
                    variant="solid" 
                    bg={p.subscription_status === 'active' ? 'emerald.500' : 'red.500'}
                    borderRadius="full"
                    px={3}
                  >
                    {p.subscription_status?.toUpperCase() || 'INACTIVE'}
                  </Badge>
                </Table.Cell>
                <Table.Cell color="gray.600" fontSize="sm">
                  <HStack>
                    <Icon as={Calendar} boxSize={3} />
                    <Text>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('id-ID') : "-"}</Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  <Button variant="ghost" size="sm" fontWeight="800" color="emerald.600">Kelola</Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </VStack>
  );
}
