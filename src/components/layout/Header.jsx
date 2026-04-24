import { Bell, Search, Building2, User as UserIcon, Keyboard, Activity } from "lucide-react";
import {
  Flex,
  Box,
  HStack,
  Text,
  Badge,
  Icon,
  Input,
  IconButton,
  VStack,
  Circle,
  Kbd,
  Spacer,
  Heading,
  Button,
} from "@chakra-ui/react";
import { InputGroup } from "@/components/ui/chakra/input-group";
import { Avatar } from "@/components/ui/chakra/avatar";
import { useAuth } from "@/contexts/AuthContext";

export function Header({ title = "Dashboard" }) {
  const { profile } = useAuth();

  return (
    <Flex
      as="header" position="sticky" top="0" zIndex="10" height="80px"
      alignItems="center" bg="transparent" px={{ base: 4, md: 8 }} gap={4}
    >
      <Flex flex="1" align="center" gap={6}>
        <Heading size="xl" fontWeight="800" color="gray.900" letterSpacing="-0.03em">
          {title}
        </Heading>

        <Spacer />

        {/* Minimalist Search Bar */}
        <Box display={{ base: "none", lg: "block" }} width="sm">
          <InputGroup 
            flex="1" 
            startElement={<Icon as={Search} color="gray.400" boxSize={4} />}
            endElement={(
              <HStack spacing={1} mr={2}>
                <Kbd bg="white" color="gray.300" fontSize="10px" border="1px solid" borderColor="gray.100" boxShadow="none">⌘ K</Kbd>
              </HStack>
            )}
          >
            <Input
              placeholder="Search anything..."
              bg="white" border="1px solid" borderColor="gray.100"
              _focus={{ borderColor: "emerald.400", boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.1)" }}
              height="44px" fontSize="sm" fontWeight="500" borderRadius="12px"
            />
          </InputGroup>
        </Box>
      </Flex>

      <HStack spacing={4}>
        {/* Date / Time Period */}
        <Button 
          variant="ghost" size="sm" fontWeight="700" color="gray.400" fontSize="xs" borderRadius="10px"
        >
          <HStack spacing={1}>
            <Icon as={Activity} boxSize={3} />
            <Text>Time period: Last 30 days</Text>
          </HStack>
        </Button>

        {/* Notifications */}
        <IconButton
          variant="ghost" aria-label="Notifications" borderRadius="12px" color="gray.400"
          _hover={{ color: "emerald.500", bg: "emerald.50" }}
        >
          <Bell size={20} />
        </IconButton>

        {/* Minimal User Profile */}
        <HStack spacing={3} pl={2} textAlign="right" display={{ base: "none", sm: "block" }}>
          <Box>
            <Text fontSize="xs" fontWeight="800" color="gray.900" lineHeight="1">{profile?.nama || "User"}</Text>
            <Text fontSize="9px" fontWeight="700" color="gray.400" textTransform="uppercase" mt={0.5}>
              {profile?.role === 'super_admin' ? "Admin Manager" : "Resident"}
            </Text>
          </Box>
        </HStack>
      </HStack>
    </Flex>
  );
}
