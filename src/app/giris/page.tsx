"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Phone } from "lucide-react";
import bcrypt from "bcryptjs";

type SliderItem = {
  id: string;
  gorsel_url: string;
  slogan: string | null;
  sira: number;
};

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchSliders() {
      const { data } = await supabase
        .from("sliders")
        .select("*")
        .order("sira", { ascending: true });
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

  // Telefon ve Bcrypt Hash Kontrolüyle Profesyonel Giriş
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanPhone = phone.trim();

      // 1. Profiles tablosundan telefon ile kullanıcıyı, şifreyi ve rolü bul
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, password, role, email")
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (profileError || !profile) {
        alert("Giriş Başarısız: Bu telefon numarasına ait kayıt bulunamadı!");
        setLoading(false);
        return;
      }

      if (!profile.password) {
        alert("Giriş Başarısız: Bu hesap için şifre tanımlanmamış.");
        setLoading(false);
        return;
      }

      // 2. Bcrypt ile şifreyi güvenli bir şekilde doğrula
      const isPasswordValid = await bcrypt.compare(password, profile.password);

      if (!isPasswordValid) {
        alert("Giriş Başarısız: Hatalı telefon numarası veya şifre!");
        setLoading(false);
        return;
      }

      setLoading(false);

      // 3. Profesyonel ve kesintisiz yönlendirme
      if (profile.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/kullanici";
      }
    } catch (error) {
      console.error("Giriş hatası:", error);
      alert("Giriş sırasında beklenmeyen bir hata oluştu.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/profil-tamamla`,
      },
    });
    if (error) {
      alert("Google ile giriş hatası: " + error.message);
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

      <div className="relative z-10 w-full max-w-md bg-zinc-900/85 border border-zinc-800/80 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="mb-6">
          <a href="/" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-emerald-400 transition">
            <ArrowLeft className="w-4 h-4" /> Ana sayfa ekranına Dön
          </a>
        </div>

        {/* Sekmeler (Tablar): Giriş Yap / Kayıt Ol */}
        <div className="flex gap-6 mb-6 border-b border-zinc-800 pb-3">
          <button
            type="button"
            className={`text-sm font-bold transition pb-1 ${activeTab === "login" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-zinc-400 hover:text-white"}`}
            onClick={() => setActiveTab("login")}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            className={`text-sm font-bold transition pb-1 ${activeTab === "register" ? "text-emerald-400 border-b-2 border-emerald-500" : "text-zinc-400 hover:text-white"}`}
            onClick={() => setActiveTab("register")}
          >
            Kayıt Ol
          </button>
        </div>

        {activeTab === "register" ? (
          // KAYIT OL KISMI (Sadece Google ile Devam Et)
          <div className="py-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-emerald-400 tracking-wide">
                Aramıza Katılın
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Hızlıca kayıt olmak için Google hesabınızı kullanın.
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full bg-white hover:bg-zinc-100 text-zinc-900 transition py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google ile Devam Et
            </button>
          </div>
        ) : (
          // GİRİŞ YAP KISMI (Telefon ve Şifre ile)
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-emerald-400 tracking-wide">
                Tekrar Hoş Geldiniz
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Telefon numaranız ve şifrenizle giriş yapın.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">Telefon Numarası</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0555 555 55 55"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1 font-medium">Şifre</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 transition py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center cursor-pointer mt-2"
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}