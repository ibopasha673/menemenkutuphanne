"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit3, Save, X, LogOut, Users, Shield, ShieldAlert, BookOpen, MessageSquare, Star, FileText, Trophy, CheckCircle, XCircle } from "lucide-react";

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

type BookItem = {
  id: string;
  baslik: string;
  yazar: string;
  gorsel_url: string;
  kapak_gorseli: string;
  toplam_sayfa: number;
  kisa_aciklama?: string;
  toplanti_bilgileri?: string;
  ay?: string;
  yil?: string;
  durum?: boolean;
  son_tarih?: string;
};

type YarismaItem = {
  id: string;
  yarisma_ismi: string;
  yarisma_hakkinda: string;
  yarisma_sartlari: string;
  yarisma_tarihi: string;
  basvuru_baslangic_tarihi: string;
  basvuru_bitis_tarihi: string;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"sliders" | "users" | "books" | "yarismalar">("sliders");
  
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [yarismalar, setYarismalar] = useState<YarismaItem[]>([]);
  const [basvurular, setBasvurular] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  // Slider Form States
  const [gorselUrl, setGorselUrl] = useState("");
  const [slogan, setSlogan] = useState("");
  const [sira, setSira] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Book Form States
  const [bookBaslik, setBookBaslik] = useState("");
  const [bookYazar, setBookYazar] = useState("");
  const [bookToplamSayfa, setBookToplamSayfa] = useState<number>(100);
  const [bookKisaAciklama, setBookKisaAciklama] = useState("");
  const [bookToplantiBilgileri, setBookToplantiBilgileri] = useState("");
  const [bookAy, setBookAy] = useState("");
  const [bookYil, setBookYil] = useState("");
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [bookDurum, setBookDurum] = useState<boolean>(false);
  const [bookSonTarih, setBookSonTarih] = useState("");
  const [existingKapakGorseli, setExistingKapakGorseli] = useState("");
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  // Yarışma Form States
  const [yarismaIsmi, setYarismaIsmi] = useState("");
  const [yarismaHakkinda, setYarismaHakkinda] = useState("");
  const [yarismaSartlari, setYarismaSartlari] = useState("");
  const [yarismaTarihi, setYarismaTarihi] = useState("");
  const [basvuruBaslangicTarihi, setBasvuruBaslangicTarihi] = useState("");
  const [basvuruBitisTarihi, setBasvuruBitisTarihi] = useState("");
  const [editingYarismaId, setEditingYarismaId] = useState<string | null>(null);

  // Admin Yorum İnceleme States
  const [selectedBookForReviews, setSelectedBookForReviews] = useState<BookItem | null>(null);
  const [kitapYorumlari, setKitapYorumlari] = useState<any[]>([]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/giris");
      } else {
        setAuthorized(true);
        fetchSliders();
        fetchUsers();
        fetchBooks();
        fetchYarismalar();
        fetchBasvurular();
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/giris");
  };

  const fetchSliders = async () => {
    const { data } = await supabase.from("sliders").select("*").order("sira", { ascending: true });
    if (data) setSliders(data);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*");
    if (data) setUsers(data);
    setLoading(false);
  };

  const fetchBooks = async () => {
    const { data } = await supabase.from("books").select("*").order("created_time", { ascending: false });
    if (data) setBooks(data);
  };

  const fetchYarismalar = async () => {
    const { data } = await supabase.from("oyku_yarismalari").select("*").order("created_at", { ascending: false });
    if (data) setYarismalar(data);
  };

  const fetchBasvurular = async () => {
    const { data } = await supabase
      .from("yarisma_basvurulari")
      .select("*, profiles:user_id (isim, soyisim, email), oyku_yarismalari:yarisma_id (yarisma_ismi)")
      .order("created_at", { ascending: false });
    if (data) setBasvurular(data);
  };

  const handleSaveYarisma = async (e: React.FormEvent) => {
    e.preventDefault();
    const yarismaData = {
      yarisma_ismi: yarismaIsmi,
      yarisma_hakkinda: yarismaHakkinda,
      yarisma_sartlari: yarismaSartlari,
      yarisma_tarihi: yarismaTarihi,
      basvuru_baslangic_tarihi: basvuruBaslangicTarihi,
      basvuru_bitis_tarihi: basvuruBitisTarihi,
    };

    if (editingYarismaId) {
      const { error } = await supabase.from("oyku_yarismalari").update(yarismaData).eq("id", editingYarismaId);
      if (error) alert("Hata: " + error.message);
      else { alert("Yarışma güncellendi!"); resetYarismaForm(); fetchYarismalar(); }
    } else {
      const { error } = await supabase.from("oyku_yarismalari").insert([yarismaData]);
      if (error) alert("Hata: " + error.message);
      else { alert("Yarışma eklendi!"); resetYarismaForm(); fetchYarismalar(); }
    }
  };

  const handleEditYarisma = (y: YarismaItem) => {
    setEditingYarismaId(y.id);
    setYarismaIsmi(y.yarisma_ismi);
    setYarismaHakkinda(y.yarisma_hakkinda || "");
    setYarismaSartlari(y.yarisma_sartlari || "");
    setYarismaTarihi(y.yarisma_tarihi ? y.yarisma_tarihi.split("T")[0] : "");
    setBasvuruBaslangicTarihi(y.basvuru_baslangic_tarihi ? y.basvuru_baslangic_tarihi.split("T")[0] : "");
    setBasvuruBitisTarihi(y.basvuru_bitis_tarihi ? y.basvuru_bitis_tarihi.split("T")[0] : "");
  };

  const handleDeleteYarisma = async (id: string) => {
    if (!confirm("Bu yarışmayı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("oyku_yarismalari").delete().eq("id", id);
    if (error) alert("Silinirken hata: " + error.message);
    else { alert("Yarışma silindi!"); fetchYarismalar(); }
  };

  const resetYarismaForm = () => {
    setEditingYarismaId(null);
    setYarismaIsmi("");
    setYarismaHakkinda("");
    setYarismaSartlari("");
    setYarismaTarihi("");
    setBasvuruBaslangicTarihi("");
    setBasvuruBitisTarihi("");
  };

  const handleBasvuruDurum = async (id: string, durum: string) => {
    const { error } = await supabase.from("yarisma_basvurulari").update({ durum }).eq("id", id);
    if (error) alert("Hata: " + error.message);
    else { alert(`Başvuru ${durum === 'onaylandi' ? 'onaylandı' : 'reddedildi'}!`); fetchBasvurular(); }
  };

  const fetchBookReviews = async (bookId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, profiles:user_id (isim, soyisim, email)")
      .eq("book_id", bookId);

    if (!error) {
      setKitapYorumlari(data || []);
    }
  };

  const handleOpenReviewsModal = (book: BookItem) => {
    setSelectedBookForReviews(book);
    fetchBookReviews(book.id);
  };

  const handleDeleteReviewByAdmin = async (reviewId: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) {
      alert("Yorum silinirken hata oluştu: " + error.message);
    } else {
      alert("Yorum başarıyla silindi!");
      if (selectedBookForReviews) {
        fetchBookReviews(selectedBookForReviews.id);
      }
    }
  };

  // Kitap Ekleme / Güncelleme (Dosya Yükleme Destekli)
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalGorselUrl = existingKapakGorseli;

    if (bookFile) {
      const fileExt = bookFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("kitaplar")
        .upload(filePath, bookFile);

      if (uploadError) {
        alert("Görsel yüklenirken hata oluştu: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicURLData } = supabase.storage
        .from("kitaplar")
        .getPublicUrl(filePath);

      finalGorselUrl = publicURLData.publicUrl;
    }

    const bookData: any = {
      baslik: bookBaslik,
      yazar: bookYazar,
      toplam_sayfa: bookToplamSayfa,
      kisa_aciklama: bookKisaAciklama,
      toplanti_bilgileri: bookToplantiBilgileri,
      ay: bookAy,
      yil: bookYil,
      durum: bookDurum,
      son_tarih: bookSonTarih,
      kapak_gorseli: finalGorselUrl,
    };

    if (editingBookId) {
      const { error } = await supabase
        .from("books")
        .update(bookData)
        .eq("id", editingBookId);

      if (error) {
        alert("Kitap güncellenirken hata oluştu: " + error.message);
      } else {
        alert("Kitap başarıyla güncellendi!");
        resetBookForm();
        fetchBooks();
      }
    } else {
      if (!finalGorselUrl) {
        alert("Lütfen bir kitap görseli seçin!");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("books").insert([bookData]);

      if (error) {
        alert("Kitap eklenirken hata oluştu: " + error.message);
      } else {
        alert("Kitap başarıyla kaydedildi!");
        resetBookForm();
        fetchBooks();
      }
    }
    setLoading(false);
  };

  const handleEditBook = (book: BookItem) => {
    setEditingBookId(book.id);
    setBookBaslik(book.baslik || "");
    setBookYazar(book.yazar || "");
    setBookToplamSayfa(book.toplam_sayfa || 100);
    setBookKisaAciklama(book.kisa_aciklama || "");
    setBookToplantiBilgileri(book.toplanti_bilgileri || "");
    setBookAy(book.ay || "");
    setBookYil(book.yil || "");
    setBookDurum(book.durum ?? false);
    setBookSonTarih(book.son_tarih || "");
    setExistingKapakGorseli(book.kapak_gorseli || "");
    setBookFile(null);
  };

  const resetBookForm = () => {
    setEditingBookId(null);
    setBookBaslik("");
    setBookYazar("");
    setBookToplamSayfa(100);
    setBookKisaAciklama("");
    setBookToplantiBilgileri("");
    setBookAy("");
    setBookYil("");
    setBookDurum(false);
    setBookSonTarih("");
    setExistingKapakGorseli("");
    setBookFile(null);
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("Bu kitabı silmek istediğinize emin misiniz?")) return;

    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) {
      alert("Silinirken hata oluştu: " + error.message);
    } else {
      alert("Kitap silindi!");
      fetchBooks();
    }
  };

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
          <p className="text-xs text-zinc-400 mt-1">Slider, üyeler, kitaplar ve yarışma yönetimini buradan yapabilirsiniz.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/blogs")}
            className="px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-xl transition flex items-center gap-2 text-sm text-emerald-400 cursor-pointer font-semibold"
          >
            <FileText className="w-4 h-4" /> Blogs
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition flex items-center gap-2 text-sm text-red-400 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>
      </div>

      {/* SEKME GEÇİŞLERİ */}
      <div className="flex flex-wrap gap-3 mb-8 border-b border-zinc-800 pb-4">
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
          onClick={() => setActiveTab("books")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "books"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Kitap Yönetimi ({books.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("yarismalar")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "yarismalar"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4" /> Yarışma Yönetimi ({yarismalar.length})
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

      {/* 1. SLİDER YÖNETİMİ */}
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

      {/* 2. KİTAP YÖNETİMİ SEKMESİ */}
      {activeTab === "books" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl shadow-xl h-fit">
            <h2 className="text-lg font-semibold mb-4 text-emerald-300 flex items-center gap-2">
              {editingBookId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingBookId ? "Kitabı Düzenle" : "Yeni Kitap Ekle"}
            </h2>

            <form onSubmit={handleSaveBook} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Kitap Başlığı *</label>
                <input type="text" value={bookBaslik} onChange={(e) => setBookBaslik(e.target.value)} placeholder="Örn: Nutuk" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Yazar *</label>
                <input type="text" value={bookYazar} onChange={(e) => setBookYazar(e.target.value)} placeholder="Örn: Mustafa Kemal Atatürk" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Toplam Sayfa *</label>
                  <input type="number" min={1} value={bookToplamSayfa} onChange={(e) => setBookToplamSayfa(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Yıl</label>
                  <input type="text" value={bookYil} onChange={(e) => setBookYil(e.target.value)} placeholder="2026" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>

              {/* GÜNCEL / GEÇMİŞ KONTROLÜ */}
              <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <input 
                  type="checkbox" 
                  checked={bookDurum} 
                  onChange={(e) => setBookDurum(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
                <label className="text-sm text-zinc-300">Bu kitabı "Güncel Okunan" olarak işaretle</label>
              </div>

              {/* HTML TAKVİM INPUTU (DARK MODE UYUMLU) */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Son Tarih (Takvimden Seç)</label>
                <input 
                  type="date" 
                  value={bookSonTarih} 
                  onChange={(e) => setBookSonTarih(e.target.value)} 
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer" 
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Ay</label>
                <input type="text" value={bookAy} onChange={(e) => setBookAy(e.target.value)} placeholder="Ocak" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Kısa Açıklama</label>
                <textarea rows={2} value={bookKisaAciklama} onChange={(e) => setBookKisaAciklama(e.target.value)} placeholder="Kitap hakkında kısa bilgi..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Toplantı Bilgileri</label>
                <input type="text" value={bookToplantiBilgileri} onChange={(e) => setBookToplantiBilgileri(e.target.value)} placeholder="14 Ocak 2026 - Çevrim içi" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
              
              {/* MEVCUT GÖRSEL ÖNİZLEMESİ VE DOSYA SEÇİMİ */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                  Kitap Görseli Seç (Mevcudu değiştirmek istersen seç)
                </label>
                {existingKapakGorseli && (
                  <div className="mb-2 flex items-center gap-3 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    <img src={existingKapakGorseli} alt="Mevcut Kapak" className="w-10 h-14 object-cover rounded-md" />
                    <span className="text-xs text-zinc-400">Mevcut görsel yüklü</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => setBookFile(e.target.files?.[0] || null)} className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 transition py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                  <Save className="w-4 h-4" /> {editingBookId ? "Güncelle" : "Ekle"}
                </button>
                {editingBookId && (
                  <button type="button" onClick={resetBookForm} className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2.5 rounded-xl text-sm flex items-center justify-center cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-200">Kayıtlı Kitaplar ({books.length})</h2>
            {books.length === 0 ? <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500">Henüz eklenmiş kitap bulunmuyor.</div> : (
              <div className="space-y-3">
                {books.map((book) => (
                  <div key={book.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                    <div className="flex items-center gap-4">
                      {book.kapak_gorseli ? (
                        <img src={book.kapak_gorseli} alt={book.baslik} className="w-14 h-20 rounded-xl object-cover border border-zinc-800" />
                      ) : (
                        <div className="w-14 h-20 rounded-xl border border-zinc-800 bg-zinc-800/50 flex items-center justify-center text-[10px] text-zinc-500 text-center">Görsel Yok</div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-bold text-white">{book.baslik}</h3>
                        <p className="text-xs text-zinc-400">Yazar: {book.yazar}</p>
                        <div className="flex gap-2 mt-1 items-center">
                           <span className="text-[11px] font-semibold px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md inline-block">S: {book.toplam_sayfa}</span>
                           <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${book.durum ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                             {book.durum ? "Güncel" : "Geçmiş"}
                           </span>
                           {book.son_tarih && <span className="text-[10px] text-zinc-400">Son Tarih: {book.son_tarih}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button 
                        onClick={() => handleOpenReviewsModal(book)} 
                        className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        title="Kitap Yorumları"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Yorumlar
                      </button>
                      <button onClick={() => handleEditBook(book)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-zinc-300 cursor-pointer" title="Düzenle"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteBook(book.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition cursor-pointer" title="Sil"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. YARIŞMA YÖNETİMİ SEKMESİ */}
      {activeTab === "yarismalar" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl shadow-xl h-fit">
              <h2 className="text-lg font-semibold mb-4 text-emerald-300 flex items-center gap-2">
                {editingYarismaId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingYarismaId ? "Yarışmayı Düzenle" : "Yeni Yarışma Ekle"}
              </h2>

              <form onSubmit={handleSaveYarisma} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Yarışma İsmi *</label>
                  <input type="text" value={yarismaIsmi} onChange={(e) => setYarismaIsmi(e.target.value)} placeholder="Örn: 1. Geleneksel Öykü Yarışması" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Yarışma Hakkında *</label>
                  <textarea rows={3} value={yarismaHakkinda} onChange={(e) => setYarismaHakkinda(e.target.value)} placeholder="Yarışma detayları ve amacı..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Yarışma Şartları *</label>
                  <textarea rows={3} value={yarismaSartlari} onChange={(e) => setYarismaSartlari(e.target.value)} placeholder="Katılım şartları..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Yarışma / Sonuç Tarihi *</label>
                  <input type="date" value={yarismaTarihi} onChange={(e) => setYarismaTarihi(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Başvuru Başlangıç Tarihi *</label>
                  <input type="date" value={basvuruBaslangicTarihi} onChange={(e) => setBasvuruBaslangicTarihi(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer" required />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Başvuru Bitiş Tarihi *</label>
                  <input type="date" value={basvuruBitisTarihi} onChange={(e) => setBasvuruBitisTarihi(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer" required />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 transition py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer">
                    <Save className="w-4 h-4" /> {editingYarismaId ? "Güncelle" : "Ekle"}
                  </button>
                  {editingYarismaId && (
                    <button type="button" onClick={resetYarismaForm} className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2.5 rounded-xl text-sm flex items-center justify-center cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-zinc-200">Aktif Yarışmalar ({yarismalar.length})</h2>
              {yarismalar.length === 0 ? <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500">Henüz eklenmiş yarışma bulunmuyor.</div> : (
                <div className="space-y-3">
                  {yarismalar.map((y) => (
                    <div key={y.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
                      <div>
                        <h3 className="text-sm font-bold text-white">{y.yarisma_ismi}</h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{y.yarisma_hakkinda}</p>
                        <span className="text-[10px] text-emerald-400 mt-1 block">Başvuru: {y.basvuru_baslangic_tarihi?.split("T")[0]} - {y.basvuru_bitis_tarihi?.split("T")[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditYarisma(y)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition text-zinc-300 cursor-pointer" title="Düzenle"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteYarisma(y.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition cursor-pointer" title="Sil"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* BAŞVURU İNCELEME LİSTESİ */}
          <div className="space-y-4 pt-6 border-t border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-200">Yarışma Başvuruları ({basvurular.length})</h2>
            {basvurular.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500">Henüz yapılmış başvuru bulunmuyor.</div>
            ) : (
              <div className="space-y-3">
                {basvurular.map((b) => (
                  <div key={b.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{b.profiles?.isim || "Üye"} {b.profiles?.soyisim || ""}</span>
                        <span className="text-xs text-zinc-500">({b.profiles?.email})</span>
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-semibold">{b.oyku_yarismalari?.yarisma_ismi}</span>
                      </div>
                      <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800 whitespace-pre-line mt-2">{b.oyku_metni}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                        b.durum === 'onaylandi' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {b.durum === 'onaylandi' ? 'Onaylandı' : 'Beklemede'}
                      </span>
                      {b.durum !== 'onaylandi' && (
                        <button onClick={() => handleBasvuruDurum(b.id, 'onaylandi')} className="p-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl transition cursor-pointer" title="Onayla">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KİTABA AİT YORUMLARI İNCELEME MODALI */}
      {selectedBookForReviews && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-300">{selectedBookForReviews.baslik}</h3>
                <p className="text-xs text-zinc-400">Kitap Yorumları ve Değerlendirmeleri</p>
              </div>
              <button 
                onClick={() => setSelectedBookForReviews(null)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {kitapYorumlari.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  Bu kitap için henüz yapılmış bir yorum bulunmuyor.
                </div>
              ) : (
                kitapYorumlari.map((rev) => (
                  <div key={rev.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {rev.profiles?.isim || "İsimsiz"} {rev.profiles?.soyisim || "Üye"}
                        </span>
                        <span className="text-xs text-zinc-500">({rev.profiles?.email})</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-emerald-400" /> {rev.puan} / 5 Yıldız
                      </div>
                      <p className="text-xs text-zinc-300 pt-1 leading-relaxed">{rev.yorum}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteReviewByAdmin(rev.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition cursor-pointer flex-shrink-0"
                      title="Yorumu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. ÜYE YÖNETİMİ */}
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