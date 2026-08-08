"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, CheckCircle, Star, MessageSquare, Calendar, Info } from "lucide-react";
import Link from "next/link";

export default function KitaplarPage() {
  const [aktifSekme, setAktifSekme] = useState<"guncel" | "gecmis">("guncel");
  const [guncelKitaplar, setGuncelKitaplar] = useState<any[]>([]);
  const [gecmisKitaplar, setGecmisKitaplar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Yorum form state'leri
  const [aktifKitapId, setAktifKitapId] = useState<string | null>(null);
  const [puan, setPuan] = useState<number>(5);
  const [yorumMetni, setYorumMetni] = useState("");
  const [kitapYorumlari, setKitapYorumlari] = useState<{ [key: string]: any[] }>({});

  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/giris");
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
      veriCek();
      tumYorumlariCek();
    }
    checkAuthAndFetch();
  }, [router]);

  async function veriCek() {
    const { data: bData } = await supabase.from("books").select("*");
    if (bData) setGecmisKitaplar(bData);

    const { data: gData } = await supabase
      .from("okunmakta_olan_kitaplar")
      .select(`*, books:book_id (*)`);
    if (gData) setGuncelKitaplar(gData);
  }

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

  const handleYorumGonder = async (bookId: string) => {
    if (!userId) return;

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
      setYorumMetni("");
      setAktifKitapId(null);
      tumYorumlariCek();
    }
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
          {(aktifSekme === "guncel" 
            ? guncelKitaplar.map(item => ({ ...item.books, rowId: item.id })) 
            : gecmisKitaplar
          ).map((book: any) => {
            if (!book) return null;
            const realBookId = book.id;
            const ortalama = getOrtalamaPuan(realBookId);
            const kitapYorumlariListesi = kitapYorumlari[realBookId] || [];

            return (
              <div key={book.id || Math.random()} className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex gap-5 items-start">
                    {/* STANDART GÖRSEL ETİKETİ (ADMIN PANELİYLE AYNI MANTIK) */}
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
                    kitapYorumlariListesi.map((rev: any) => (
                      <div key={rev.id} className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-xs">
                        <div className="flex justify-between font-semibold text-zinc-300 mb-1">
                          <span>{rev.profiles?.isim || "Üye"} {rev.profiles?.soyisim || ""}</span>
                          <span className="text-emerald-400 flex items-center gap-0.5">⭐ {rev.puan}/5</span>
                        </div>
                        <p className="text-zinc-400">{rev.yorum}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Yorum Yap Butonu / Formu */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  {aktifKitapId === realBookId ? (
                    <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-300 font-medium">Puanınız (1-5):</span>
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
                          onClick={() => setAktifKitapId(null)}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
                        >
                          İptal
                        </button>
                        <button 
                          onClick={() => handleYorumGonder(realBookId)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          Gönder
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAktifKitapId(realBookId); setPuan(5); setYorumMetni(""); }}
                      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Kitaba Yorum Yap & Puan Ver
                    </button>
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