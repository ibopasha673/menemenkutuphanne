"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Phone, CreditCard, CheckCircle } from "lucide-react";

export default function ProfilTamamlaPage() {
  const [phone, setPhone] = useState("");
  const [tcKimlik, setTcKimlik] = useState("");
  const [isim, setIsim] = useState("");
  const [soyisim, setSoyisim] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [sliders, setSliders] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchSliders() {
      const { data } = await supabase.from("sliders").select("*").order("sira", { ascending: true });
      if (data && data.length > 0) setSliders(data);
    }
    fetchSliders();
  }, []);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliders]);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/giris");
      } else {
        setUserId(session.user.id);
        setUserEmail(session.user.email || "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", session.user.id)
          .single();

        if (profile?.phone) {
          router.push("/kullanici");
        }
      }
    }
    checkUser();
  }, [router]);

  // TC Kimlik Doğrulama Algoritması (Matematiksel Kontrol)
  const validateTC = (tc: string) => {
    if (!/^[1-9][0-9]{10}$/.test(tc)) return false;

    let digits = tc.split("").map(Number);
    
    let oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    let evenSum = digits[1] + digits[3] + digits[5] + digits[7];

    let tenthDigit = (oddSum * 7 - evenSum) % 10;
    if (tenthDigit < 0) tenthDigit += 10;

    let totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    let eleventhDigit = totalSum % 10;

    return digits[9] === tenthDigit && digits[10] === eleventhDigit;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTC(tcKimlik)) {
      alert("Geçersiz TC Kimlik Numarası! Lütfen gerçek ve doğru bir TC No girin.");
      return;
    }

    setLoading(true);

    // Aynı telefon veya TC ile mükerrer kayıt kontrolü
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("phone, tc_kimlik_no")
      .or(`phone.eq.${phone.trim()},tc_kimlik_no.eq.${tcKimlik.trim()}`)
      .maybeSingle();

    if (existingUser) {
      alert("Bu telefon numarası veya TC Kimlik numarası ile zaten bir kayıt mevcut!");
      setLoading(false);
      return;
    }

    // Profiles tablosuna kaydet
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      email: userEmail,
      isim: isim,
      soyisim: soyisim,
      phone: phone.trim(),
      tc_kimlik_no: tcKimlik.trim(),
      yetki: "üye",
      role: "üye",
      blog_yetkisi: false,
    });

    if (error) {
      alert("Kaydedilirken hata oluştu: " + error.message);
      setLoading(false);
    } else {
      alert("Profiliniz başarıyla tamamlandı!");
      router.push("/kullanici");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950 text-white p-4">
      {sliders.length > 0 ? (
        sliders.map((slider, index) => (
          <div
            key={slider.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-40 scale-105" : "opacity-0 scale-100"
            }`}
            style={{
              backgroundImage: `url(${slider.gorsel_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))
      ) : (
        <div className="absolute inset-0 bg-zinc-900 opacity-50" />
      )}

      <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md bg-zinc-900/90 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-emerald-400">Kayıt İşlemini Tamamlayın</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Google hesabınız bağlandı (<span className="text-zinc-200">{userEmail}</span>). Lütfen ek bilgilerinizi girin.
          </p>
          <p className="text-[11px] text-emerald-300 font-medium mt-2 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
            Not: Bu bilgiler sadece ilk girişinize mahsus alınmaktadır ve sonrasında bir daha sorulmaz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1 font-medium">İsim</label>
              <input
                type="text"
                value={isim}
                onChange={(e) => setIsim(e.target.value)}
                placeholder="İsim"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1 font-medium">Soyisim</label>
              <input
                type="text"
                value={soyisim}
                onChange={(e) => setSoyisim(e.target.value)}
                placeholder="Soyisim"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">Telefon Numarası</label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0555 555 55 55"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">TC Kimlik Numarası</label>
            <div className="relative flex items-center">
              <CreditCard className="absolute left-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                maxLength={11}
                value={tcKimlik}
                onChange={(e) => setTcKimlik(e.target.value)}
                placeholder="11 haneli TC Kimlik No"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 transition py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" /> {loading ? "Kaydediliyor..." : "Bilgileri Kaydet ve Devam Et"}
          </button>
        </form>
      </div>
    </div>
  );
}