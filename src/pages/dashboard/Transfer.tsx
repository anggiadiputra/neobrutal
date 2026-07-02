import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { apiFetch } from '../../utils/api';

export default function Transfer() {
  const [domainName, setDomainName] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [period, setPeriod] = useState('1');
  const [buyWhois, setBuyWhois] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      const response = await apiFetch('/api/domains/transfer', {
        method: 'POST',
        body: JSON.stringify({
          name: domainName.trim().toLowerCase(),
          auth_code: authCode.trim(),
          period: parseInt(period, 10),
          buy_whois_protection: buyWhois,
        }),
      });

      setAlert({
        message: response.message || 'Permintaan transfer domain berhasil diajukan! Mengarahkan ke dashboard...',
        type: 'success',
      });
      setDomainName('');
      setAuthCode('');
      setPeriod('1');
      setBuyWhois(false);

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setAlert({
        message: apiErr.message || 'Gagal memproses transfer domain. Silakan periksa kembali detail domain Anda.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Transfer Domain Masuk" activeMenu="domains">
      <div className="text-left w-full">
        {/* Header */}
        <div className="border-b-3 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black flex items-center gap-2">
            Transfer Domain Masuk
          </h1>
          <p className="text-xs sm:text-sm font-bold text-zinc-500 mt-2">
            Pindahkan pengelolaan dan perpanjangan domain Anda ke Ruangtunggu.
          </p>
        </div>


      {/* Alert */}
      {alert && (
        <div
          className={`mb-5 p-4 border-3 border-black font-bold text-sm ${
            alert.type === 'success'
              ? 'bg-green-100 text-green-800 shadow-[3px_3px_0px_#166534]'
              : 'bg-red-100 text-red-800 shadow-[3px_3px_0px_#991b1b]'
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div className="bg-white border-3 border-black p-7 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[var(--accent-primary)] border-3 border-black p-2 flex items-center justify-center shadow-[4px_4px_0px_#000]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 3 4 4-4 4" />
                <path d="M20 7H9a4 4 0 0 0-4 4v9" />
                <path d="m8 21-4-4 4-4" />
                <path d="M4 17h11a4 4 0 0 0 4-4V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black uppercase">Formulir Transfer</h3>
            </div>
          </div>

          <hr className="border-t-3 border-black my-5" />

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="transfer-domain">Nama Domain *</label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <input
                    id="transfer-domain"
                    type="text"
                    value={domainName}
                    onChange={e => setDomainName(e.target.value)}
                    placeholder="contoh: domainanda.com"
                    required
                    className="w-full border-3 border-black pl-10 pr-4 py-3 text-sm font-bold bg-white focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="transfer-auth">EPP / Auth Code *</label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="transfer-auth"
                    type="text"
                    value={authCode}
                    onChange={e => setAuthCode(e.target.value)}
                    placeholder="Masukkan kode otorisasi transfer"
                    required
                    className="w-full border-3 border-black pl-10 pr-4 py-3 text-sm font-bold bg-white focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1" htmlFor="transfer-period">Periode Perpanjangan *</label>
                <select
                  id="transfer-period"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  required
                  className="w-full border-3 border-black px-4 py-3 text-sm font-bold bg-white focus:translate-x-[2px] focus:translate-y-[2px] shadow-[4px_4px_0_0_#000] focus:shadow-[2px_2px_0_0_#000] outline-none transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: 'var(--select-arrow-bg)', backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', paddingRight: '40px' }}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(y => (
                    <option key={y} value={y}>{y} Tahun Perpanjangan</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-zinc-600">
                  <input
                    type="checkbox"
                    checked={buyWhois}
                    onChange={e => setBuyWhois(e.target.checked)}
                    className="w-5 h-5 accent-[var(--accent-primary)] cursor-pointer border-2 border-black"
                  />
                  Beli WHOIS Privacy Protection
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[var(--accent-primary)] border-3 border-black text-black font-black text-sm shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase mt-2"
            >
              {loading ? 'Memproses Transfer...' : 'Transfer Domain Sekarang'}
            </button>
          </form>
        </div>

        {/* RIGHT: Guide Card */}
        <div className="bg-white border-3 border-black p-7 shadow-[4px_4px_0px_#000] self-start">
          <h3 className="text-sm font-black mb-2 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M9 12h6" />
              <path d="M9 16h6" />
              <path d="M9 8h6" />
            </svg>
            Checklist Persiapan Transfer
          </h3>
          <p className="text-xs font-semibold text-zinc-500 mb-4 leading-snug">
            Sebelum memulai transfer domain, pastikan domain Anda telah memenuhi syarat berikut:
          </p>

          <ul className="space-y-3 text-xs text-zinc-600 leading-relaxed">
            {[
              { title: 'Buka Kunci Domain:', desc: 'Pastikan status domain di registrar asal Anda adalah Unlocked (atau tidak dikunci).' },
              { title: 'Status Aktif:', desc: 'Domain harus berada dalam masa aktif (tidak dalam status Expired atau Redemption).' },
              { title: 'Usia Domain:', desc: 'Domain harus telah aktif minimal 60 hari di registrar asal.' },
              { title: 'Kode EPP valid:', desc: 'Dapatkan kode EPP/Auth code terbaru dari panel control registrar asal Anda.' },
              { title: 'WHOIS Publik:', desc: 'Nonaktifkan WHOIS Privacy di registrar lama untuk mempermudah verifikasi transfer.' },
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <div className="w-5 h-5 flex-shrink-0 bg-[var(--accent-primary)] border-2 border-black flex items-center justify-center font-black text-[10px] shadow-[1px_1px_0px_#000]">
                  {i + 1}
                </div>
                <div>
                  <strong className="text-black">{item.title}</strong> {item.desc}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
