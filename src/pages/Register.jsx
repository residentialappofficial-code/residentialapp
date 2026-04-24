import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Box,
  Button,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  Center,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/chakra/field";
import { toaster } from "@/components/ui/chakra/toaster";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            nama: nama,
            role: 'admin', // Default to admin for the person who registers the complex
          }
        }
      });
      if (authError) throw authError;

      toaster.create({
        title: "Registrasi berhasil!",
        description: "Profil Anda sedang disiapkan secara otomatis. Silakan cek email konfirmasi lalu login.",
        type: "success",
      });
      navigate("/login");
    } catch (error) {
      toaster.create({
        title: "Gagal Registrasi",
        description: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center minHeight="100vh" width="100vw" bg="gray.50" p={6}>
      <Box
        width="full"
        maxWidth="md"
        bg="white"
        boxShadow="0 10px 30px rgba(0, 0, 0, 0.04)"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="24px"
        overflow="hidden"
      >
        <VStack spacing={2} p={10} pb={4} textAlign="center">
          <Center mb={4}>
            <Flex p={4} borderRadius="20px" bg="emerald.50" color="emerald.600">
              <Icon as={UserPlus} boxSize={8} />
            </Flex>
          </Center>
          <Heading size="xl" fontWeight="900" color="gray.900" letterSpacing="-0.03em">
            Register your complex
          </Heading>
          <Text color="gray.500" fontWeight="600" fontSize="sm">
            Sign up as an administrator to start managing.
          </Text>
        </VStack>

        <form onSubmit={handleRegister}>
          <VStack spacing={5} p={10} pt={4}>
            <Field label="Full Name" required>
              <Input
                placeholder="e.g. John Doe"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                height="12"
                bg="white"
                border="1px solid"
                borderColor="gray.100"
                borderRadius="12px"
                _focus={{ borderColor: "emerald.400", boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.1)" }}
                fontWeight="600"
              />
            </Field>
            
            <Field label="Work Email" required>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                height="12"
                bg="white"
                border="1px solid"
                borderColor="gray.100"
                borderRadius="12px"
                _focus={{ borderColor: "emerald.400", boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.1)" }}
                fontWeight="600"
              />
            </Field>
            
            <Field label="Create Password" required>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                height="12"
                bg="white"
                border="1px solid"
                borderColor="gray.100"
                borderRadius="12px"
                _focus={{ borderColor: "emerald.400", boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.1)" }}
                fontWeight="600"
              />
            </Field>
            
            <VStack width="full" spacing={3} pt={4}>
              <Button
                type="submit"
                width="full"
                height="14"
                bg="emerald.500"
                color="white"
                borderRadius="14px"
                _hover={{ bg: "emerald.600", transform: "translateY(-1px)" }}
                _active={{ transform: "translateY(0)" }}
                fontWeight="900"
                isLoading={loading}
                boxShadow="0 10px 15px -3px rgba(16, 185, 129, 0.2)"
              >
                Create Account
              </Button>
              
              <Button
                as={RouterLink}
                to="/login"
                variant="ghost"
                width="full"
                height="12"
                color="gray.400"
                fontWeight="800"
                borderRadius="12px"
                _hover={{ bg: "gray.50", color: "emerald.600" }}
              >
                Back to Login
              </Button>
            </VStack>
          </VStack>
        </form>
      </Box>
    </Center>
  );
}
