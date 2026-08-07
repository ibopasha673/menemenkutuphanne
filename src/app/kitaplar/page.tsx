"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { ArrowLeft, BookOpen, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function KitaplarPage() {
  const [aktifSekme, setAktifSekme] = useState<"guncel" | "gecmis">("guncel");
  const [guncelKitaplar, setGuncelKitaplar] = useState<any[]>([]);
  const [gecmisKitaplar, setGecmisKitaplar] = useState<any[]>([]);

  useEffect(() => {
    veriCek();
  }, [aktifSekme]);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-white mb-6 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </Link>
        
        <h1 className="text-3xl font-bold mb-8 text-emerald-400 flex items-center gap-3">
          <BookOpen /> Kulüp Kitaplığı
        </h1>
        
        <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setAktifSekme("guncel")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              aktifSekme === "guncel" ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" /> Okunmakta Olanlar
          </button>
          <button
            onClick={() => setAktifSekme("gecmis")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              aktifSekme === "gecmis" ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" /> Geçmişte Okunanlar
          </button>
        </div>

        {aktifSekme === "guncel" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guncelKitaplar.map((item: any) => (
              <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-emerald-300">{item.books?.baslik}</h3>
                <p className="text-zinc-400 text-sm">{item.books?.yazar}</p>
                <div className="mt-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                  <span>Sayfa: <strong>{item.okunan_sayfa_sayisi}</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gecmisKitaplar.map((book: any) => (
              <div key={book.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                <h3 className="text-xl font-bold">{book.baslik}</h3>
                <p className="text-zinc-400 text-sm mt-1">{book.yazar}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}