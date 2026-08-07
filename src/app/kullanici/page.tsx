"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { User, LogOut, Globe, Shield, BookOpen, Phone, CreditCard } from "lucide-react";

export default function KullaniciPaneli() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/giris");
        return;
      }

      // Kullanıcının profil bilgilerini çek
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error || !data) {
        // Eğer profil henüz tamamlanmadıysa yönlendir
        router.push("/profil-tamamla");
      } else {
        setProfile(data);
      }
      setLoading(false);
    }
    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/giris");
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">Üye Paneli</h1>
            <p className="text-xs text-zinc-400 mt-1">Hoş geldin, {profile?.isim || "Üye"}.</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" /> Ana Sayfa
            </a>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm flex items-center gap-2">
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
      </div>
    </div>
  );
}