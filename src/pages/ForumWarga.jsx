import { useState, useEffect } from "react";
import { Send, MessageSquarePlus, MessageSquare, ThumbsUp, Loader2 } from "lucide-react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Textarea,
  Badge,
  Icon,
  Spinner,
  Center,
  Stack,
  Tabs,
} from "@chakra-ui/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/chakra/select";
import { Avatar } from "@/components/ui/chakra/avatar";
import { toaster } from "@/components/ui/chakra/toaster";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function ForumWarga() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Diskusi");
  const [activeTab, setActiveTab] = useState("Semua");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('forum_posts').select('*');
      
      if (profile?.role !== 'super_admin') {
        query = query.eq('perumahan_id', profile?.perumahan_id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch {
      toaster.create({
        title: "Gagal mengambil postingan forum",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      toaster.create({
        title: "Peringatan",
        description: "Isi postingan tidak boleh kosong",
        type: "warning",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert([{
          author: profile?.nama || "Warga",
          avatar: profile?.nama?.[0] || "U",
          content: newPostContent,
          category: newPostCategory,
          perumahan_id: profile?.perumahan_id
        }]);

      if (error) throw error;
      
      setNewPostContent("");
      toaster.create({
        title: "Berhasil",
        description: "Postingan berhasil diterbitkan",
        type: "success",
      });
      fetchPosts();
    } catch {
      toaster.create({
        title: "Gagal mengirim postingan",
        type: "error",
      });
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === "Semua") return true;
    return post.category === activeTab;
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case "Pengumuman": return "blue";
      case "Laporan": return "red";
      case "Diskusi": return "green";
      default: return "gray";
    }
  };

  return (
    <VStack spacing={6} align="stretch" maxWidth="4xl" mx="auto" width="full">
      <Box>
        <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="gray.900">Forum Warga</Heading>
        <Text color="gray.500">Ruang diskusi, pengumuman, dan pelaporan antar warga perumahan.</Text>
      </Box>

      <Box bg="white" p={6} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
        <form onSubmit={handlePostSubmit}>
          <Flex gap={4}>
            <Avatar 
              size="md" 
              name={profile?.nama || "A"}
              bg="blue.100" 
              color="blue.700"
            />
            <VStack align="stretch" flex="1" spacing={3}>
              <Textarea 
                placeholder="Ada informasi apa yang ingin dibagikan ke warga?"
                minHeight="100px"
                resize="none"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "stretch", sm: "center" }} gap={3}>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">Kategori:</Text>
                  <SelectRoot 
                    value={[newPostCategory]} 
                    onValueChange={(e) => setNewPostCategory(e.value[0])}
                    width="140px"
                  >
                    <SelectTrigger height="9">
                      <SelectValueText placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem item="Pengumuman" key="Pengumuman">Pengumuman</SelectItem>
                      <SelectItem item="Diskusi" key="Diskusi">Diskusi</SelectItem>
                      <SelectItem item="Laporan" key="Laporan">Laporan</SelectItem>
                    </SelectContent>
                  </SelectRoot>
                </HStack>
                <Button type="submit" colorScheme="blue" leftIcon={<Icon as={Send} boxSize={4} />}>
                  Kirim Postingan
                </Button>
              </Flex>
            </VStack>
          </Flex>
        </form>
      </Box>

      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)} variant="enclosed" width="full">
        <Tabs.List bg="gray.50" p={1} borderRadius="md" border="none">
          <Tabs.Trigger value="Semua" flex="1">Semua</Tabs.Trigger>
          <Tabs.Trigger value="Pengumuman" flex="1">Pengumuman</Tabs.Trigger>
          <Tabs.Trigger value="Diskusi" flex="1">Diskusi</Tabs.Trigger>
          <Tabs.Trigger value="Laporan" flex="1">Laporan</Tabs.Trigger>
        </Tabs.List>
        
        <Box mt={6}>
          {loading ? (
            <Center py={12} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.100">
              <VStack spacing={3}>
                <Spinner size="xl" color="gray.300" />
                <Text color="gray.500">Memuat postingan...</Text>
              </VStack>
            </Center>
          ) : filteredPosts.length === 0 ? (
            <Center py={12} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.100">
              <VStack spacing={3}>
                <Icon as={MessageSquarePlus} boxSize={12} color="gray.300" />
                <Text color="gray.500">Belum ada postingan di kategori ini.</Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={4} align="stretch">
              {filteredPosts.map((post) => (
                <Box key={post.id} bg="white" borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.100">
                  <Box p={6}>
                    <Flex justify="space-between" align="start" mb={4}>
                      <HStack spacing={4}>
                        <Avatar 
                          size="md" 
                          name={post.author}
                          bg="gray.100" 
                          color="gray.700"
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold" color="gray.900">{post.author}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(post.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge 
                        variant="outline" 
                        colorScheme={getCategoryColor(post.category)}
                        bg={`${getCategoryColor(post.category)}.50`}
                      >
                        {post.category}
                      </Badge>
                    </Flex>
                    <Text color="gray.700" whiteSpace="pre-wrap" lineHeight="relaxed">
                      {post.content}
                    </Text>
                  </Box>
                  <Box py={3} px={6} bg="gray.50" borderTop="1px solid" borderColor="gray.100" borderBottomRadius="xl">
                    <HStack spacing={6}>
                      <Button variant="ghost" size="sm" color="gray.500" leftIcon={<Icon as={ThumbsUp} boxSize={4} />} _hover={{ color: "blue.600" }}>
                        Suka
                      </Button>
                      <Button variant="ghost" size="sm" color="gray.500" leftIcon={<Icon as={MessageSquare} boxSize={4} />} _hover={{ color: "blue.600" }}>
                        {post.replies_count > 0 ? `${post.replies_count} Balasan` : "Balas"}
                      </Button>
                    </HStack>
                  </Box>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Tabs.Root>
    </VStack>
  );
}
