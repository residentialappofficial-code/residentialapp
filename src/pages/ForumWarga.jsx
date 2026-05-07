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
import { Button, Card, Badge, Modal, Input } from "@/components/ui";
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
          author:profiles(id, nama, role),
          likes:forum_likes(user_id),
          bookmarks:forum_bookmarks(user_id),
          comment_count:forum_comments(count)
        `)
        .eq('perumahan_id', selectedPerumahanId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
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
      .select('*, author:profiles(nama, role)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(data || []);
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

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.author?.nama?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || post.kategori === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="max-w-full mx-auto flex flex-col gap-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Forum Warga</h1>
          <p className="text-slate-500 text-sm font-medium">Ruang diskusi dan berbagi informasi antar tetangga.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Input 
            placeholder="Cari diskusi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            className="md:w-80"
          />
          <div className="relative group">
            <Button variant="outline" icon={Filter} className="font-bold">
              {filterCategory === "All" ? "Kategori" : filterCategory}
            </Button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
              <button onClick={() => setFilterCategory("All")} className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600">Semua</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600">{cat}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post */}
      <Card noPadding className="overflow-hidden border-2 border-slate-950/5">
        <div className="p-8 space-y-6">
          <div className="flex gap-6">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold shrink-0">
              {profile?.nama?.charAt(0)}
            </div>
            <textarea 
              placeholder="Apa yang ingin Anda bagikan hari ini?" 
              className="flex-1 text-lg font-bold text-slate-900 focus:outline-none resize-none py-2 placeholder:text-slate-300 bg-transparent min-h-[100px]"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap justify-between items-center gap-4 pt-6 border-t border-slate-50">
            <div className="flex gap-2">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
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
              size="lg"
              className="px-10 font-bold"
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
            <div key={i} className="bg-white h-64 rounded-2xl border border-slate-100 animate-pulse" />
          ))
        ) : filteredPosts.length === 0 ? (
          <Card className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
              <MessageSquare className="w-10 h-10" />
            </div>
            <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Belum ada diskusi yang ditemukan</p>
          </Card>
        ) : filteredPosts.map((post) => {
          const isLiked = post.likes?.some(l => l.user_id === profile.id);
          const isBookmarked = post.bookmarks?.some(b => b.user_id === profile.id);
          const isAuthor = post.author_id === profile.id;

          return (
            <Card key={post.id} className="group hover:border-slate-300 transition-all">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {post.author?.nama?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-900">{post.author?.nama}</p>
                        <Badge variant="slate" className="text-[8px] px-1.5 py-0">{post.author?.role}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {new Date(post.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} • {post.kategori}
                      </p>
                    </div>
                  </div>
                  
                  {isAuthor && (
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(post)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeletePost(post.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
                
                <p className="text-slate-800 text-lg font-bold leading-relaxed tracking-tight">
                  {post.content}
                </p>

                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => handleLike(post.id, isLiked)}
                    className={`flex items-center gap-2 text-xs font-bold transition-all ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {post.likes?.length || 0} Suka
                  </button>
                  <button 
                    onClick={() => openComments(post)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {post.comment_count?.[0]?.count || 0} Diskusi
                  </button>
                  <button 
                    onClick={() => handleBookmark(post.id, isBookmarked)}
                    className={`ml-auto flex items-center gap-2 text-xs font-bold transition-all ${isBookmarked ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                  >
                    {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
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
        <div className="space-y-6">
          <textarea 
            className="w-full text-lg font-bold text-slate-900 focus:outline-none resize-none bg-slate-50 p-4 rounded-2xl min-h-[150px]"
            value={editingPost?.content}
            onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
          />
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setEditingPost({...editingPost, kategori: cat})}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  editingPost?.kategori === cat 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1" onClick={handleUpdatePost}>Simpan Perubahan</Button>
          </div>
        </div>
      </Modal>

      {/* Comments Modal */}
      <Modal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        title="Diskusi"
      >
        <div className="space-y-8">
          {selectedPost && (
            <div className="pb-6 border-b border-slate-100">
              <div className="flex gap-3 items-center mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">
                  {selectedPost.author?.nama?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{selectedPost.author?.nama}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{selectedPost.kategori}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedPost.content}</p>
            </div>
          )}

          <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2">
            {comments.length === 0 ? (
              <p className="text-center py-8 text-xs font-bold text-slate-300 uppercase tracking-widest">Belum ada komentar</p>
            ) : comments.map(comment => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                  {comment.author?.nama?.charAt(0)}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold text-slate-900">{comment.author?.nama}</p>
                    <p className="text-[9px] text-slate-400 font-bold">{new Date(comment.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <Input 
              placeholder="Tulis komentar..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="primary" 
              onClick={handleComment} 
              isLoading={commenting}
              disabled={!newComment.trim()}
            >
              Kirim
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
