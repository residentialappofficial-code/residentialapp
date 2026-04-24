import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Box, 
  VStack, 
  HStack, 
  Heading, 
  Text, 
  Input, 
  Button, 
  Icon, 
  Flex,
  Stack,
  Badge,
  Separator
} from "@chakra-ui/react";
import { Avatar } from "@/components/ui/chakra/avatar";
import { Field } from "@/components/ui/chakra/field";
import { toaster } from "@/components/ui/chakra/toaster";
import { Camera, User, Mail, Phone, ShieldCheck, MapPin } from "lucide-react";

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nama: profile?.nama || "",
    email: profile?.email || "",
    no_hp: profile?.no_hp || "",
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await updateProfile(formData);
      if (error) throw error;
      toaster.create({
        title: "Profil Diperbarui",
        description: "Data Anda berhasil disimpan.",
        type: "success",
      });
    } catch (error) {
      toaster.create({
        title: "Gagal memperbarui profil",
        description: error.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Validasi file
      if (file.size > 2 * 1024 * 1024) {
        toaster.create({ title: "File terlalu besar", description: "Maksimal 2MB", type: "warning" });
        return;
      }

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Dapatkan Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update Database
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      toaster.create({
        title: "Foto Berhasil Diubah",
        type: "success",
      });
    } catch (error) {
      toaster.create({
        title: "Gagal mengunggah foto",
        description: error.message,
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box maxW="800px" mx="auto" py={6}>
      <VStack spacing={8} align="stretch">
        {/* Header Profil */}
        <Box 
          bg="white" 
          borderRadius="3xl" 
          p={8} 
          shadow="sm" 
          border="1px solid" 
          borderColor="gray.100"
          position="relative"
          overflow="hidden"
        >
          {/* Accent Background */}
          <Box 
            position="absolute" 
            top="0" 
            left="0" 
            right="0" 
            h="120px" 
            bgGradient="to-br" 
            gradientFrom="emerald.400" 
            gradientTo="emerald.600" 
            opacity="0.1" 
          />

          <Flex direction={{ base: "column", md: "row" }} align={{ base: "center", md: "end" }} gap={6} position="relative" pt={4}>
            <Box position="relative" cursor="pointer" onClick={handleAvatarClick} _hover={{ opacity: 0.9 }}>
              <Avatar 
                size="2xl" 
                name={profile?.nama} 
                src={profile?.avatar_url}
                border="4px solid white"
                boxShadow="xl"
                bg="emerald.50"
              />
              <Box 
                position="absolute" 
                bottom="2" 
                right="2" 
                bg="white" 
                p={2} 
                borderRadius="full" 
                shadow="md"
                color="emerald.600"
              >
                <Icon as={Camera} boxSize={4} />
              </Box>
              {uploading && (
                <Flex 
                  position="absolute" inset="0" borderRadius="full" 
                  bg="blackAlpha.400" align="center" justify="center"
                >
                  <Text color="white" fontSize="xs" fontWeight="bold">UPLOADING...</Text>
                </Flex>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                accept="image/*"
              />
            </Box>

            <VStack align={{ base: "center", md: "start" }} spacing={1} flex="1">
              <HStack>
                <Heading size="xl" fontWeight="900" color="gray.900">{profile?.nama}</Heading>
                <Badge colorScheme="emerald" variant="subtle" borderRadius="full" px={3} py={1}>
                  {profile?.role?.replace('_', ' ').toUpperCase()}
                </Badge>
              </HStack>
              <HStack spacing={4} color="gray.500" fontSize="sm">
                <HStack><Icon as={MapPin} boxSize={3} /> <Text>{profile?.perumahan?.nama || "Perumahan"}</Text></HStack>
                <HStack><Icon as={ShieldCheck} boxSize={3} /> <Text>Blok {profile?.blok} - No. {profile?.nomor_rumah}</Text></HStack>
              </HStack>
            </VStack>
          </Flex>
        </Box>

        {/* Form Data Diri */}
        <Box bg="white" borderRadius="3xl" p={8} shadow="sm" border="1px solid" borderColor="gray.100">
          <form onSubmit={handleSave}>
            <VStack spacing={6} align="stretch">
              <Heading size="md" fontWeight="800" mb={2}>Informasi Pribadi</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Field label="Nama Lengkap" required helperText="Gunakan nama asli Anda.">
                  <HStack width="full">
                    <Icon as={User} color="gray.400" />
                    <Input 
                      placeholder="Masukkan nama"
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      bg="gray.50" border="none" _focus={{ bg: "white", boxShadow: "0 0 0 2px var(--chakra-colors-emerald-500)" }}
                    />
                  </HStack>
                </Field>

                <Field label="Alamat Email" required>
                  <HStack width="full">
                    <Icon as={Mail} color="gray.400" />
                    <Input 
                      type="email"
                      placeholder="email@contoh.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      bg="gray.50" border="none" _focus={{ bg: "white", boxShadow: "0 0 0 2px var(--chakra-colors-emerald-500)" }}
                    />
                  </HStack>
                </Field>

                <Field label="Nomor WhatsApp" required>
                  <HStack width="full">
                    <Icon as={Phone} color="gray.400" />
                    <Input 
                      placeholder="0812xxxx"
                      value={formData.no_hp}
                      onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                      bg="gray.50" border="none" _focus={{ bg: "white", boxShadow: "0 0 0 2px var(--chakra-colors-emerald-500)" }}
                    />
                  </HStack>
                </Field>

                <Field label="Role & Lokasi" readOnly helperText="Hanya bisa diubah oleh pengurus.">
                  <Input 
                    value={`${profile?.role?.replace('_', ' ')} | Blok ${profile?.blok}`}
                    readOnly
                    bg="gray.100" border="none" color="gray.500" cursor="not-allowed"
                  />
                </Field>
              </SimpleGrid>

              <Separator my={4} />

              <Flex justify="end">
                <Button 
                  type="submit" 
                  colorScheme="emerald" 
                  size="lg" 
                  px={10}
                  loading={loading}
                  borderRadius="xl"
                  boxShadow="0 4px 12px rgba(16, 185, 129, 0.2)"
                >
                  Simpan Perubahan
                </Button>
              </Flex>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Box>
  );
}

// Helper untuk SimpleGrid jika belum diimport
function SimpleGrid({ columns, spacing, children }) {
  return (
    <Box 
      display="grid" 
      gridTemplateColumns={{ 
        base: `repeat(${columns.base || 1}, 1fr)`, 
        md: `repeat(${columns.md || columns}, 1fr)` 
      }} 
      gap={spacing}
    >
      {children}
    </Box>
  );
}
