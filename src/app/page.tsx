"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { BookOpen, LogOut, User as UserIcon, FileText, Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SliderItem = {
  id: string;
  gorsel_url: string;
  slogan: string | null;
};

type UserProfile = {
  isim: string | null;
  soyisim: string | null;
};

type DuyuruItem = {
  id: string;
  duyuru_adi: string;
  duyuru_icerigi: string;
  yayimlanma_tarihi: string;
};

export default function Home() {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [duyurular, setDuyurular] = useState<DuyuruItem[]>([]);
  const [currentDuyuruIndex, setCurrentDuyuruIndex] = useState(0);
  const [isDuyuruModalOpen, setIsDuyuruModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();

  // =========================================================
  // KULLANICIYI BUL
  // =========================================================
  const loadUser = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("ANA SAYFA AUTH USER:", user);
      console.log("ANA SAYFA AUTH ERROR:", userError);

      if (!user) {
        console.log("ANA SAYFA: Kullanıcı giriş yapmamış.");
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }

      console.log("ANA SAYFA: Giriş yapılmış kullanıcı:", user.id);

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

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("isim, soyisim")
        .eq("id", user.id)
        .maybeSingle();

      console.log("ANA SAYFA PROFILE:", profileData);
      console.log("ANA SAYFA PROFILE ERROR:", profileError);

      if (profileData) {
        setUserProfile({
          isim: profileData.isim,
          soyisim: profileData.soyisim,
        });
      }

      setAuthLoading(false);
    } catch (error) {
      console.error("ANA SAYFA KULLANICI HATASI:", error);
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
      // DUYURULAR
      // =====================================================
      const { data: duyuruData } = await supabase
        .from("duyurular")
        .select("*")
        .order("created_time", { ascending: false });
      
      if (duyuruData) setDuyurular(duyuruData);
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
  // SAĞ ALT DUYURU OTOMATİK GEÇİŞ (10 Saniye)
  // =========================================================
  useEffect(() => {
    if (duyurular.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentDuyuruIndex((prevIndex) => (prevIndex + 1) % duyurular.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [duyurular.length]);

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
    <div className="relative w-full min-h-screen flex flex-col bg-zinc-950 text-white overflow-x-hidden">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="absolute top-0 left-0 w-full z-30 flex flex-col md:flex-row justify-between items-center px-4 md:px-8 py-4 md:py-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent gap-4">
        {/* LOGO */}
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-start">
          <Link href="/" className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-900/60 flex items-center justify-center flex-shrink-0">
              <img
                src="/logomenemenkutuphaen.png"
                alt="Logo"
                className="w-full h-full rounded-full object-cover animate-logo-spin"
              />
            </div>

            <div>
              <h1 className="font-extrabold text-lg md:text-xl tracking-wider text-white drop-shadow-md">
                Ekşi Kitap Kulübü
              </h1>

              <span className="text-[10px] md:text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                İzmir
              </span>
            </div>
          </Link>
        </div>

        {/* =================================================
            SAĞ ÜST KULLANICI ALANI
        ================================================== */}
        <div className="flex items-center flex-wrap justify-center md:justify-end gap-2 md:gap-4 w-full md:w-auto">
          <Link
            href="/blogs"
            className="text-xs md:text-sm font-medium text-zinc-300 hover:text-emerald-400 transition bg-zinc-900/80 px-3 md:px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-1.5 md:gap-2 shadow-md"
          >
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
            <span>Blogs</span>
          </Link>

          <Link
            href="/kitaplar"
            className="text-xs md:text-sm font-medium text-zinc-300 hover:text-emerald-400 transition bg-zinc-900/80 px-3 md:px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-1.5 md:gap-2 shadow-md"
          >
            <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />

            <span>Kitaplar</span>
          </Link>

          {authLoading ? (
            <div className="w-28 md:w-32 h-10 rounded-xl bg-zinc-900/50 animate-pulse" />
          ) : userProfile ? (
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
              <Link
                href="/kullanici"
                className="text-xs md:text-sm font-medium text-emerald-300 hover:text-emerald-400 transition bg-zinc-900/80 px-3 md:px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-1.5 md:gap-2 shadow-md max-w-[160px] md:max-w-none truncate"
              >
                <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400 flex-shrink-0" />

                <span className="truncate">Merhaba, {getUserName()}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="px-3 md:px-4 py-2 text-xs md:text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all rounded-xl border border-red-500/20 flex items-center gap-1.5 md:gap-2 cursor-pointer shadow-lg"
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />

                Çıkış Yap
              </button>
            </div>
          ) : (
            <Link
              href="/giris"
              className="px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 transition-all rounded-xl text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/20 whitespace-nowrap"
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
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 z-10" />

            <img
              src={sliders[currentIndex].gorsel_url}
              alt="Slider Görseli"
              className="w-full h-full object-cover scale-105 transition-transform duration-1000"
            />

            {/* SLOGAN */}
            {sliders[currentIndex].slogan && (
              <div className="absolute bottom-20 md:bottom-24 left-4 md:left-10 right-4 md:right-auto z-20 max-w-lg bg-black/60 backdrop-blur-md p-4 md:p-6 rounded-2xl border-l-4 border-emerald-400 shadow-2xl">
                <p className="text-base md:text-xl font-light italic text-emerald-100 tracking-wide drop-shadow">
                  "{sliders[currentIndex].slogan}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* SAĞ ALT KÖŞE: OTOMATİK DEĞİŞEN DUYURU KUTUCUĞU */}
        {duyurular.length > 0 && (
          <div 
            onClick={() => setIsDuyuruModalOpen(true)}
            className="absolute bottom-20 md:bottom-24 right-4 md:right-10 z-30 max-w-xs bg-black/70 hover:bg-black/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/40 shadow-2xl cursor-pointer transition-all group"
            title="Tüm duyuruları görmek için tıklayın"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
              <Bell className="w-3.5 h-3.5 animate-bounce" /> Güncel Duyuru (Tıkla)
            </div>
            <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-emerald-300 transition">
              {duyurular[currentDuyuruIndex]?.duyuru_adi}
            </h4>
            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
              {duyurular[currentDuyuruIndex]?.duyuru_icerigi}
            </p>
          </div>
        )}

        {/* SLIDER NOKTALARI */}
        <div className="absolute bottom-8 md:bottom-24 right-4 md:right-10 z-30 hidden">
          {/* Gizlendi */}
        </div>
      </main>

      {/* TÜM DUYURULAR MODALI ("KABAK GİBİ ORTAYA ÇIKAN" KISIM) */}
      {isDuyuruModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Tüm Güncel Duyurular
              </h3>
              <button 
                onClick={() => setIsDuyuruModalOpen(false)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {duyurular.map((d) => (
                <div key={d.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-1">
                  <h4 className="text-sm font-bold text-white">{d.duyuru_adi}</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{d.duyuru_icerigi}</p>
                  <span className="text-[10px] text-emerald-400 block pt-1">
                    Tarih: {d.yayimlanma_tarihi ? new Date(d.yayimlanma_tarihi).toLocaleDateString("tr-TR") : "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="w-full py-6 px-4 bg-black/90 backdrop-blur-md border-t border-white/10 flex flex-col items-center justify-center text-xs text-zinc-400 gap-1.5 z-30 mt-auto text-center">
        <p className="font-medium text-zinc-300">
          Ekşi Kitap Kulübü İzmir & 2026 Tüm Hakları Saklıdır.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-[11px] text-zinc-500">
          <a
            href="#"
            className="hover:text-emerald-400 transition-colors"
          >
            KVKK Aydınlatma Metni
          </a>

          <span className="hidden md:inline">•</span>

          <a
            href="#"
            className="hover:text-emerald-400 transition-colors"
          >
            Gizlilik Politikası
          </a>

          <span className="hidden md:inline">•</span>

          <a
            href="#"
            className="hover:text-emerald-400 transition-colors"
          >
            Çerez Politikası
          </a>

          <span className="hidden md:inline">•</span>

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