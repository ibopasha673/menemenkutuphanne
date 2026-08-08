"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  LogOut,
  BookOpen,
  Phone,
  CreditCard,
  FileText,
  Trophy,
  CheckCircle,
} from "lucide-react";

type Profile = {
  id: string;
  email: string | null;
  isim: string | null;
  soyisim: string | null;
  phone: string | null;
  tc_kimlik_no: string | null;
  yetki: string | null;
  role: string | null;
  blog_yetkisi: boolean | null;
};

type Book = {
  id: string;
  baslik: string;
  yazar: string;
  kapak_gorseli: string; // Doğru kolon adı ile güncellendi
  toplam_sayfa: number;
};

type BasvuruOzet = {
  id: string;
  durum: string;
  oyku_yarismalari: {
    yarisma_ismi: string;
    durum: string;
  } | null;
};

export default function KullaniciPaneli() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [basvurularim, setBasvurularim] = useState<BasvuruOzet[]>([]);
  const [userProgress, setUserProgress] = useState<{
    [key: string]: number;
  }>({});

  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // =====================================================
  // KULLANICI VERİLERİNİ GETİR
  // =====================================================
  useEffect(() => {
    let mounted = true;

    async function fetchUserData() {
      try {
        // -----------------------------------------------
        // AKTİF SESSION
        // -----------------------------------------------
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("KULLANICI PANELİ SESSION:", session);

        // Session yoksa giriş sayfasına gönder
        if (!session) {
          router.replace("/giris");
          return;
        }

        // -----------------------------------------------
        // PROFILE
        // -----------------------------------------------
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        console.log("KULLANICI PANELİ PROFILE:", data);
        console.log("KULLANICI PANELİ PROFILE ERROR:", error);

        if (!mounted) return;

        // Profile yoksa profil tamamlama sayfasına gönder
        if (!data) {
          router.replace("/profil-tamamla");
          return;
        }

        setProfile(data);

        // -----------------------------------------------
        // KİTAPLAR (Doğru sıralama kolonu: created_time)
        // -----------------------------------------------
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("*")
          .order("created_time", {
            ascending: false,
          });

        if (booksError) {
          console.error("Kitapları getirme hatası:", booksError);
        }

        if (mounted && booksData) {
          setBooks(booksData);
        }

        // -----------------------------------------------
        // YARIŞMA BAŞVURULARI
        // -----------------------------------------------
        const { data: bData } = await supabase
          .from("yarisma_basvurulari")
          .select("id, durum, oyku_yarismalari (yarisma_ismi, durum)")
          .eq("user_id", session.user.id);

        if (bData && mounted) {
          setBasvurularim(bData as any);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Kullanıcı verileri alınırken hata:", error);

        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchUserData();

    // -----------------------------------------------
    // AUTH DEĞİŞİKLİKLERİNİ DİNLE
    // -----------------------------------------------
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("KULLANICI PANELİ AUTH EVENT:", event);

      // Kullanıcı gerçekten çıkış yaptıysa
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/giris");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // =====================================================
  // ÇIKIŞ
  // =====================================================
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Çıkış hatası:", error);
      alert("Çıkış yapılırken bir hata oluştu.");
      return;
    }

    // Gerçekten çıkış yapıldıktan sonra giriş sayfasına git
    router.replace("/giris");
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-emerald-400 text-sm font-medium">
          Yükleniyor...
        </div>
      </div>
    );
  }

  // =====================================================
  // PROFILE YOKSA
  // =====================================================
  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-zinc-400 text-sm">
          Profil bilgileri yükleniyor...
        </div>
      </div>
    );
  }

  // =====================================================
  // SAYFA
  // =====================================================
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* =================================================
            ÜST BAŞLIK
        ================================================= */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-zinc-800 pb-6">

          <div>
            <h1 className="text-2xl font-bold text-emerald-400">
              Üye Paneli
            </h1>

            <p className="text-sm text-zinc-400 mt-1">
              Hoş geldin,{" "}
              <span className="text-zinc-200 font-medium">
                {profile.isim || "Üye"}
              </span>
              .
            </p>
          </div>

          {/* =================================================
              BUTONLAR
          ================================================= */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* YARIŞMALAR LİNKİ */}
            <Link
              href="/yarismalar"
              className="px-4 py-2 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white transition rounded-xl border border-zinc-800 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-emerald-400" />
              Yarışmalar
            </Link>

            {/* BLOGS LİNKİ */}
            <Link
              href="/blogs"
              className="px-4 py-2 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white transition rounded-xl border border-zinc-800 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Blogs
            </Link>

            {/* KİTAPLAR LİNKİ */}
            <Link
              href="/kitaplar"
              className="px-4 py-2 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white transition rounded-xl border border-zinc-800 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Kitaplar
            </Link>

            {/* ANA SAYFA */}
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white transition rounded-xl border border-zinc-800 flex items-center gap-2"
            >
              <span className="text-emerald-400">🌐</span>
              Ana Sayfa
            </Link>

            {/* ÇIKIŞ YAP */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all rounded-xl border border-red-500/20 flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>

          </div>
        </div>

        {/* =================================================
            PROFİL + YETKİLER
        ================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-7">

          {/* PROFİL */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl shadow-xl">

            <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
              Profil Bilgileri
            </h3>

            <div className="space-y-4">

              {/* İSİM */}
              <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <User className="w-4 h-4 text-emerald-500" />

                <span className="text-sm">
                  {profile.isim} {profile.soyisim}
                </span>
              </div>

              {/* TELEFON */}
              <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <Phone className="w-4 h-4 text-emerald-500" />

                <span className="text-sm">
                  {profile.phone || "-"}
                </span>
              </div>

              {/* TC */}
              <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                <CreditCard className="w-4 h-4 text-emerald-500" />

                <span className="text-sm">
                  {profile.tc_kimlik_no || "-"}
                </span>
              </div>

            </div>
          </div>

          {/* YETKİLER */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl shadow-xl">

            <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
              Yetkilerim
            </h3>

            <div className="flex flex-wrap gap-2">

              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                Rol: {profile.role || "üye"}
              </span>

              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                Blog Yazabilir:{" "}
                {profile.blog_yetkisi ? "Evet" : "Hayır"}
              </span>

            </div>
          </div>
        </div>

        {/* =================================================
            KULLANICI YARIŞMA BAŞVURULARI ÖZETİ
        ================================================= */}
        <div className="mt-8 bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" /> Yarışma Başvurularım & Durumları
            </h3>
            <Link href="/yarismalar" className="text-xs text-emerald-400 hover:underline">
              Tüm Yarışmalara Git →
            </Link>
          </div>

          {basvurularim.length === 0 ? (
            <p className="text-xs text-zinc-500 italic">Henüz katıldığınız bir öykü yarışması bulunmuyor.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {basvurularim.map((b) => (
                <div key={b.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">{b.oyku_yarismalari?.yarisma_ismi || "Yarışma"}</h4>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block">
                      Yarışma Durumu: <strong className="text-zinc-200 capitalize">{b.oyku_yarismalari?.durum || "Aktif"}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                      b.durum === 'onaylandi' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      <CheckCircle className="w-3.5 h-3.5" /> {b.durum === 'onaylandi' ? 'Onaylandı' : 'Beklemede'}
                    </span>
                    <Link
                      href="/yarismalar"
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/30 transition"
                    >
                      Düzenle
                    </Link>
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