"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { BookOpen, LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SliderItem = {
  id: string;
  gorsel_url: string;
  slogan: string | null;
};

type BookItem = {
  id: string;
  baslik: string;
  yazar: string;
  gorsel_url: string;
  toplam_sayfa: number;
};

type UserProfile = {
  isim: string | null;
  soyisim: string | null;
};

export default function Home() {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();

  // =========================================================
  // KULLANICIYI BUL
  // =========================================================
  const loadUser = async () => {
    try {
      // Önce gerçek kullanıcıyı Auth üzerinden alıyoruz.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("ANA SAYFA AUTH USER:", user);
      console.log("ANA SAYFA AUTH ERROR:", userError);

      // Kullanıcı giriş yapmamışsa
      if (!user) {
        console.log("ANA SAYFA: Kullanıcı giriş yapmamış.");
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }

      console.log("ANA SAYFA: Giriş yapılmış kullanıcı:", user.id);

      // Önce metadata'dan geçici isim al.
      // Böylece profiles sorgusu gecikse bile
      // kullanıcı giriş yapmış olarak görünür.
      const metadataProfile: UserProfile = {
        isim:
          user.user_metadata?.isim ||
          user.user_metadata?.first_name ||
          user.user_metadata?.full_name?.split(" ")[0] ||
          null,

        soyisim:
          user.user_metadata?.soyisim ||
          user.user_metadata?.last_name ||
          (() => {
            const fullName = user.user_metadata?.full_name;

            if (!fullName) return null;

            const parts = fullName.trim().split(" ");

            if (parts.length <= 1) return null;

            return parts.slice(1).join(" ");
          })() ||
          null,
      };

      // Önce kullanıcıyı giriş yapmış kabul ediyoruz.
      setUserProfile(metadataProfile);

      // Sonra profiles tablosundan gerçek bilgileri çekiyoruz.
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("isim, soyisim")
        .eq("id", user.id)
        .maybeSingle();

      console.log("ANA SAYFA PROFILE:", profileData);
      console.log("ANA SAYFA PROFILE ERROR:", profileError);

      // Profiles tablosundan bilgi geldiyse onu kullan.
      if (profileData) {
        setUserProfile({
          isim: profileData.isim,
          soyisim: profileData.soyisim,
        });
      }

      setAuthLoading(false);
    } catch (error) {
      console.error("ANA SAYFA KULLANICI HATASI:", error);

      // Burada kullanıcıyı otomatik olarak misafir yapmıyoruz.
      // getUser hata verirse sadece loading'i kapatıyoruz.
      setAuthLoading(false);
    }
  };

  // =========================================================
  // SAYFA AÇILDIĞINDA
  // =========================================================
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      await loadUser();

      // =====================================================
      // SLIDERLAR
      // =====================================================
      const { data: sliderData, error: sliderError } = await supabase
        .from("sliders")
        .select("*")
        .order("sira", { ascending: true });

      console.log("SLIDER DATA:", sliderData);
      console.log("SLIDER ERROR:", sliderError);

      if (sliderData && sliderData.length > 0) {
        setSliders(sliderData);
      } else {
        setSliders([
          {
            id: "1",
            gorsel_url: "/logomenemenkutuphaen.png",
            slogan:
              "Ekşi Kitap Kulübü İzmir - Kitap dolu sohbetler burada başlar.",
          },
        ]);
      }

      // =====================================================
      // KİTAPLAR
      // =====================================================
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .order("olusturma_tarihi", { ascending: false });

      console.log("BOOK DATA:", bookData);
      console.log("BOOK ERROR:", bookError);

      if (bookData) {
        setBooks(bookData);
      }
    };

    initialize();

    // =======================================================
    // AUTH DEĞİŞİKLİĞİNİ DİNLE
    // =======================================================
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AUTH EVENT:", event);
      console.log("AUTH SESSION:", session);

      if (session?.user) {
        // Kullanıcı giriş yaptıysa burada direkt
        // giriş yapılmış olarak işaretliyoruz.
        const user = session.user;

        const metadataProfile: UserProfile = {
          isim:
            user.user_metadata?.isim ||
            user.user_metadata?.first_name ||
            user.user_metadata?.full_name?.split(" ")[0] ||
            null,

          soyisim:
            user.user_metadata?.soyisim ||
            user.user_metadata?.last_name ||
            (() => {
              const fullName = user.user_metadata?.full_name;

              if (!fullName) return null;

              const parts = fullName.trim().split(" ");

              if (parts.length <= 1) return null;

              return parts.slice(1).join(" ");
            })() ||
            null,
        };

        setUserProfile(metadataProfile);
        setAuthLoading(false);

        // Profiles tablosundan güncel bilgiyi ayrıca çek.
        setTimeout(() => {
          loadUser();
        }, 0);
      } else {
        console.log("AUTH: Kullanıcı çıkış yapmış.");

        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // =========================================================
  // SLIDER OTOMATİK GEÇİŞ
  // =========================================================
  useEffect(() => {
    if (sliders.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        return (prevIndex + 1) % sliders.length;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [sliders.length]);

  // =========================================================
  // ÇIKIŞ YAP
  // =========================================================
  const handleLogout = async () => {
    console.log("ÇIKIŞ YAPILIYOR...");

    await supabase.auth.signOut();

    setUserProfile(null);

    router.push("/giris");
    router.refresh();
  };

  // =========================================================
  // İSİM GÖSTER
  // =========================================================
  const getUserName = () => {
    if (!userProfile) return "Üye";

    const isim = userProfile.isim || "";
    const soyisim = userProfile.soyisim || "";

    const fullName = `${isim} ${soyisim}`.trim();

    return fullName || "Üye";
  };

  // =========================================================
  // SAYFA
  // =========================================================
  return (
    <div className="relative w-full min-h-[120vh] flex flex-col bg-zinc-950 text-white overflow-x-hidden">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="absolute top-0 left-0 w-full z-30 flex justify-between items-center px-8 py-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* LOGO */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-900/60 flex items-center justify-center">
              <img
                src="/logomenemenkutuphaen.png"
                alt="Logo"
                className="w-full h-full rounded-full object-cover animate-logo-spin"
              />
            </div>
          </Link>

          <div>
            <h1 className="font-extrabold text-xl tracking-wider text-white drop-shadow-md">
              Ekşi Kitap Kulübü
            </h1>

            <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              İzmir
            </span>
          </div>
        </div>

        {/* =================================================
            SAĞ ÜST KULLANICI ALANI
        ================================================== */}
        <div className="flex items-center gap-4">
          <Link
            href="/kitaplar"
            className="text-xs md:text-sm font-medium text-zinc-300 hover:text-emerald-400 transition bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2 shadow-md"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />

            <span>Kitaplar</span>
          </Link>

          {authLoading ? (
            // Kullanıcı kontrol edilirken boş bırakıyoruz.
            <div className="w-32 h-10 rounded-xl bg-zinc-900/50 animate-pulse" />
          ) : userProfile ? (
            // =================================================
            // GİRİŞ YAPMIŞ KULLANICI
            // =================================================
            <div className="flex items-center gap-3">
              <Link
                href="/kullanici"
                className="text-xs md:text-sm font-medium text-emerald-300 hover:text-emerald-400 transition bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2 shadow-md"
              >
                <UserIcon className="w-4 h-4 text-emerald-400" />

                <span>Merhaba, {getUserName()}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all rounded-xl border border-red-500/20 flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <LogOut className="w-4 h-4" />

                Çıkış Yap
              </button>
            </div>
          ) : (
            // =================================================
            // MİSAFİR
            // =================================================
            <Link
              href="/giris"
              className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 transition-all rounded-xl text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/20"
            >
              Giriş Yap / Üye Ol
            </Link>
          )}
        </div>
      </header>

      {/* =====================================================
          SLIDER
      ====================================================== */}
      <main className="relative w-full h-screen flex items-center justify-center">
        {sliders.length > 0 && (
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 z-10" />

            <img
              src={sliders[currentIndex].gorsel_url}
              alt="Slider Görseli"
              className="w-full h-full object-cover scale-105 transition-transform duration-1000"
            />

            {/* SLOGAN */}
            {sliders[currentIndex].slogan && (
              <div className="absolute bottom-24 left-10 z-20 max-w-lg bg-black/60 backdrop-blur-md p-6 rounded-2xl border-l-4 border-emerald-400 shadow-2xl">
                <p className="text-lg md:text-xl font-light italic text-emerald-100 tracking-wide drop-shadow">
                  "{sliders[currentIndex].slogan}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* SLIDER NOKTALARI */}
        <div className="absolute bottom-24 right-10 z-30 flex gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          {sliders.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                currentIndex === index
                  ? "bg-emerald-400 w-8"
                  : "bg-white/40 w-2.5"
              }`}
            />
          ))}
        </div>
      </main>

      {/* =====================================================
          KİTAP ARŞİVİ
      ====================================================== */}
      <section className="w-full py-16 px-8 bg-zinc-950 border-t border-zinc-900 z-20">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-emerald-400 flex items-center justify-center gap-2">
              <BookOpen className="w-6 h-6" />

              Kulüp Arşivi: Geçmişte Okunan Kitaplar
            </h2>

            <p className="text-xs text-zinc-400">
              Ekşi Kitap Kulübü İzmir olarak şimdiye kadar birlikte okuduğumuz
              eserler.
            </p>
          </div>

          {books.length === 0 ? (
            <div className="text-center text-zinc-500 text-sm py-8">
              Henüz arşivde kitap bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-lg hover:border-emerald-500/50 transition"
                >
                  <img
                    src={book.gorsel_url}
                    alt={book.baslik}
                    className="w-28 h-36 rounded-xl object-cover mb-3 border border-zinc-800 shadow-md"
                  />

                  <h3 className="text-sm font-bold text-white line-clamp-1">
                    {book.baslik}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                    {book.yazar}
                  </p>

                  <span className="text-[11px] font-medium text-emerald-400 mt-2 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {book.toplam_sayfa} Sayfa
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="w-full py-6 bg-black/90 backdrop-blur-md border-t border-white/10 flex flex-col items-center justify-center text-xs text-zinc-400 gap-1.5 z-30 mt-auto">
        <p className="font-medium text-zinc-300">
          Ekşi Kitap Kulübü İzmir & 2026 Tüm Hakları Saklıdır.
        </p>

        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <a
            href="#"
            className="hover:text-emerald-400 transition-colors"
          >
            KVKK Aydınlatma Metni
          </a>

          <span>•</span>

          <a
            href="#"
            className="hover:text-emerald-400 transition-colors"
          >
            Gizlilik Politikası
          </a>

          <span>•</span>

          <a
            href="#"
            className="hover:text-emerald-400 transition-colors"
          >
            Çerez Politikası
          </a>

          <span>•</span>

          <Link
            href="/admin-giris"
            className="hover:text-emerald-400 transition-colors font-semibold text-zinc-400"
          >
            Yönetici Paneli
          </Link>
        </div>
      </footer>
    </div>
  );
}