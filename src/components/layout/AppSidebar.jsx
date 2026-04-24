import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Flex,
  VStack,
  Text,
  Icon,
  Button,
  HStack,
  Spacer,
  IconButton,
} from "@chakra-ui/react";
import { Avatar } from "@/components/ui/chakra/avatar";
import { Tooltip } from "@/components/ui/chakra/tooltip";
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Receipt, 
  WalletCards, 
  Banknote, 
  MessageSquare,
  ChevronRight,
  Building2,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const allItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "resident"],
  },
  {
    title: "Data Warga",
    url: "/warga",
    icon: Users,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Data Pengurus",
    url: "/pengurus",
    icon: UserCog,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Pembayaran Iuran",
    url: "/iuran",
    icon: Receipt,
    roles: ["super_admin", "admin", "resident"],
  },
  {
    title: "Arus Kas",
    url: "/kas",
    icon: WalletCards,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Penggajian",
    url: "/penggajian",
    icon: Banknote,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Forum Warga",
    url: "/forum",
    icon: MessageSquare,
    roles: ["super_admin", "admin", "resident"],
  },
  {
    title: "Profil Saya",
    url: "/profile",
    icon: User,
    roles: ["super_admin", "admin", "resident"],
  },
];

const NAV_WIDTHS = {
  icon: "80px",
  label: "240px",
};

const NavItem = ({ item, isActive, variant = "label" }) => {
  if (variant === "icon") {
    return (
      <IconButton
        as={RouterLink}
        to={item.url}
        variant="ghost"
        aria-label={item.title}
        color={isActive ? "emerald.600" : "gray.400"}
        bg={isActive ? "emerald.50" : "transparent"}
        _hover={{ bg: "gray.50", color: "emerald.500" }}
        borderRadius="14px"
        size="lg"
        icon={<Icon as={item.icon} boxSize={5} />}
      />
    );
  }

  return (
    <Button
      as={RouterLink}
      to={item.url}
      variant="ghost"
      justifyContent="start"
      height="44px"
      bg={isActive ? "emerald.50" : "transparent"}
      color={isActive ? "emerald.700" : "gray.500"}
      _hover={{ bg: isActive ? "emerald.50" : "gray.100", color: isActive ? "emerald.700" : "gray.700" }}
      px={3}
      borderRadius="10px"
      fontWeight={isActive ? "700" : "500"}
      fontSize="sm"
    >
      <HStack spacing={3} width="full">
        <Icon as={item.icon} boxSize={4} />
        <Text>{item.title}</Text>
        {isActive && <Box ml="auto" h={1.5} w={1.5} borderRadius="full" bg="emerald.500" />}
      </HStack>
    </Button>
  );
};

export function AppSidebar({ role = "resident" }) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  
  const getIsActive = (url) => location.pathname === url || location.pathname.startsWith(`${url}/`);

  const handleLogout = async () => {
    try {
      await signOut();
      toaster.create({
        title: "Berhasil Keluar",
        description: "Sampai jumpa kembali!",
        type: "success",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Flex 
      height="100vh" 
      width="260px" 
      bg="white" 
      borderRight="1px solid" 
      borderColor="gray.100"
      direction="column"
      py={8}
      px={4}
      position="sticky"
      top="0"
      zIndex="20"
    >
      {/* Branding */}
      <Box px={2} mb={10}>
        <HStack spacing={3}>
          <Flex 
            h={10} w={10} borderRadius="12px" bg="emerald.500" color="white" align="center" justify="center"
            boxShadow="0 4px 12px rgba(16, 185, 129, 0.2)"
          >
            <Icon as={Building2} boxSize={5} />
          </Flex>
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="900" color="gray.900" letterSpacing="-0.02em" lineHeight="1.1">Flup</Text>
            <Text fontSize="9px" fontWeight="800" color="gray.400" textTransform="uppercase" letterSpacing="0.05em">
              Residential Management
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Menu Items */}
      <VStack align="stretch" spacing={1} flex="1">
        <Text fontSize="10px" fontWeight="800" color="gray.400" textTransform="uppercase" letterSpacing="0.1em" px={2} mb={2}>
          Main Menu
        </Text>
        {allItems.map((item) => (
          <NavItem key={item.title} item={item} isActive={getIsActive(item.url)} />
        ))}
      </VStack>

      {/* Profile & Logout */}
      <Box mt="auto" pt={4} borderTop="1px solid" borderColor="gray.100">
        <HStack p={2} spacing={3} mb={2}>
          <Avatar 
            size="sm" 
            name={profile?.nama || "User"} 
            src={profile?.avatar_url}
            border="2px solid" 
            borderColor="emerald.50"
          />
          <VStack align="start" spacing={0} flex="1" minW="0">
            <Text fontSize="xs" fontWeight="800" color="gray.900" noOfLines={1}>
              {profile?.nama || "User"}
            </Text>
            <Text fontSize="10px" color="gray.500" textTransform="capitalize">
              {profile?.role?.replace('_', ' ') || "Resident"}
            </Text>
          </VStack>
        </HStack>
        
        <Button
          variant="ghost" 
          width="full"
          justifyContent="start"
          height="40px"
          color="gray.500"
          _hover={{ color: "red.600", bg: "red.50" }}
          onClick={handleLogout}
          borderRadius="10px"
          fontSize="sm"
          fontWeight="700"
        >
          <HStack spacing={3}>
            <Icon as={LogOut} boxSize={4} />
            <Text>Keluar</Text>
          </HStack>
        </Button>
      </Box>
    </Flex>
  );
}
