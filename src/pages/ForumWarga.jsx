import { useState, useEffect, useCallback } from "react";
import { 
  Send, 
  MessageSquare, 
  Search, 
  MoreVertical, 
  Filter, 
  Heart, 
  Share2, 
  MessageCircle, 
  Bookmark, 
  ChevronDown, 
  Edit, 
  Trash2,
  BookmarkCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Card, Badge, Modal, Input, Select, Textarea } from "@/components/ui";
import { SelectionRequired } from "@/components/ui/SelectionRequired";

export default function ForumWarga() {
  const { profile, selectedPerumahanId } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Umum");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  
  // Post Interaction States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  const categories = ["Umum", "Kegiatan", "Keluhan", "Jual Beli", "Kehilangan"];

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;
      
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles!author_id(id, nama, role),
          likes:forum_likes(user_id),
          bookmarks:forum_bookmarks(user_id),
          comment_count:forum_comments(count)
        `)
        .eq('perumahan_id', selectedPerumahanId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      const mappedData = data?.map(post => ({
        ...post,
        author: post.profiles
      }));
      setPosts(mappedData || []);
    } catch (err) {
      console.error("Gagal memuat kiriman:", err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPerumahanId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    try {
      const { error } = await supabase.from('forum_posts').insert([{
        content: newPost,
        perumahan_id: selectedPerumahanId,
        author_id: profile.id,
        kategori: selectedCategory
      }]);
      if (error) throw error;
      setNewPost("");
      fetchPosts();
    } catch (err) {
      alert("Gagal posting: " + err.message);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await supabase.from('forum_likes').delete().eq('post_id', postId).eq('user_id', profile.id);
      } else {
        await supabase.from('forum_likes').insert([{ post_id: postId, user_id: profile.id }]);
      }
      fetchPosts();
    } catch (err) {
      console.error("Gagal like:", err.message);
    }
  };

  const handleBookmark = async (postId, isBookmarked) => {
    try {
      if (isBookmarked) {
        await supabase.from('forum_bookmarks').delete().eq('post_id', postId).eq('user_id', profile.id);
      } else {
        await supabase.from('forum_bookmarks').insert([{ post_id: postId, user_id: profile.id }]);
      }
      fetchPosts();
    } catch (err) {
      console.error("Gagal bookmark:", err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Hapus postingan ini?")) return;
    try {
      await supabase.from('forum_posts').delete().eq('id', postId);
      fetchPosts();
    } catch (err) {
      alert("Gagal hapus: " + err.message);
    }
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleUpdatePost = async () => {
    try {
      const { error } = await supabase
        .from('forum_posts')
        .update({ content: editingPost.content, kategori: editingPost.kategori })
        .eq('id', editingPost.id);
      if (error) throw error;
      setIsEditModalOpen(false);
      fetchPosts();
    } catch (err) {
      alert("Gagal update: " + err.message);
    }
  };

  const openComments = async (post) => {
    setSelectedPost(post);
    setIsCommentModalOpen(true);
    fetchComments(post.id);
  };

  const fetchComments = async (postId) => {
    const { data } = await supabase
      .from('forum_comments')
      .select('*, profiles!author_id(nama, role)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    const mappedComments = data?.map(comment => ({
      ...comment,
      author: comment.profiles
    }));
    setComments(mappedComments || []);
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      setCommenting(true);
      const { error } = await supabase.from('forum_comments').insert([{
        post_id: selectedPost.id,
        author_id: profile.id,
        content: newComment
      }]);
      if (error) throw error;
      setNewComment("");
      fetchComments(selectedPost.id);
      fetchPosts(); // update comment count in list
    } catch (err) {
      alert("Gagal komentar: " + err.message);
    } finally {
      setCommenting(false);
    }
  };
  const filteredPosts = posts.filter((post) => {
    const content = post.content || "";
    const authorName = post.author?.nama || "";
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = content.toLowerCase().includes(search) || 
                         authorName.toLowerCase().includes(search);
    const matchesCategory = filterCategory === "All" || post.kategori === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const isModerator = profile?.role === 'admin' || profile?.role === 'super_admin' || !!profile?.pengurus;

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="max-w-full mx-auto flex flex-col gap-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forum Warga</h1>
          <p className="text-slate-500 text-sm mt-1">Ruang diskusi dan berbagi informasi antar tetangga.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Input 
            placeholder="Cari diskusi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            className="md:w-96"
          />
          <div className="relative group">
            <Button variant="outline" icon={Filter} size="md" className="font-semibold">
              {filterCategory === "All" ? "Kategori" : filterCategory}
            </Button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
              <button onClick={() => setFilterCategory("All")} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-500 transition-colors">Semua Kategori</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-500 transition-colors">{cat}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post */}
      <Card noPadding>
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm shadow-indigo-100">
              {profile?.nama?.charAt(0)}
            </div>
            <Textarea 
              placeholder="Apa yang ingin Anda bagikan hari ini?" 
              className="flex-1 !bg-transparent !border-none !ring-0 !px-0 !py-2 text-base font-medium text-slate-900 placeholder:text-slate-300 min-h-[80px]"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap justify-between items-center gap-4 pt-6 border-t border-slate-50">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-100' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Button 
              onClick={handlePost}
              disabled={!newPost.trim()}
              variant="primary"
              size="md"
              icon={Send}
            >
              Kirim Postingan
            </Button>
          </div>
        </div>
      </Card>

      {/* Posts List */}
      <div className="flex flex-col gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white h-60 rounded-xl border border-slate-50 animate-pulse" />
          ))
        ) : filteredPosts.length === 0 ? (
          <Card className="py-24 text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-100">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="text-slate-400 font-semibold text-xs tracking-wider">Belum ada diskusi yang ditemukan</p>
          </Card>
        ) : filteredPosts.map((post) => {
          const isLiked = post.likes?.some(l => l.user_id === profile.id);
          const isBookmarked = post.bookmarks?.some(b => b.user_id === profile.id);
          const isAuthor = post.author_id === profile.id;
          const canManage = isAuthor || isModerator;

          return (
            <Card key={post.id} className="group transition-all">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-900 font-bold text-xs border border-slate-100 shadow-sm">
                      {post.author?.nama?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-900 tracking-tight leading-none">{post.author?.nama}</p>
                        <Badge variant="indigo" className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-slate-900 text-white border-none">
                          {post.author?.role}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {post.kategori}
                      </p>
                    </div>
                  </div>
                  
                  {canManage && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {isAuthor && (
                        <button onClick={() => openEditModal(post)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
                          <Edit size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDeletePost(post.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="text-slate-700 text-base font-medium leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => handleLike(post.id, isLiked)}
                    className={`flex items-center gap-2 text-xs font-semibold transition-all ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {post.likes?.length || 0}
                  </button>
                  <button 
                    onClick={() => openComments(post)}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {post.comment_count?.[0]?.count || 0} Diskusi
                  </button>
                  <button 
                    onClick={() => handleBookmark(post.id, isBookmarked)}
                    className={`ml-auto text-slate-400 hover:text-indigo-600 transition-all ${isBookmarked ? 'text-indigo-600' : ''}`}
                  >
                    <Bookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Postingan"
      >
        <div className="space-y-8 p-2">
          <Textarea 
            className="w-full text-lg min-h-[150px]"
            value={editingPost?.content}
            onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
          />
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setEditingPost({...editingPost, kategori: cat})}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
                  editingPost?.kategori === cat 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-4 pt-6">
            <Button variant="ghost" className="flex-1 py-2.5 font-semibold" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1 py-2.5 font-semibold" onClick={handleUpdatePost}>Simpan Perubahan</Button>
          </div>
        </div>
      </Modal>

      {/* Comments Modal */}
      <Modal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title="Diskusi Warga"
      >
        <div className="space-y-8 p-2">
          {selectedPost && (
            <div className="pb-8 border-b border-slate-50">
              <div className="flex gap-3 items-center mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-[10px]">
                  {selectedPost.author?.nama?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-950 tracking-tight leading-none">{selectedPost.author?.nama}</p>
                  <p className="text-[9px] text-slate-400 font-semibold tracking-wider mt-0.5">{selectedPost.kategori}</p>
                </div>
              </div>
              <p className="text-base font-semibold text-slate-800 leading-relaxed tracking-tight">{selectedPost.content}</p>
            </div>
          )}

          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
            {comments.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-3 opacity-30">
                <MessageCircle className="w-8 h-8" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jadilah yang pertama berkomentar</p>
              </div>
            ) : comments.map(comment => (
              <div key={comment.id} className="flex gap-4 group">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 font-bold text-[10px] shrink-0 transition-colors group-hover:bg-slate-100">
                  {comment.author?.nama?.charAt(0)}
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl flex-1 border border-transparent transition-all group-hover:border-slate-100 group-hover:bg-white">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs font-bold text-slate-950 tracking-tight leading-none">{comment.author?.nama}</p>
                    <p className="text-[9px] text-slate-400 font-semibold tracking-wide">{new Date(comment.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed tracking-tight">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-50 flex gap-3">
            <Input 
              placeholder="Tulis tanggapan Anda..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="primary" 
              onClick={handleComment} 
              isLoading={commenting}
              disabled={!newComment.trim()}
              size="md"
            >
              Kirim
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
