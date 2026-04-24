import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Icon,
  HStack,
  Center,
} from "@chakra-ui/react";
import { InputGroup } from "@/components/ui/chakra/input-group";
import { Field } from "@/components/ui/chakra/field";
import { PasswordInput } from "@/components/ui/chakra/password-input";
import { useAuth } from "@/contexts/AuthContext";
import { toaster } from "@/components/ui/chakra/toaster";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await signIn(email, password);
      if (error) throw error;
      
      toaster.create({
        title: "Berhasil masuk",
        description: "Selamat datang kembali!",
        type: "success",
      });
      navigate("/dashboard");
    } catch (error) {
      toaster.create({
        title: "Gagal masuk",
        description: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minHeight="100vh" width="100vw" overflow="hidden">
      {/* Left Side: Illustration & Branding */}
      <Box
        display={{ base: "none", lg: "flex" }}
        flex="1.2"
        bg="gray.900"
        color="white"
        p={12}
        flexDirection="column"
        justifyContent="space-between"
        position="relative"
        overflow="hidden"
      >
        {/* Subtle Decorative Accents (Emerald) */}
        <Box
          position="absolute"
          top="-10%"
          right="-10%"
          width="60%"
          height="60%"
          bg="emerald.600"
          borderRadius="full"
          opacity="0.08"
          filter="blur(80px)"
        />
        <Box
          position="absolute"
          bottom="-10%"
          left="-10%"
          width="40%"
          height="40%"
          bg="emerald.500"
          borderRadius="full"
          opacity="0.05"
          filter="blur(60px)"
        />

        <Box position="relative">
          <HStack spacing={4} mb={12}>
            <Center h={12} w={12} bg="#10b981" color="white" borderRadius="14px" fontWeight="900" fontSize="2xl" boxShadow="0 0 20px rgba(16, 185, 129, 0.4)">F</Center>
            <Text fontSize="2xl" fontWeight="900" color="white" letterSpacing="-0.03em">Flup</Text>
          </HStack>
          
          <Stack spacing={6} maxWidth="xl" className="slide-up-fade-in">
            <Heading size="4xl" lineHeight="1.1" fontWeight="900" letterSpacing="-0.05em">
              Residential management <br />
              <Text as="span" color="#10b981">made effortless.</Text>
            </Heading>
            <Text fontSize="lg" color="gray.400" fontWeight="500" lineHeight="tall">
              A transparent, secure, and modern platform designed to simplify the complexities of residential living.
            </Text>
          </Stack>
        </Box>

        <HStack justify="space-between" color="gray.500" fontWeight="700" fontSize="xs">
          <Text>© 2025 Flup Technologies.</Text>
          <HStack spacing={4}>
            <Link to="#">Terms</Link>
            <Link to="#">Privacy</Link>
          </HStack>
        </HStack>
      </Box>

      {/* Right Side: Login Form */}
      <Flex flex="2" bg="gray.50" align="center" justify="center" p={8} position="relative">
        <Stack spacing={6} width="full" maxWidth="md" className="slide-up-fade-in" style={{ animationDelay: '100ms' }}>
          <Stack spacing={2}>
            <Heading size="2xl" color="gray.900" fontWeight="900" letterSpacing="-0.03em">Login to your account</Heading>
            <Text color="gray.500" fontWeight="600" fontSize="md">Enter your credentials to manage your complex</Text>
          </Stack>

          <Box 
            bg="white" 
            p={8} 
            borderRadius="16px" 
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.03)" 
            border="1px solid" 
            borderColor="gray.100"
          >
            <form onSubmit={handleSubmit}>
              <Stack spacing={6}>
                <Field label="Email Address">
                  <InputGroup width="full" startElement={<Icon as={Mail} color="gray.400" />}>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      height="12"
                      bg="white"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="10px"
                      ps="12"
                      _focus={{ 
                        borderColor: "#10b981", 
                        borderWidth: "2px",
                        boxShadow: "none",
                        outline: "none"
                      }}
                      _autofill={{
                        boxShadow: "0 0 0 1000px white inset",
                        WebkitTextFillColor: "#1f2937",
                        transition: "background-color 5000s ease-in-out 0s"
                      }}
                      fontWeight="600"
                    />
                  </InputGroup>
                </Field>

                <Stack spacing={1}>
                  <Flex justify="space-between" align="center" px={1}>
                    <Text fontSize="sm" fontWeight="800" color="gray.800">Password</Text>
                    <Link to="/forgot-password" style={{ fontSize: "14px", color: "#10b981", fontWeight: "800" }}>
                      Forgot?
                    </Link>
                  </Flex>
                  <PasswordInput
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    height="12"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="10px"
                    ps="12"
                    _focus={{ 
                      borderColor: "#10b981", 
                      borderWidth: "2px",
                      boxShadow: "none",
                      outline: "none"
                    }}
                    _autofill={{
                      boxShadow: "0 0 0 1000px white inset",
                      WebkitTextFillColor: "#1f2937",
                      transition: "background-color 5000s ease-in-out 0s"
                    }}
                    fontWeight="600"
                    rootProps={{ 
                      width: "full",
                      startElement: <Icon as={Lock} color="gray.400" />
                    }}
                  />
                </Stack>

                <Button
                  type="submit"
                  size="xl"
                  height="14"
                  fontSize="md"
                  isLoading={loading}
                  bg="#10b981"
                  color="white"
                  borderRadius="12px"
                  _hover={{ bg: "#059669", transform: "translateY(-1px)" }}
                  _active={{ transform: "translateY(0)" }}
                  fontWeight="900"
                  boxShadow="0 10px 15px -3px rgba(16, 185, 129, 0.2)"
                  width="full"
                >
                  Login to Flup
                </Button>
              </Stack>
            </form>
          </Box>

          <Text textAlign="center" color="gray.600" fontWeight="600" fontSize="sm">
            Need an account?{" "}
            <Link to="/register" style={{ fontWeight: "800", color: "#10b981" }}>
              Register your complex
            </Link>
          </Text>
        </Stack>
      </Flex>
    </Flex>
  );
}
