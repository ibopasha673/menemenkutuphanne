"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, FileText, CheckCircle, Trash2, Edit3, X, Save } from "lucide-react";

type Yarisma = {
  id: string;
  yarisma_ismi: string;
  yarisma_sartlari: string;
  yarisma_hakkinda: string;
  yarisma_tarihi: string;
  basvuru_baslangic_tarihi: string;
  basvuru_bitis_tarihi: string;
  durum: string; // 'aktif', 'bitti', 'sonuclandi'
};

type Basvuru = {
  id: string;
  yarisma_id: string;
  oyku_metni: string;
  durum: string; // 'beklemede', 'onaylandi'
};

export default function YarismalarPage() {
  const [aktifSekme, setAktifSekme] = useState<"aktif" | "bekleyen" | "sonuclanan">("aktif");
  const [yarismalar, setYarismalar] = useState<Yarisma[]>([]);
  const [basvurular, setBasvurular] = useState<{ [key: string]: Basvuru }>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Başvuru Modal State'leri
  const [selectedYarisma, setSelectedYarisma] = useState<Yarisma | null>(null);
  const [oykuMetni, setOykuMetni] = useState("");
  const [editingBasvuruId, setEditingBasvuruId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/giris");
        return;
      }
      setUserId(session.user.id);
      fetchData(session.user.id);
    }
    init();
  }, [router]);

  const fetchData = async (uid: string) => {
    setLoading(true);
    const { data: yData } = await supabase.from("oyku_yarismalari").select("*").order("created_at", { ascending: false });
    if (yData) setYarismalar(yData);

    const { data: bData } = await supabase.from("yarisma_basvurulari").select("*").eq("user_id", uid);
    if (bData) {
      const map: { [key: string]: Basvuru } = {};
      bData.forEach((b: any) => {
        map[b.yarisma_id] = b;
      });
      setBasvurular(map);
    }
    setLoading(false);
  };

  const handleBasvuruAc = (yarisma: Yarisma) => {
    setSelectedYarisma(yarisma);
    const mevcut = basvurular[yarisma.id];
    if (mevcut) {
      setEditingBasvuruId(mevcut.id);
      setOykuMetni(mevcut.oyku_metni || "");
    } else {
      setEditingBasvuruId(null);
      setOykuMetni("");
    }
  };

  const handleBasvuruKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedYarisma) return;

    if (selectedYarisma.durum !== 'aktif') {
      alert("Bu yarışma için başvuru süresi kapalı!");
      return;
    }

    if (editingBasvuruId) {
      const { error } = await supabase
        .from("yarisma_basvurulari")
        .update({ oyku_metni: oykuMetni })
        .eq("id", editingBasvuruId);

      if (error) alert("Güncellenirken hata: " + error.message);
      else {
        alert("Başvurunuz güncellendi!");
        closeModal();
        fetchData(userId);
      }
    } else {
      const { error } = await supabase
        .from("yarisma_basvurulari")
        .insert([{ yarisma_id: selectedYarisma.id, user_id: userId, oyku_metni: oykuMetni, durum: 'beklemede' }]);

      if (error) alert("Başvuru yapılırken hata: " + error.message);
      else {
        alert("Başvurunuz başarıyla tamamlandı, admin onayına gönderildi!");
        closeModal();
        fetchData(userId);
      }
    }
  };

  const handleBasvuruSil = async (basvuruId: string, yarisma: Yarisma) => {
    if (yarisma.durum !== 'aktif') {
      alert("Başvuru süresi bittiği için başvuruyu s silemezsiniz!");
      return;
    }

    if (!confirm("Başvurunuzu silmek istediğinize emin misiniz?")) return;

    const { error } = await supabase.from("yarisma_basvurulari").delete().eq("id", basvuruId);
    if (error) alert("Silinirken hata: " + error.message);
    else {
      alert("Başvuru silindi.");
      if (userId) fetchData(userId);
    }
  };

  const closeModal = () => {
    setSelectedYarisma(null);
    setOykuMetni("");
    setEditingBasvuruId(null);
  };

  // Sekmelere göre filtreleme
  const filtrelenmisYarismalar = yarismalar.filter(y => {
    if (aktifSekme === "aktif") return y.durum === 'aktif';
    if (aktifSekme === "bekleyen") return y.durum === 'bitti';
    if (aktifSekme === "sonuclanan") return y.durum === 'sonuclandi';
    return true;
  });

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 relative pb-20">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-emerald-400 mb-6 inline-flex items-center gap-2 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </Link>

        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 drop-shadow-lg mb-8">
          <Trophy className="text-emerald-400 w-8 h-8" /> Öykü Yarışmaları
        </h1>

        {/* SEKMELER */}
        <div className="flex flex-wrap gap-3 mb-8 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setAktifSekme("aktif")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              aktifSekme === "aktif" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Aktif Başvurulabilenler
          </button>
          <button
            onClick={() => setAktifSekme("bekleyen")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              aktifSekme === "bekleyen" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Başvuru Biten / Sonuç Bekleyenler
          </button>
          <button
            onClick={() => setAktifSekme("sonuclanan")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
              aktifSekme === "sonuclanan" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Sonuçlananlar
          </button>
        </div>

        {filtrelenmisYarismalar.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 p-12 rounded-2xl text-center text-zinc-500">
            Bu kategoride yarışma bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filtrelenmisYarismalar.map((yarisma) => {
              const basvuru = basvurular[yarisma.id];
              const isAktif = yarisma.durum === 'aktif';

              return (
                <div key={yarisma.id} className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-emerald-300">{yarisma.yarisma_ismi}</h2>
                      <p className="text-xs text-zinc-400 mt-1">Yarışma Tarihi: {new Date(yarisma.yarisma_tarihi).toLocaleDateString("tr-TR")}</p>
                    </div>
                    {basvuru ? (
                      <span className={`px-3 py-1 border text-xs rounded-xl font-semibold flex items-center gap-1.5 ${
                        basvuru.durum === 'onaylandi' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        <CheckCircle className="w-4 h-4" /> {basvuru.durum === 'onaylandi' ? 'Başvurunuz Onaylandı' : 'Başvuru Beklemede'}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-xl font-semibold">
                        Başvuru Yapılmadı
                      </span>
                    )}
                  </div>

                  {yarisma.yarisma_hakkinda && (
                    <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
                      <strong className="text-emerald-400 block">Yarışma Hakkında:</strong>
                      <p>{yarisma.yarisma_hakkinda}</p>
                    </div>
                  )}

                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
                    <strong className="text-emerald-400 block">Yarışma Şartları:</strong>
                    <p>{yarisma.yarisma_sartlari}</p>
                  </div>

                  <div className="flex flex-wrap justify-between items-center pt-2 border-t border-zinc-800 text-xs text-zinc-400 gap-4">
                    <div>
                      <span>Başvuru Aralığı: </span>
                      <strong className="text-zinc-200">
                        {new Date(yarisma.basvuru_baslangic_tarihi).toLocaleDateString("tr-TR")} - {new Date(yarisma.basvuru_bitis_tarihi).toLocaleDateString("tr-TR")}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAktif && (
                        <button
                          onClick={() => handleBasvuruAc(yarisma)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer flex items-center gap-1.5"
                        >
                          {basvuru ? <Edit3 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          {basvuru ? "Başvuruyu Düzenle" : "Başvuru Yap"}
                        </button>
                      )}

                      {basvuru && isAktif && (
                        <button
                          onClick={() => handleBasvuruSil(basvuru.id, yarisma)}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition text-xs font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BAŞVURU MODALI */}
        {selectedYarisma && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-bold text-emerald-300">
                  {selectedYarisma.yarisma_ismi} - Başvuru Formu
                </h3>
                <button onClick={closeModal} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBasvuruKaydet} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Öykü Metniniz *</label>
                  <textarea
                    rows={8}
                    value={oykuMetni}
                    onChange={(e) => setOykuMetni(e.target.value)}
                    placeholder="Yarışma için öykünüzü buraya yazın..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition cursor-pointer">
                    İptal
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer">
                    <Save className="w-4 h-4" /> Başvuruyu Tamamla
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}