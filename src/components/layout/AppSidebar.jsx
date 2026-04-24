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
  Building2
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

  return (
    <Flex height="100vh" position="sticky" top="0" zIndex="20">
      {/* Tier 1: Narrow Icon Bar */}
      <VStack
        width={NAV_WIDTHS.icon}
        height="100%"
        bg="white"
        borderRight="1px solid"
        borderColor="gray.100"
        py={8}
        spacing={10}
        align="center"
      >
        <Flex
          h={12} w={12} borderRadius="16px" bg="emerald.500" color="white" align="center" justify="center"
          boxShadow="0 4px 12px rgba(16, 185, 129, 0.3)"
        >
          <Icon as={Building2} boxSize={6} />
        </Flex>

        <VStack spacing={6} width="full">
          {allItems.slice(0, 3).map((item) => (
            <NavItem key={item.title} item={item} isActive={getIsActive(item.url)} variant="icon" />
          ))}
        </VStack>

        <Spacer />

        <Avatar
          size="sm" name={profile?.nama || "User"} src={profile?.avatar_url}
          border="2px solid" borderColor="emerald.100"
        />

        <IconButton
          variant="ghost" aria-label="Logout" color="gray.400"
          _hover={{ color: "red.500", bg: "red.50" }}
          onClick={signOut}
          icon={<Icon as={LogOut} boxSize={5} />}
        />
      </VStack>

      {/* Tier 2: Wide Menu Label Bar */}
      <VStack
        width={NAV_WIDTHS.label}
        height="100%"
        bg="gray.50"
        borderRight="1px solid"
        borderColor="gray.100"
        align="stretch"
        py={8}
        px={4}
        spacing={8}
      >
        <Box px={2}>
          <HStack spacing={2}>
            <Text fontSize="xl" fontWeight="900" color="gray.900" letterSpacing="-0.02em">Flup</Text>
            <Box h={1.5} w={1.5} borderRadius="full" bg="emerald.500" mt={1} />
          </HStack>
          <Text fontSize="10px" fontWeight="800" color="gray.400" textTransform="uppercase" letterSpacing="0.1em" mt={1}>
            Residential Management
          </Text>
        </Box>

        <VStack align="stretch" spacing={1}>
          <Text fontSize="10px" fontWeight="800" color="gray.400" textTransform="uppercase" letterSpacing="0.1em" px={2} mb={2}>
            Main Menu
          </Text>
          {allItems.map((item) => (
            <NavItem key={item.title} item={item} isActive={getIsActive(item.url)} />
          ))}
        </VStack>
      </VStack>
    </Flex>
  );
}
