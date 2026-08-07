"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminGirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Supabase Auth ile giriş yapma
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Giriş başarılıysa admin sayfasına yönlendir
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Giriş başarısız. Bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-wider text-emerald-400">Yönetici Girişi</h1>
          <p className="text-sm text-zinc-400 mt-1">Ekşi Kitap Kulübü İzmir</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
              Admin E-Posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 transition-all font-semibold rounded-xl text-white shadow-lg shadow-emerald-600/30 disabled:opacity-50"
          >
            {loading ? "Giriş Yapılıyor..." : "Yönetim Paneline Git"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors">
            ← Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  );
}

