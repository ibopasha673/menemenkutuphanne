"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit3, Save, X, ArrowLeft, LogOut, Globe } from "lucide-react";

type SliderItem = {
  id: string;
  gorsel_url: string;
  slogan: string | null;
  sira: number;
};

export default function AdminPage() {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  const [gorselUrl, setGorselUrl] = useState("");
  const [slogan, setSlogan] = useState("");
  const [sira, setSira] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      // Eğer kullanıcı misafir ekranına dönüyorsa yetki kontrolünü atla
      if (sessionStorage.getItem("redirecting_to_guest") === "true") {
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/giris");
      } else {
        setAuthorized(true);
        fetchSliders();
      }
    }
    checkAuth();
  }, [router]);

  // Sadece çıkış yap butonuna basıldığında oturumu sonlandırıp giriş sayfasına atar
  const handleLogout = async () => {
    sessionStorage.removeItem("redirecting_to_guest");
    await supabase.auth.signOut();
    router.push("/giris");
  };

  // Misafir ekranına dön butonuna basıldığında oturumu kapatmadan direkt ana sayfaya yönlendirir
  const handleGoToGuest = () => {
    sessionStorage.setItem("redirecting_to_guest", "true");
    router.push("/");
  };

  const fetchSliders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sliders")
      .select("*")
      .order("sira", { ascending: true });

    if (error) {
      console.error("Veriler çekilemedi:", error.message);
    } else {
      setSliders(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
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

  const handleEdit = (item: SliderItem) => {
    setEditingId(item.id);
    setGorselUrl(item.gorsel_url);
    setSlogan(item.slogan || "");
    setSira(item.sira);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu slider öğesini silmek istediğinize emin misiniz?")) return;

    const { error } = await supabase.from("sliders").delete().eq("id", id);
    if (error) {
      alert("Silinirken hata oluştu: " + error.message);
    } else {
      fetchSliders();
    }
  };

  if (!authorized && sessionStorage.getItem("redirecting_to_guest") !== "true") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Yetki kontrol ediliyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-zinc-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-emerald-400">
            Yönetici Paneli - Slider Yönetimi
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Slider görsellerini ve içeriklerini buradan yönetebilirsiniz.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGoToGuest}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition flex items-center gap-2 text-sm text-zinc-300 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-emerald-400" /> Misafir Ekranına Dön
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition flex items-center gap-2 text-sm text-red-400 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl shadow-xl h-fit">
          <h2 className="text-lg font-semibold mb-4 text-emerald-300 flex items-center gap-2">
            {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? "Slider'ı Düzenle" : "Yeni Slider Ekle"}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                Görsel URL
              </label>
              <input
                type="text"
                value={gorselUrl}
                onChange={(e) => setGorselUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                Slogan Metni
              </label>
              <textarea
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Slider sloganı..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                Gösterim Sırası
              </label>
              <input
                type="number"
                value={sira}
                onChange={(e) => setSira(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 transition py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {editingId ? "Güncelle" : "Ekle"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setGorselUrl("");
                    setSlogan("");
                    setSira(0);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2.5 rounded-xl text-sm flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-200">
            Kayıtlı Slider Listesi ({sliders.length})
          </h2>

          {loading ? (
            <p className="text-zinc-500">Yükleniyor...</p>
          ) : sliders.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500">
              Henüz kayıtlı slider bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {sliders.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.gorsel_url}
                      alt="Slider"
                      className="w-16 h-16 rounded-xl object-cover border border-zinc-800"
                    />
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md">
                        Sıra: {item.sira}
                      </span>
                      <p className="text-sm font-medium text-zinc-200 mt-1 line-clamp-1">
                        {item.slogan || "Slogan yok"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-zinc-300"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}