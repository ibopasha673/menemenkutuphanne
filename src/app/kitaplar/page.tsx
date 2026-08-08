"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, CheckCircle, Star, MessageSquare, Calendar, Info, Trash2, Edit3, BookmarkPlus, XCircle } from "lucide-react";
import Link from "next/link";

export default function KitaplarPage() {
  const [aktifSekme, setAktifSekme] = useState<"guncel" | "gecmis">("guncel");
  const [guncelKitaplar, setGuncelKitaplar] = useState<any[]>([]);
  const [gecmisKitaplar, setGecmisKitaplar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("uye");

  // Yorum form state'leri
  const [aktifKitapId, setAktifKitapId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [puan, setPuan] = useState<number>(5);
  const [yorumMetni, setYorumMetni] = useState("");
  const [kitapYorumlari, setKitapYorumlari] = useState<{ [key: string]: any[] }>({});

  // Kullanıcının okuduğu kitapların kayıtları (book_id -> kayıt objesi)
  const [kullaniciKitaplari, setKullaniciKitaplari] = useState<{ [key: string]: any }>({});
  // Sayfa güncelleme input state'leri
  const [sayfaInputlari, setSayfaInputlari] = useState<{ [key: string]: number }>({});
  // Geri sayım state'i
  const [kalanSureler, setKalanSureler] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/giris");
        return;
      }
      setUserId(session.user.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileData) {
        setUserRole(profileData.role || "uye");
      }

      setLoading(false);
      veriCek(session.user.id);
      tumYorumlariCek();
    }
    checkAuthAndFetch();
  }, [router]);

  // Geri sayım sayacı mantığı
  useEffect(() => {
    const timer = setInterval(() => {
      const yeniSureler: { [key: string]: string } = {};
      guncelKitaplar.forEach(book => {
        if (book.son_tarih) {
          const hedefTarih = new Date(book.son_tarih);
          hedefTarih.setDate(hedefTarih.getDate() + 1);
          hedefTarih.setHours(0, 0, 0, 0);

          const fark = hedefTarih.getTime() - new Date().getTime();

          if (fark <= 0) {
            yeniSureler[book.id] = "Süre Doldu!";
          } else {
            const gun = Math.floor(fark / (1000 * 60 * 60 * 24));
            const saat = Math.floor((fark % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const dakika = Math.floor((fark % (1000 * 60 * 60)) / (1000 * 60));
            const saniye = Math.floor((fark % (1000 * 60)) / 1000);
            yeniSureler[book.id] = `${gun}g ${saat}s ${dakika}d ${saniye}s`;
          }
        } else {
          yeniSureler[book.id] = "Süre Belirtilmemiş";
        }
      });
      setKalanSureler(yeniSureler);
    }, 1000);

    return () => clearInterval(timer);
  }, [guncelKitaplar]);

  async function veriCek(currentUserId?: string) {
    const uid = currentUserId || userId;

    // Geçmişte okunanlar
    const { data: gecmisData } = await supabase
      .from("books")
      .select("*")
      .eq("durum", false);
    if (gecmisData) setGecmisKitaplar(gecmisData);

    // Güncel kitaplar (Admin'in aktif ettikleri)
    const { data: guncelData } = await supabase
      .from("books")
      .select("*")
      .eq("durum", true);
    
    if (guncelData) {
      setGuncelKitaplar(guncelData);

      if (uid) {
        const { data: userProgress } = await supabase
          .from("okunmakta_olan_kitaplar")
          .select("*")
          .eq("user_id", uid);

        if (userProgress) {
          const map: { [key: string]: any } = {};
          const sayfalar: { [key: string]: number } = {};
          userProgress.forEach(item => {
            map[item.book_id] = item;
            sayfalar[item.book_id] = item.okunan_sayfa_sayisi || 0;
          });
          setKullaniciKitaplari(map);
          setSayfaInputlari(sayfalar);
        }
      }
    }
  }

  // Kitabı seçme (Okunmakta olanlara ekleme)
  const handleKitapSec = async (bookId: string) => {
    if (!userId) return;

    const { error } = await supabase.from("okunmakta_olan_kitaplar").insert([
      {
        book_id: bookId,
        user_id: userId,
        okunan_sayfa_sayisi: 0,
      }
    ]);

    if (error) {
      alert("Kitap seçilirken hata oluştu: " + error.message);
    } else {
      alert("Kitap seçildi! Artık sayfa güncelleyebilirsiniz.");
      veriCek();
    }
  };

  // Pess Et (Kitabı bırak / tablodan sil)
  const handlePessEt = async (recordId: string) => {
    if (!confirm("Bu kitabı okumaktan vazgeçmek (pess etmek) istediğinize emin misiniz?")) return;

    const { error } = await supabase
      .from("okunmakta_olan_kitaplar")
      .delete()
      .eq("id", recordId);

    if (error) {
      alert("İşlem sırasında hata oluştu: " + error.message);
    } else {
      alert("Kitap listeden kaldırıldı.");
      veriCek();
    }
  };

  // Sayfa güncelleme ve toplam sayfa kontrolü
  const handleSayfaGuncelle = async (book: any, userRecordId: string) => {
    const girilenSayfa = Number(sayfaInputlari[book.id]) || 0;
    const toplamSayfa = book.toplam_sayfa || 99999;

    if (girilenSayfa > toplamSayfa) {
      alert(`Okunan sayfa miktarı toplam sayfa sayısından (${toplamSayfa}) büyük olamaz!`);
      return;
    }

    const { error } = await supabase
      .from("okunmakta_olan_kitaplar")
      .update({ okunan_sayfa_sayisi: girilenSayfa })
      .eq("id", userRecordId);

    if (error) {
      alert("Sayfa güncellenirken hata oluştu: " + error.message);
    } else {
      alert("Okunan sayfa başarıyla güncellendi!");
      if (girilenSayfa >= toplamSayfa) {
        alert("Tebrikler, bu kitabı tamamen bitirdiniz!");
      }
      veriCek();
    }
  };

  async function tumYorumlariCek() {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, profiles:user_id (isim, soyisim)");
    
    if (!error && data) {
      const grouped: { [key: string]: any[] } = {};
      data.forEach((rev) => {
        if (!grouped[rev.book_id]) grouped[rev.book_id] = [];
        grouped[rev.book_id].push(rev);
      });
      setKitapYorumlari(grouped);
    }
  }

  const handleYorumKaydet = async (bookId: string) => {
    if (!userId) return;

    if (isEditing && editingReviewId) {
      const { error } = await supabase
        .from("reviews")
        .update({ puan: Number(puan), yorum: yorumMetni })
        .eq("id", editingReviewId);

      if (error) {
        alert("Yorum güncellenirken hata oluştu: " + error.message);
      } else {
        alert("Yorumunuz başarıyla güncellendi!");
        resetForm();
        tumYorumlariCek();
      }
    } else {
      const existingReviews = kitapYorumlari[bookId] || [];
      const userAlreadyReviewed = existingReviews.some(r => r.user_id === userId);

      if (userAlreadyReviewed) {
        alert("Bu kitap için zaten bir yorumunuz var. Mevcut yorumunuzu düzenleyebilirsiniz.");
        return;
      }

      const { error } = await supabase.from("reviews").insert([
        {
          book_id: bookId,
          user_id: userId,
          puan: Number(puan),
          yorum: yorumMetni,
        },
      ]);

      if (error) {
        alert("Yorum gönderilirken hata oluştu: " + error.message);
      } else {
        alert("Yorumunuz başarıyla eklendi!");
        resetForm();
        tumYorumlariCek();
      }
    }
  };

  const handleYorumSil = async (reviewId: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) {
      alert("Yorum silinirken hata oluştu: " + error.message);
    } else {
      alert("Yorum silindi.");
      tumYorumlariCek();
    }
  };

  const handleDuzenleTikla = (review: any) => {
    setAktifKitapId(review.book_id);
    setIsEditing(true);
    setEditingReviewId(review.id);
    setPuan(review.puan);
    setYorumMetni(review.yorum);
  };

  const resetForm = () => {
    setAktifKitapId(null);
    setIsEditing(false);
    setEditingReviewId(null);
    setYorumMetni("");
    setPuan(5);
  };

  const getOrtalamaPuan = (bookId: string) => {
    const yorumlar = kitapYorumlari[bookId];
    if (!yorumlar || yorumlar.length === 0) return "Henüz Puan Yok";
    const toplam = yorumlar.reduce((acc, curr) => acc + curr.puan, 0);
    return (toplam / yorumlar.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-emerald-400">Yönlendiriliyor...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white overflow-hidden pb-20">
      <div className="fixed inset-0 z-0">
        <img
          src="/logomenemenkutuphaen.png"
          alt="Background"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/90 to-zinc-950" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-8">
        <Link href="/" className="text-zinc-400 hover:text-emerald-400 mb-6 inline-flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </Link>
        
        <h1 className="text-4xl font-extrabold mb-8 text-white flex items-center gap-3 drop-shadow-lg">
          <BookOpen className="text-emerald-400" /> Kulüp Kitaplığı & Değerlendirmeler
        </h1>
        
        <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setAktifSekme("guncel")}
            className={`px-6 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              aktifSekme === "guncel" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" /> Okunmakta Olanlar
          </button>
          <button
            onClick={() => setAktifSekme("gecmis")}
            className={`px-6 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              aktifSekme === "gecmis" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" /> Geçmişte Okunanlar (Arşiv)
          </button>
        </div>

        {/* LİSTELEME */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(aktifSekme === "guncel" ? guncelKitaplar : gecmisKitaplar).map((book: any) => {
            if (!book) return null;
            const realBookId = book.id;
            const ortalama = getOrtalamaPuan(realBookId);
            const kitapYorumlariListesi = kitapYorumlari[realBookId] || [];
            
            const userReview = kitapYorumlariListesi.find((r: any) => r.user_id === userId);
            const kullaniciSecimi = kullaniciKitaplari[book.id]; // Kullanıcı bu kitabı seçti mi?

            return (
              <div key={book.id || Math.random()} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex gap-5 items-start">
                    {book.kapak_gorseli ? (
                      <img
                        src={book.kapak_gorseli}
                        alt={book.baslik || "Kitap Kapağı"}
                        className="w-24 h-36 flex-shrink-0 rounded-xl object-cover border border-zinc-800 shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-36 flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-800/50 flex items-center justify-center text-[10px] text-zinc-500 text-center">Görsel Yok</div>
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="text-xl font-bold text-emerald-300">{book.baslik}</h3>
                          <p className="text-zinc-400 text-sm">{book.yazar}</p>
                          {book.ay && book.yil && (
                            <span className="inline-block text-[11px] bg-zinc-800/80 text-emerald-400 px-2 py-0.5 rounded-md mt-1 border border-zinc-700/50">
                              {book.ay} {book.yil}
                            </span>
                          )}
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-emerald-400 font-bold text-sm flex-shrink-0">
                          <Star className="w-4 h-4 fill-emerald-400" />
                          <span>{ortalama}</span>
                        </div>
                      </div>

                      {/* GÜNCEL SEKMEDEYSE: HER ZAMAN GERİ SAYIM + SEÇME VEYA GÜNCELLEME/PESS ET */}
                      {aktifSekme === "guncel" && (
                        <div className="mt-3 space-y-3">
                          {/* Geri Sayım Kutusu (Her zaman görünür) */}
                          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <Clock className="w-3.5 h-3.5" /> Geri Sayım:
                            </span>
                            <span className="font-mono text-emerald-300">
                              {kalanSureler[book.id] || "Hesaplanıyor..."}
                            </span>
                          </div>

                          {!kullaniciSecimi ? (
                            // Kitap seçilmediyse sadece "Bu Kitabı Okuyorum Olarak Seç" butonu görünür
                            <button
                              onClick={() => handleKitapSec(book.id)}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" /> Bu Kitabı Okuyorum Olarak Seç
                            </button>
                          ) : (
                            // Kitap seçildiyse sayfa güncelleme alanı ve Pess Et butonu görünür
                            <div className="bg-zinc-950/80 p-3 rounded-xl border border-emerald-500/30 space-y-2">
                              <div className="flex justify-between text-[11px] text-zinc-400">
                                <span>Toplam Sayfa: {book.toplam_sayfa || "?"}</span>
                                <span className="text-emerald-400 font-medium">Okunuyor</span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  max={book.toplam_sayfa}
                                  min={0}
                                  value={sayfaInputlari[book.id] ?? kullaniciSecimi.okunan_sayfa_sayisi}
                                  onChange={(e) => setSayfaInputlari({ ...sayfaInputlari, [book.id]: Number(e.target.value) })}
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                                  placeholder="Sayfa gir"
                                />
                                <button
                                  onClick={() => handleSayfaGuncelle(book, kullaniciSecimi.id)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer flex-shrink-0"
                                >
                                  Güncelle
                                </button>
                              </div>

                              <button
                                onClick={() => handlePessEt(kullaniciSecimi.id)}
                                className="w-full mt-1 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Pess Et (Bırak)
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* KISA AÇIKLAMA VE TOPLANTI BİLGİLERİ */}
                  {(book.kisa_aciklama || book.toplanti_bilgileri) && (
                    <div className="mt-4 space-y-2 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/60 text-xs">
                      {book.kisa_aciklama && (
                        <p className="text-zinc-300 flex items-start gap-2 leading-relaxed">
                          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{book.kisa_aciklama}</span>
                        </p>
                      )}
                      {book.toplanti_bilgileri && (
                        <p className="text-zinc-400 flex items-center gap-2 pt-1 border-t border-zinc-800/40">
                          <Calendar className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="font-medium text-zinc-300">Toplantı:</span> {book.toplanti_bilgileri}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Yorumlar Listesi */}
                <div className="mt-6 space-y-3 max-h-40 overflow-y-auto pr-2">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Üye Yorumları ({kitapYorumlariListesi.length})
                  </h4>
                  {kitapYorumlariListesi.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
                  ) : (
                    kitapYorumlariListesi.map((rev: any) => {
                      const benimYorumum = rev.user_id === userId;
                      const isAdmin = userRole === "admin";

                      return (
                        <div key={rev.id} className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-xs relative group">
                          <div className="flex justify-between font-semibold text-zinc-300 mb-1">
                            <span>{rev.profiles?.isim || "Üye"} {rev.profiles?.soyisim || ""}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 flex items-center gap-0.5">⭐ {rev.puan}/5</span>
                              
                              {(benimYorumum || isAdmin) && (
                                <div className="flex items-center gap-1">
                                  {benimYorumum && (
                                    <button
                                      onClick={() => handleDuzenleTikla(rev)}
                                      className="text-zinc-400 hover:text-emerald-400 transition p-1 cursor-pointer"
                                      title="Yorumumu Düzenle"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleYorumSil(rev.id)}
                                    className="text-zinc-400 hover:text-red-400 transition p-1 cursor-pointer"
                                    title="Yorumu Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-zinc-400">{rev.yorum}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Yorum Yap / Düzenle Form Alanı */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  {aktifKitapId === realBookId ? (
                    <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-300 font-medium">
                          {isEditing ? "Yorumunu Düzenle:" : "Puanınız (1-5):"}
                        </span>
                        <select 
                          value={puan} 
                          onChange={(e) => setPuan(Number(e.target.value))}
                          className="bg-zinc-900 border border-zinc-700 text-emerald-400 text-xs rounded-lg px-2 py-1 outline-none"
                        >
                          <option value="5">5 Yıldız - Mükemmel</option>
                          <option value="4">4 Yıldız - Çok İyi</option>
                          <option value="3">3 Yıldız - Ortalama</option>
                          <option value="2">2 Yıldız - Zayıf</option>
                          <option value="1">1 Yıldız - Çok Kötü</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Kitap hakkındaki düşüncelerini yaz..."
                        value={yorumMetni}
                        onChange={(e) => setYorumMetni(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={resetForm}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
                        >
                          İptal
                        </button>
                        <button 
                          onClick={() => handleYorumKaydet(realBookId)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          {isEditing ? "Güncelle" : "Gönder"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    !userReview ? (
                      <button
                        onClick={() => { setAktifKitapId(realBookId); setIsEditing(false); setPuan(5); setYorumMetni(""); }}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Kitaba Yorum Yap & Puan Ver
                      </button>
                    ) : (
                      <p className="text-xs text-zinc-500 text-center italic">Bu kitap için zaten bir değerlendirmeniz bulunuyor.</p>
                    )
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}