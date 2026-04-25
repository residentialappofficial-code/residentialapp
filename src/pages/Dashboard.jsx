import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  Banknote, 
  WalletCards, 
  UserCog, 
  ReceiptText, 
  MessageSquarePlus,
  ArrowUpRight,
  TrendingUp,
  Activity
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Icon,
  Table,
  Badge,
  Button,
  VStack,
  HStack,
  Center,
  Stack,
  Link,
  Separator,
  IconButton,
} from "@chakra-ui/react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/chakra/skeleton";
import { StatLabel, StatRoot, StatValueText, StatHelpText } from "@/components/ui/chakra/stat";

// PREMIUM "FLUP" STYLE CONSTANTS
const PREMIUM_BOX_STYLES = {
  bg: "white",
  borderRadius: "16px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  border: "1px solid",
  borderColor: "gray.100",
  transition: "all 0.2s",
};

const ANIMATION_CLASSES = "slide-up-fade-in";

// Minimalist "Flup" Card
const PremiumCard = ({ title, description, children, footer, icon: iconComp, delay = 0, ...props }) => (
  <Box 
    {...PREMIUM_BOX_STYLES}
    overflow="hidden"
    className={ANIMATION_CLASSES}
    style={{ animationDelay: `${delay}ms` }}
    {...props}
  >
    {title && (
      <Box px={8} pt={8} pb={2}>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <Text fontWeight="800" fontSize="md" color="gray.900" letterSpacing="-0.02em">{title}</Text>
            {description && <Text fontSize="xs" fontWeight="600" color="gray.400">{description}</Text>}
          </VStack>
          {iconComp && (
            <IconButton 
              variant="ghost" 
              size="sm" 
              color="gray.300" 
              icon={<Icon as={iconComp} boxSize={4} />} 
              aria-label="Action"
            />
          )}
        </HStack>
      </Box>
    )}
    <Box px={8} py={8}>
      {children}
    </Box>
    {footer && (
      <Box px={8} py={4} bg="gray.50/50" borderTop="1px solid" borderColor="gray.100">
        {footer}
      </Box>
    )}
  </Box>
);

const PremiumStat = ({ label, value, icon, color = "emerald", loading, helper, trend, delay = 0 }) => (
  <StatRoot 
    {...PREMIUM_BOX_STYLES}
    borderRadius="14px"
    p={6} 
    className={ANIMATION_CLASSES}
    style={{ animationDelay: `${delay}ms` }}
    _hover={{ transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
  >
    <VStack align="start" spacing={3}>
      <HStack spacing={2}>
        <Icon as={icon} color="gray.400" boxSize={4} />
        <StatLabel fontSize="10px" fontWeight="800" color="gray.400" textTransform="uppercase" letterSpacing="0.1em">
          {label}
        </StatLabel>
      </HStack>
      
      <HStack align="baseline" spacing={3} width="full">
        {loading ? (
          <Skeleton height="32px" width="100px" />
        ) : (
          <StatValueText fontSize="2xl" fontWeight="800" color="gray.900" letterSpacing="-0.03em">
            {value}
          </StatValueText>
        )}
        
        {trend && (
          <Badge bg="emerald.50" color="emerald.600" borderRadius="6px" px={2} py={0.5} fontSize="10px" fontWeight="800">
            <HStack spacing={0.5}>
              <Icon as={TrendingUp} boxSize={3} />
              <Text>{trend}</Text>
            </HStack>
          </Badge>
        )}
      </HStack>
      
      {helper && <StatHelpText fontSize="10px" fontWeight="600" color="gray.400">{helper}</StatHelpText>}
    </VStack>
  </StatRoot>
);

// SUB-COMPONENTS
const DashboardHeader = ({ name }) => (
  <Box className={ANIMATION_CLASSES}>
    <HStack justify="space-between" align="end">
      <VStack align="start" spacing={1}>
        <Heading size="3xl" fontWeight="900" letterSpacing="-0.04em" color="gray.900">
          Dashboard
        </Heading>
        <Text color="gray.400" fontWeight="600" fontSize="md">
          Welcome back, {name}! Here is what's happening.
        </Text>
      </VStack>
      <Button 
        bg="emerald.500"
        color="white" 
        size="md" 
        borderRadius="12px" 
        fontWeight="800"
        _hover={{ bg: "emerald.600", transform: "translateY(-1px)" }}
        _active={{ transform: "translateY(0)" }}
        boxShadow="0 4px 12px rgba(16, 185, 129, 0.2)"
      >
        <Icon as={ArrowUpRight} mr={2} boxSize={4} />
        Generate Report
      </Button>
    </HStack>
  </Box>
);

const StatsGrid = ({ stats, loading }) => (
  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
    <PremiumStat
      label="Total Warga"
      value={stats.totalWarga}
      icon={Users}
      loading={loading}
      helper="Terdata dalam database"
      trend="+2 bulan ini"
      delay={100}
    />
    <PremiumStat
      label="Iuran Diterima"
      value={`Rp ${stats.iuranBulanIni.toLocaleString('id-ID')}`}
      icon={Banknote}
      loading={loading}
      helper="Update real-time"
      trend="92%"
      delay={200}
    />
    <PremiumStat
      label="Saldo Kas"
      value={`Rp ${stats.saldoKas.toLocaleString('id-ID')}`}
      icon={WalletCards}
      loading={loading}
      helper="Likuiditas saat ini"
      trend="Lancar"
      delay={300}
    />
    <PremiumStat
      label="Pengurus Aktif"
      value={stats.totalPengurus}
      icon={UserCog}
      loading={loading}
      helper="Petugas operasional"
      delay={400}
    />
  </SimpleGrid>
);

const TransactionsCard = ({ payments, loading }) => (
  <PremiumCard 
    title="Transaksi Terakhir" 
    description="Log Iuran Warga"
    icon={ReceiptText}
    gridColumn={{ lg: "span 2" }}
    delay={500}
    footer={
      <Button as={RouterLink} to="/iuran" variant="ghost" size="sm" color="blue.600" fontWeight="900" width="full" borderRadius="xl">
        Lihat Detail Riwayat Transaksi
      </Button>
    }
  >
    {loading ? (
      <Stack spacing={4}>
        {[1,2,3,4].map(i => (
          <HStack key={i} justify="space-between">
            <HStack spacing={3}>
              <SkeletonCircle size="10" />
              <Stack spacing={1}>
                <Skeleton height="14px" width="120px" />
                <Skeleton height="10px" width="80px" />
              </Stack>
            </HStack>
            <Skeleton height="14px" width="100px" />
          </HStack>
        ))}
      </Stack>
    ) : (
      <Table.Root variant="simple" size="sm">
        <Table.Header>
          <Table.Row borderColor="gray.50">
            <Table.ColumnHeader color="gray.400" fontWeight="800" textTransform="uppercase" fontSize="10px">Warga & Unit</Table.ColumnHeader>
            <Table.ColumnHeader color="gray.400" fontWeight="800" textTransform="uppercase" fontSize="10px" isNumeric>Nominal</Table.ColumnHeader>
            <Table.ColumnHeader color="gray.400" fontWeight="800" textTransform="uppercase" fontSize="10px" isNumeric>Verifikasi</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {payments.map((payment) => (
            <Table.Row key={payment.id} _hover={{ bg: "gray.50/50" }} transition="all 0.2s">
              <Table.Cell py={4}>
                <HStack spacing={3}>
                  <Avatar size="xs" name={payment.warga?.nama} bg="blue.50" color="blue.600" fontWeight="bold" fontSize="10px" />
                  <Box>
                    <Text fontWeight="800" fontSize="sm" color="gray.800">{payment.warga?.nama || "Warga"}</Text>
                    <Text fontSize="xs" color="gray.400" fontWeight="700">Blok {payment.warga?.blok || "-"}</Text>
                  </Box>
                </HStack>
              </Table.Cell>
              <Table.Cell isNumeric fontWeight="900" color="gray.700" fontSize="sm">
                Rp {payment.jumlah.toLocaleString('id-ID')}
              </Table.Cell>
              <Table.Cell isNumeric>
                <Badge variant="subtle" colorScheme={payment.status === "Lunas" ? "green" : "red"} borderRadius="full" px={3} fontWeight="900" fontSize="9px">
                  {payment.status}
                </Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    )}
  </PremiumCard>
);

const SidebarWidgets = ({ saldo, delay = 600 }) => (
  <Stack spacing={8} delay={delay} className={ANIMATION_CLASSES}>
    <PremiumCard title="Ringkasan Kas" description="Kondisi Finansial">
      <VStack align="stretch" spacing={6} pt={2}>
        <Box>
          <Text fontSize="xs" fontWeight="900" color="gray.400" textTransform="uppercase" mb={1}>Saldo Terkini</Text>
          <Heading size="xl" fontWeight="900" color="blue.600" letterSpacing="-0.03em">
            Rp {saldo.toLocaleString('id-ID')}
          </Heading>
        </Box>
        <Separator borderColor="gray.100" />
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="10px" fontWeight="800" color="gray.400" textTransform="uppercase">Masuk</Text>
            <Text fontSize="sm" fontWeight="900" color="green.500">+ Rp 1.2jt</Text>
          </VStack>
          <VStack align="end" spacing={0}>
            <Text fontSize="10px" fontWeight="800" color="gray.400" textTransform="uppercase">Keluar</Text>
            <Text fontSize="sm" fontWeight="900" color="red.500">- Rp 450rb</Text>
          </VStack>
        </HStack>
      </VStack>
    </PremiumCard>
    
    <PremiumCard title="Quick Action" description="Layanan Cepat">
      <VStack spacing={3} align="stretch" pt={1}>
        <Button 
          as={RouterLink} to="/forum" colorScheme="blue" borderRadius="16px" height="48px" fontWeight="800" 
          leftIcon={<Icon as={MessageSquarePlus} boxSize={4} />}
          boxShadow="0 4px 12px rgba(49, 130, 206, 0.2)"
        >
          Buat Pengumuman
        </Button>
        <Button 
          as={RouterLink} to="/kas" variant="outline" borderRadius="16px" height="48px" fontWeight="800" 
          leftIcon={<Icon as={WalletCards} boxSize={4} />}
          borderColor="gray.200"
          _hover={{ bg: "gray.50", transform: "translateY(-1px)" }}
        >
          Input Arus Kas
        </Button>
      </VStack>
    </PremiumCard>
  </Stack>
);

export default function Dashboard() {
  const { user, profile, selectedPerumahanId } = useAuth();
  const [stats, setStats] = useState({ totalWarga: 0, iuranBulanIni: 0, saldoKas: 0, totalPengurus: 0 });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!selectedPerumahanId) return;
    
    try {
      setLoading(true);
      const isResident = profile?.role === 'resident';
      
      const [warga, pengurus, cmonth_iuran, last_kas, rpayments] = await Promise.all([
        supabase.from('warga').select('*', { count: 'exact', head: true }).eq('perumahan_id', selectedPerumahanId),
        supabase.from('pengurus').select('*', { count: 'exact', head: true }).eq('perumahan_id', selectedPerumahanId),
        supabase.from('pembayaran_iuran').select('jumlah, warga!inner(perumahan_id)').eq('warga.perumahan_id', selectedPerumahanId).eq('status', 'Lunas'),
        supabase.from('arus_kas').select('saldo_after').eq('perumahan_id', selectedPerumahanId).order('created_at', { ascending: false }).limit(1),
        supabase.from('pembayaran_iuran').select('id, jumlah, tanggal_bayar, status, warga!inner(nama, blok, perumahan_id)').eq('warga.perumahan_id', selectedPerumahanId).order('created_at', { ascending: false }).limit(5)
      ]);

      setStats({
        totalWarga: warga.count || 0,
        iuranBulanIni: cmonth_iuran.data?.reduce((acc, curr) => acc + Number(curr.jumlah), 0) || 0,
        saldoKas: last_kas.data?.[0]?.saldo_after || 0,
        totalPengurus: pengurus.count || 0,
      });
      setRecentPayments(rpayments.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [profile, selectedPerumahanId]);

  useEffect(() => {
    if (user && selectedPerumahanId) fetchDashboardData();
  }, [user, profile, selectedPerumahanId, fetchDashboardData]);

  return (
    <VStack spacing={8} align="stretch" width="full" py={6}>
      <DashboardHeader name={profile?.nama?.split(' ')[0] || "Admin"} />
      <StatsGrid stats={stats} loading={loading} />
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
        <TransactionsCard payments={recentPayments} loading={loading} />
        <SidebarWidgets saldo={stats.saldoKas} />
      </SimpleGrid>
    </VStack>
  );
}
