"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Edit3, Save, X, FileText, Calendar, User } from "lucide-react";

type BlogItem = {
  id: string;
  user_id: string;
  blog_ismi: string;
  blog_icerigi: string;
  blog_fotografi: string | null;
  blog_guncelleme_tarihi: string;
  profiles?: {
    isim: string | null;
    soyisim: string | null;
    email: string | null;
  };
};

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("uye");
  const [blogYetkisi, setBlogYetkisi] = useState<boolean>(false);

  // Modal / Form state'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blogIsmi, setBlogIsmi] = useState("");
  const [blogIcerigi, setBlogIcerigi] = useState("");
  const [blogFotografi, setBlogFotografi] = useState("");
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUserId(session.user.id);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, blog_yetkisi")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileData) {
          setUserRole(profileData.role || "uye");
          setBlogYetkisi(profileData.blog_yetkisi || false);
        }
      }

      fetchBlogs();
    }
    checkAuthAndFetch();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("*, profiles:user_id (isim, soyisim, email)")
      .order("blog_guncelleme_tarihi", { ascending: false });

    if (!error && data) {
      setBlogs(data);
    }
    setLoading(false);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const blogData = {
      user_id: userId,
      blog_ismi: blogIsmi,
      blog_icerigi: blogIcerigi,
      blog_fotografi: blogFotografi || null,
      blog_guncelleme_tarihi: new Date().toISOString(),
    };

    if (editingBlogId) {
      const { error } = await supabase
        .from("blogs")
        .update(blogData)
        .eq("id", editingBlogId);

      if (error) {
        alert("Blog güncellenirken hata oluştu: " + error.message);
      } else {
        alert("Blog başarıyla güncellendi!");
        closeModal();
        fetchBlogs();
      }
    } else {
      const { error } = await supabase.from("blogs").insert([blogData]);

      if (error) {
        alert("Blog eklenirken hata oluştu: " + error.message);
      } else {
        alert("Blog başarıyla paylaşıldı!");
        closeModal();
        fetchBlogs();
      }
    }
  };

  const handleEditBlog = (blog: BlogItem) => {
    setEditingBlogId(blog.id);
    setBlogIsmi(blog.blog_ismi);
    setBlogIcerigi(blog.blog_icerigi);
    setBlogFotografi(blog.blog_fotografi || "");
    setIsModalOpen(true);
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm("Bu blog yazısını silmek istediğinize emin misiniz?")) return;

    const { error } = await supabase.from("blogs").delete().eq("id", blogId);
    if (error) {
      alert("Silinirken hata oluştu: " + error.message);
    } else {
      alert("Blog yazısı silindi.");
      fetchBlogs();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBlogId(null);
    setBlogIsmi("");
    setBlogIcerigi("");
    setBlogFotografi("");
  };

  const canWriteBlog = userRole === "admin" || blogYetkisi;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 relative pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* ÜST MENÜ VE GERİ DÖN */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-800 pb-6 gap-4">
          <div>
            <Link href="/" className="text-zinc-400 hover:text-emerald-400 mb-3 inline-flex items-center gap-2 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
            </Link>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 drop-shadow-lg mt-1">
              <FileText className="text-emerald-400 w-8 h-8" /> Kulüp Blog Yazıları
            </h1>
          </div>

          {canWriteBlog && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni Blog Yaz
            </button>
          )}
        </div>

        {/* BLOG LİSTESİ */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">Bloglar yükleniyor...</div>
        ) : blogs.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 p-12 rounded-2xl text-center text-zinc-500">
            Henüz paylaşılmış bir blog yazısı bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {blogs.map((blog) => {
              const isOwner = blog.user_id === userId;
              const isAdmin = userRole === "admin";

              return (
                <div key={blog.id} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-6 items-start">
                  {blog.blog_fotografi && (
                    <img
                      src={blog.blog_fotografi}
                      alt={blog.blog_ismi}
                      className="w-full md:w-48 h-48 rounded-xl object-cover border border-zinc-800 flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="text-2xl font-bold text-emerald-300">{blog.blog_ismi}</h2>
                      
                      {(isOwner || isAdmin) && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditBlog(blog)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-zinc-300 cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-400 border-b border-zinc-800/80 pb-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        {blog.profiles?.isim || "Üye"} {blog.profiles?.soyisim || ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        {new Date(blog.blog_guncelleme_tarihi).toLocaleDateString("tr-TR")}
                      </span>
                    </div>

                    <p className="text-zinc-300 text-sm whitespace-pre-line leading-relaxed">
                      {blog.blog_icerigi}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BLOG EKLEME / DÜZENLEME MODALI */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-bold text-emerald-300">
                  {editingBlogId ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı"}
                </h3>
                <button onClick={closeModal} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBlog} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Blog Başlığı *</label>
                  <input
                    type="text"
                    value={blogIsmi}
                    onChange={(e) => setBlogIsmi(e.target.value)}
                    placeholder="Yazı başlığı..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Fotoğraf URL (İsteğe bağlı)</label>
                  <input
                    type="text"
                    value={blogFotografi}
                    onChange={(e) => setBlogFotografi(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Blog İçeriği *</label>
                  <textarea
                    rows={6}
                    value={blogIcerigi}
                    onChange={(e) => setBlogIcerigi(e.target.value)}
                    placeholder="Blog yazınızı buraya yazın..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition cursor-pointer">
                    İptal
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer">
                    <Save className="w-4 h-4" /> {editingBlogId ? "Güncelle" : "Yayınla"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}