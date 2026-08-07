"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function KitaplarPage() {
  const [aktifSekme, setAktifSekme] = useState<"guncel" | "gecmis">("guncel");
  const [guncelKitaplar, setGuncelKitaplar] = useState<any[]>([]);
  const [gecmisKitaplar, setGecmisKitaplar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/giris");
        return;
      }
      setLoading(false);
      veriCek();
    }
    checkAuthAndFetch();
  }, [router]);

  async function veriCek() {
    if (aktifSekme === "guncel") {
      const { data, error } = await supabase
        .from("okunmakta_olan_kitaplar")
        .select(`*, books:book_id (*)`);
      if (!error && data) setGuncelKitaplar(data);
    } else {
      const { data, error } = await supabase.from("books").select("*");
      if (!error && data) setGecmisKitaplar(data);
    }
  }

  useEffect(() => {
    if (!loading) veriCek();
  }, [aktifSekme, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-emerald-400">Yönlendiriliyor...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* ARKA PLAN SLIDER / GÖRSELİ */}
      <div className="fixed inset-0 z-0">
        <img
          src="/logomenemenkutuphaen.png" // Veya kullanmak istediğin özel bir kitap arka planı
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/90 to-zinc-950" />
      </div>

      {/* İÇERİK */}
      <div className="relative z-10 max-w-6xl mx-auto p-8">
        <Link href="/" className="text-zinc-400 hover:text-emerald-400 mb-6 inline-flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </Link>
        
        <h1 className="text-4xl font-extrabold mb-8 text-white flex items-center gap-3 drop-shadow-lg">
          <BookOpen className="text-emerald-400" /> Kulüp Kitaplığı
        </h1>
        
        <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setAktifSekme("guncel")}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              aktifSekme === "guncel" 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" /> Okunmakta Olanlar
          </button>
          <button
            onClick={() => setAktifSekme("gecmis")}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              aktifSekme === "gecmis" 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" /> Geçmişte Okunanlar
          </button>
        </div>

        {aktifSekme === "guncel" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guncelKitaplar.length > 0 ? guncelKitaplar.map((item: any) => (
              <div key={item.id} className="bg-zinc-900/70 backdrop-blur-md border border-zinc-700/50 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
                <h3 className="text-xl font-bold text-emerald-300">{item.books?.baslik}</h3>
                <p className="text-zinc-400 text-sm">{item.books?.yazar}</p>
                <div className="mt-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <span>Okunan Sayfa: <strong className="text-emerald-400">{item.okunan_sayfa_sayisi}</strong></span>
                </div>
              </div>
            )) : <p className="text-zinc-500">Şu an okunan kitap bulunmuyor.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gecmisKitaplar.length > 0 ? gecmisKitaplar.map((book: any) => (
              <div key={book.id} className="bg-zinc-900/70 backdrop-blur-md border border-zinc-700/50 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
                <h3 className="text-xl font-bold text-white">{book.baslik}</h3>
                <p className="text-zinc-400 text-sm mt-1">{book.yazar}</p>
              </div>
            )) : <p className="text-zinc-500">Arşivde kitap bulunmuyor.</p>}
          </div>
        )}
      </div>
    </div>
  );
}