"use client";


import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type SliderItem = {
  id: string;
  gorsel_url: string;
  slogan: string | null;
};

export default function Home() {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchSliders() {
      const { data, error } = await supabase
        .from("sliders")
        .select("*")
        .order("sira", { ascending: true });

      if (error) {
        console.error("Slider yüklenirken hata oluştu:", error.message);
      } else if (data && data.length > 0) {
        setSliders(data);
      } else {
        setSliders([
          {
            id: "1",
            gorsel_url: "/logomenemenkutuphaen.png",
            slogan: "Ekşi Kitap Kulübü İzmir - Kitap dolu sohbetler burada başlar.",
          },
        ]);
      }
    }

    fetchSliders();
  }, []);

  useEffect(() => {
    if (sliders.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sliders.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [sliders.length]);

  return (
    <div className="relative w-full min-h-[120vh] flex flex-col bg-zinc-950 text-white overflow-x-hidden">
      
      {/* ÜST KISIM (Header) */}
      <header className="absolute top-0 left-0 w-full z-30 flex justify-between items-center px-8 py-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-900/60 flex items-center justify-center">
            <img
              src="/logomenemenkutuphaen.png"
              alt="Logo"
              className="w-full h-full rounded-full object-cover animate-logo-spin"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-wider text-white drop-shadow-md">
              Ekşi Kitap Kulübü
            </h1>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              İzmir
            </span>
          </div>
        </div>

        <div>
          <a
            href="/giris"
            className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 transition-all rounded-xl text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/20"
          >
            Giriş Yap / Üye Ol
          </a>
        </div>
      </header>

      {/* ORTA KISIM: Slider */}
      <main className="relative w-full h-screen flex items-center justify-center">
        {sliders.length > 0 && (
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 z-10" />
            
            <img
              src={sliders[currentIndex].gorsel_url}
              alt="Slider Görseli"
              className="w-full h-full object-cover scale-105 transition-transform duration-1000"
            />

            {/* Sol Alt Slogan Alanı */}
            {sliders[currentIndex].slogan && (
              <div className="absolute bottom-24 left-10 z-20 max-w-lg bg-black/60 backdrop-blur-md p-6 rounded-2xl border-l-4 border-emerald-400 shadow-2xl">
                <p className="text-lg md:text-xl font-light italic text-emerald-100 tracking-wide drop-shadow">
                  "{sliders[currentIndex].slogan}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sağ Alt Köşe Geçiş Noktaları */}
        <div className="absolute bottom-24 right-10 z-30 flex gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          {sliders.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                currentIndex === index ? "bg-emerald-400 w-8" : "bg-white/40 w-2.5"
              }`}
            />
          ))}
        </div>
      </main>

      {/* EN ALT FOOTER: Sayfa aşağı kaydırıldığında ortaya çıkan alan */}
      <footer className="w-full py-6 bg-black/90 backdrop-blur-md border-t border-white/10 flex flex-col items-center justify-center text-xs text-zinc-400 gap-1.5 z-30 mt-auto">
        <p className="font-medium text-zinc-300">
          Ekşi Kitap Kulübü İzmir & 2026 Tüm Hakları Saklıdır.
        </p>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <a href="#" className="hover:text-emerald-400 transition-colors">KVKK Aydınlatma Metni</a>
          <span>•</span>
          <a href="#" className="hover:text-emerald-400 transition-colors">Gizlilik Politikası</a>
          <span>•</span>
          <a href="#" className="hover:text-emerald-400 transition-colors">Çerez Politikası</a>
          <span>•</span>
          <a href="/admin" className="hover:text-emerald-400 transition-colors font-semibold text-zinc-400">Yönetici Paneli</a>
        </div>
      </footer>
    </div>
  );
}