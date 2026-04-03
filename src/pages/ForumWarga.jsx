import { useState, useEffect } from "react";
import { Send, MessageSquarePlus, MessageSquare, ThumbsUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ForumWarga() {
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
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch {
      toast.error("Gagal mengambil postingan forum");
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      toast.error("Isi postingan tidak boleh kosong");
      return;
    }

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert([{
          author: "Admin Paguyuban",
          avatar: "A",
          content: newPostContent,
          category: newPostCategory,
        }]);

      if (error) throw error;
      
      setNewPostContent("");
      toast.success("Postingan berhasil diterbitkan");
      fetchPosts();
    } catch {
      toast.error("Gagal mengirim postingan");
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === "Semua") return true;
    return post.category === activeTab;
  });

  const getCategoryBadge = (category) => {
    switch (category) {
      case "Pengumuman": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Laporan": return "bg-red-50 text-red-700 border-red-200";
      case "Diskusi": return "bg-green-50 text-green-700 border-green-200";
      default: return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Forum Warga</h1>
        <p className="text-neutral-500">Ruang diskusi, pengumuman, dan pelaporan antar warga perumahan.</p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handlePostSubmit}>
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">A</AvatarFallback>
              </Avatar>
              <div className="w-full space-y-3">
                <Textarea 
                  placeholder="Ada informasi apa yang ingin dibagikan ke warga?"
                  className="min-h-[100px] resize-none"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-neutral-500">Kategori:</span>
                    <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pengumuman">Pengumuman</SelectItem>
                        <SelectItem value="Diskusi">Diskusi</SelectItem>
                        <SelectItem value="Laporan">Laporan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full sm:w-auto gap-2">
                    <Send className="h-4 w-4" />
                    Kirim Postingan
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="Semua">Semua</TabsTrigger>
          <TabsTrigger value="Pengumuman">Pengumuman</TabsTrigger>
          <TabsTrigger value="Diskusi">Diskusi</TabsTrigger>
          <TabsTrigger value="Laporan">Laporan</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-neutral-500 border rounded-lg bg-white">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-neutral-300 mb-3" />
              <p>Memuat postingan...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 border rounded-lg bg-white">
              <MessageSquarePlus className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
              <p>Belum ada postingan di kategori ini.</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-neutral-100 text-neutral-700 font-semibold">
                      {post.avatar || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-neutral-900">{post.author}</p>
                      <Badge variant="outline" className={getCategoryBadge(post.category)}>
                        {post.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {new Date(post.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 flex border-t bg-neutral-50 rounded-b-lg px-6 py-3">
                  <div className="flex gap-6 w-full text-neutral-500">
                    <button className="flex items-center text-sm font-medium hover:text-blue-600 transition-colors">
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Suka
                    </button>
                    <button className="flex items-center text-sm font-medium hover:text-blue-600 transition-colors">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {post.replies_count > 0 ? `${post.replies_count} Balasan` : "Balas"}
                    </button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}
