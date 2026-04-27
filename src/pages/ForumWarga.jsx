import { useState, useEffect, useCallback } from "react";
import { Send, MessageSquare, ThumbsUp, Search, MoreVertical, Filter, Heart, Share2, MessageCircle, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

import { SelectionRequired } from "@/components/ui/SelectionRequired";

export default function ForumWarga() {
  const { profile, selectedPerumahanId } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedPerumahanId) return;
      
      const { data } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:profiles(nama, role)
        `)
        .eq('perumahan_id', selectedPerumahanId)
        .order('created_at', { ascending: false });
      
      setPosts(data || []);
    } catch {
      console.error("Gagal memuat kiriman");
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
      const { error: pError } = await supabase.from('forum_posts').insert([{
        content: newPost,
        perumahan_id: selectedPerumahanId,
        author_id: profile.id
      }]);
      if (pError) throw pError;
      setNewPost("");
      fetchPosts();
    } catch {
      console.error("Gagal posting");
    }
  };

  if (profile?.role === 'super_admin' && !selectedPerumahanId) {
    return <SelectionRequired />;
  }

  return (
    <div className="bg-transparent">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Forum Warga</h1>
          <p className="text-slate-500 text-sm font-medium">Ruang diskusi dan berbagi informasi antar sesama warga kompleks.</p>
        </div>

        {/* Create Post Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
              {profile?.nama?.charAt(0)}
            </div>
            <textarea 
              placeholder="Apa yang ingin Anda bagikan hari ini?" 
              className="flex-1 text-sm font-medium focus:outline-none resize-none py-2 min-h-[100px]"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
          </div>
          <div className="h-px bg-slate-100 w-full" />
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-slate-500 font-bold text-xs hover:bg-slate-50 rounded-lg transition-all">
                <ImageIcon className="w-4 h-4" /> Foto
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-slate-500 font-bold text-xs hover:bg-slate-50 rounded-lg transition-all">
                <MessageCircle className="w-4 h-4" /> Polling
              </button>
            </div>
            <button 
              onClick={handlePost}
              disabled={!newPost.trim()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Posting
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="flex flex-col gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white h-48 rounded-xl border border-slate-200 animate-pulse" />
            ))
          ) : posts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 font-medium">
              Belum ada kiriman. Jadilah yang pertama!
            </div>
          ) : posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-sm">
                      {post.author?.nama?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{post.author?.nama}</p>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase">
                          {post.author?.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {new Date(post.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-slate-700 text-sm font-medium leading-relaxed">
                  {post.content}
                </p>

                <div className="h-px bg-slate-100 w-full" />

                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-slate-500 font-bold text-xs hover:text-red-500 transition-all">
                    <Heart className="w-4 h-4" /> 24
                  </button>
                  <button className="flex items-center gap-2 text-slate-500 font-bold text-xs hover:text-indigo-600 transition-all">
                    <MessageCircle className="w-4 h-4" /> 12
                  </button>
                  <button className="ml-auto text-slate-500 hover:text-slate-900 transition-all">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
