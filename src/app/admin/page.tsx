"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit3, Save, X, LogOut, Users, Shield, ShieldAlert } from "lucide-react";

type SliderItem = {
  id: string;
  gorsel_url: string;
  slogan: string | null;
  sira: number;
};

type UserProfile = {
  id: string;
  email: string;
  isim: string | null;
  soyisim: string | null;
  phone: string | null;
  tc_kimlik_no: string | null;
  role: string;
  blog_yetkisi: boolean;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"sliders" | "users">("sliders");
  
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  // Slider Form States
  const [gorselUrl, setGorselUrl] = useState("");
  const [slogan, setSlogan] = useState("");
  const [sira, setSira] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/giris");
      } else {
        setAuthorized(true);
        fetchSliders();
        fetchUsers();
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/giris");
  };

  const fetchSliders = async () => {
    const { data, error } = await supabase
      .from("sliders")
      .select("*")
      .order("sira", { ascending: true });

    if (!error) {
      setSliders(data || []);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) {
      console.error("Üyeler çekilemedi:", error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  // Blog Yetkisini Güncelleme
  const toggleBlogPermission = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ blog_yetkisi: !currentStatus })
      .eq("id", userId);

    if (error) {
      alert("Yetki güncellenirken hata oluştu: " + error.message);
    } else {
      fetchUsers();
    }
  };

  // Üyeyi Silme
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bu üyeyi sistemden kalıcı olarak silmek istediğinize emin misiniz?")) return;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      alert("Üye silinirken hata oluştu: " + error.message);
    } else {
      fetchUsers();
    }
  };

  const handleSaveSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gorselUrl) {
      alert("Lütfen bir görsel URL adresi girin!");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("sliders")
        .update({ gorsel_url: gorselUrl, slogan, sira })
        .eq("id", editingId);

      if (error) {
        alert("Güncellenirken hata oluştu: " + error.message);
      } else {
        setEditingId(null);
        setGorselUrl("");
        setSlogan("");
        setSira(0);
        fetchSliders();
      }
    } else {
      const { error } = await supabase
        .from("sliders")
        .insert([{ gorsel_url: gorselUrl, slogan, sira }]);

      if (error) {
        alert("Eklenirken hata oluştu: " + error.message);
      } else {
        setGorselUrl("");
        setSlogan("");
        setSira(0);
        fetchSliders();
      }
    }
  };

  const handleEditSlider = (item: SliderItem) => {
    setEditingId(item.id);
    setGorselUrl(item.gorsel_url);
    setSlogan(item.slogan || "");
    setSira(item.sira);
  };

  const handleDeleteSlider = async (id: string) => {
    if (!confirm("Bu slider öğesini silmek istediğinize emin misiniz?")) return;

    const { error } = await supabase.from("sliders").delete().eq("id", id);
    if (error) {
      alert("Silinirken hata oluştu: " + error.message);
    } else {
      fetchSliders();
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Yetki kontrol ediliyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12">
      {/* ÜST BAŞLIK VE ÇIKIŞ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-emerald-400">
            Yönetici Paneli
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Slider görsellerini ve kulüp üyelerini buradan yönetebilirsiniz.</p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition flex items-center gap-2 text-sm text-red-400 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Çıkış Yap
        </button>
      </div>

      {/* SEKME GEÇİŞLERİ (Slider Yönetimi / Üye Yönetimi) */}
      <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("sliders")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
            activeTab === "sliders"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          Slider Yönetimi
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "users"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" /> Üye Listesi ve Yetkiler ({users.length})
        </button>
      </div>

      {/* 1. SLİDER YÖNETİMİ SEKMESİ */}
      {activeTab === "sliders" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl shadow-xl h-fit">
            <h2 className="text-lg font-semibold mb-4 text-emerald-300 flex items-center gap-2">
              {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingId ? "Slider'ı Düzenle" : "Yeni Slider Ekle"}
            </h2>

            <form onSubmit={handleSaveSlider} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Görsel URL</label>
                <input type="text" value={gorselUrl} onChange={(e) => setGorselUrl(e.target.value)} placeholder="https://..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Slogan Metni</label>
                <textarea value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Slider sloganı..." rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Gösterim Sırası</label>
                <input type="number" value={sira} onChange={(e) => setSira(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 transition py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer">
                  <Save className="w-4 h-4" /> {editingId ? "Güncelle" : "Ekle"}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setGorselUrl(""); setSlogan(""); setSira(0); }} className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2.5 rounded-xl text-sm flex items-center justify-center cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-200">Kayıtlı Slider Listesi ({sliders.length})</h2>
            {sliders.length === 0 ? <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500">Henüz kayıtlı slider bulunmuyor.</div> : (
              <div className="space-y-3">
                {sliders.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <img src={item.gorsel_url} alt="Slider" className="w-16 h-16 rounded-xl object-cover border border-zinc-800" />
                      <div>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md">Sıra: {item.sira}</span>
                        <p className="text-sm font-medium text-zinc-200 mt-1 line-clamp-1">{item.slogan || "Slogan yok"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditSlider(item)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-zinc-300 cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteSlider(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ÜYE YÖNETİMİ SEKMESİ */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-200">Kayıtlı Kulüp Üyeleri</h2>
          
          {loading ? (
            <p className="text-zinc-500">Üyeler yükleniyor...</p>
          ) : users.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500">
              Henüz kayıtlı üye bulunmuyor.
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 text-xs uppercase tracking-wider">
                      <th className="p-4">Ad Soyad</th>
                      <th className="p-4">İletişim / E-posta</th>
                      <th className="p-4">Telefon</th>
                      <th className="p-4">TC Kimlik No</th>
                      <th className="p-4">Rol / Yetki</th>
                      <th className="p-4">Blog Yazma Yetkisi</th>
                      <th className="p-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-4 font-medium text-white">
                          {u.isim || u.soyisim ? `${u.isim || ""} ${u.soyisim || ""}` : "İsim girilmemiş"}
                        </td>
                        <td className="p-4 text-zinc-300">{u.email}</td>
                        <td className="p-4 text-zinc-400">{u.phone || "Belirtilmemiş"}</td>
                        <td className="p-4 text-zinc-400">{u.tc_kimlik_no || "Belirtilmemiş"}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase ${
                            u.role === "admin" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => toggleBlogPermission(u.id, u.blog_yetkisi)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 w-fit ${
                              u.blog_yetkisi
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                            }`}
                          >
                            {u.blog_yetkisi ? <Shield className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            {u.blog_yetkisi ? "Yetkili (Aktif)" : "Yetkisiz"}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition cursor-pointer inline-flex items-center gap-1 text-xs font-medium"
                            title="Üyeyi Sil"
                          >
                            <Trash2 className="w-4 h-4" /> Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}