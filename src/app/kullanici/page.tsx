"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { User, LogOut, Globe, BookOpen, Phone, CreditCard } from "lucide-react";

export default function KullaniciPaneli() {
  const [profile, setProfile] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/giris");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error || !data) {
        router.push("/profil-tamamla");
      } else {
        setProfile(data);
      }

      const { data: booksData } = await supabase.from("books").select("*");
      if (booksData) {
        setBooks(booksData);
      }

      setLoading(false);
    }
    fetchUserData();
  }, [router]);

  const handleProgressChange = (bookId: string, value: number, maxPage: number) => {
    if (value > maxPage) {
      alert(`Okuduğunuz sayfa toplam sayfa sayısından (${maxPage}) fazla olamaz!`);
      return;
    }
    setUserProgress((prev) => ({ ...prev, [bookId]: value }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/giris");
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="text-xs md:text-sm font-medium text-emerald-300 bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2 shadow-md">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Merhaba, {profile?.isim || "Üye"} {profile?.soyisim || ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm flex items-center gap-2 transition">
              <Globe className="w-4 h-4 text-emerald-400" /> Ana Sayfa
            </a>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm flex items-center gap-2 cursor-pointer transition">
              <LogOut className="w-4 h-4" /> Çıkış Yap
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl shadow-xl">
             <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Profil Bilgileri</h3>
             <div className="space-y-4">
                <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <User className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">{profile?.isim} {profile?.soyisim}</span>
                </div>
                <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">{profile?.phone}</span>
                </div>
                <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">{profile?.tc_kimlik_no}</span>
                </div>
             </div>
          </div>
          
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl shadow-xl">
             <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Yetkilerim</h3>
             <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">Rol: {profile?.role}</span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">Blog Yazabilir: {profile?.blog_yetkisi ? "Evet" : "Hayır"}</span>
             </div>
          </div>
        </div>

        {/* OKUNMUŞ KİTAPLAR VE SAYFA TAKİBİ */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Kulüp Kitaplığı & Okuma Takibi
          </h3>

          {books.length === 0 ? (
            <p className="text-xs text-zinc-500">Henüz eklenmiş kulüp kitabı bulunmuyor.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {books.map((book) => {
                const currentVal = userProgress[book.id] ?? 0;
                return (
                  <div key={book.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex gap-4 items-center">
                    <img src={book.gorsel_url} alt={book.baslik} className="w-16 h-20 rounded-xl object-cover border border-zinc-800 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{book.baslik}</h4>
                        <p className="text-xs text-zinc-400">{book.yazar}</p>
                        <span className="text-[11px] text-emerald-400">Toplam Sayfa: {book.toplam_sayfa}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">Okunan:</span>
                        <input
                          type="number"
                          min={0}
                          max={book.toplam_sayfa}
                          value={currentVal}
                          onChange={(e) => handleProgressChange(book.id, Number(e.target.value), book.toplam_sayfa)}
                          className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-xs text-zinc-500">/ {book.toplam_sayfa}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}