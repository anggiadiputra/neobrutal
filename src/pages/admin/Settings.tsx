import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { apiFetch, getApiUrl } from '../../utils/api';

export default function Settings() {
  const [appName, setAppName] = useState('');
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(11);
  
  const [gwQris, setGwQris] = useState(true);
  const [gwBank, setGwBank] = useState(true);
  const [gwCc, setGwCc] = useState(true);

  // Duitku Config Settings
  const [duitkuMerchantCode, setDuitkuMerchantCode] = useState('');
  const [duitkuApiKey, setDuitkuApiKey] = useState('');
  const [duitkuSandboxEnabled, setDuitkuSandboxEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [fonnteToken, setFonnteToken] = useState('');
  const [showWaToken, setShowWaToken] = useState(false);

  // Connection Testing States
  const [testingConnection, setTestingConnection] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [testSuccessMsg, setTestSuccessMsg] = useState('');
  const [testErrorMsg, setTestErrorMsg] = useState('');

  // Drag & drop sorting states
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    const updated = [...paymentMethods];
    const item = updated.splice(draggedItemIndex, 1)[0];
    updated.splice(index, 0, item);
    setDraggedItemIndex(index);
    setPaymentMethods(updated);
  };

  const handleDragEnd = async () => {
    setDraggedItemIndex(null);
    try {
      const order = paymentMethods.map(pm => pm.paymentMethod);
      await apiFetch('/api/settings/payment-methods/sort', {
        method: 'PUT',
        body: JSON.stringify({ order })
      });
      setTestSuccessMsg('Urutan metode pembayaran berhasil disimpan.');
    } catch (err: any) {
      setTestErrorMsg('Gagal menyimpan urutan metode pembayaran: ' + err.message);
    }
  };

  // Logo upload preview states
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadSettings = async () => {
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/settings/admin', { requireAuth: true });
      if (res.success && res.data) {
        const s = res.data;
        setAppName(s.app_name || '');
        setTaxEnabled(s.tax_enabled !== false);
        setTaxRate(s.tax_rate !== undefined ? s.tax_rate : 11);
        setGwQris(s.payment_gateway_qris !== false);
        setGwBank(s.payment_gateway_bank !== false);
        setGwCc(s.payment_gateway_cc !== false);
        
        // Load Duitku configuration
        setDuitkuMerchantCode(s.duitku_merchant_code || '');
        setDuitkuApiKey(s.duitku_api_key || '');
        setDuitkuSandboxEnabled(s.duitku_sandbox_enabled !== false);
        setFonnteToken(s.fonnte_token || '');

        if (s.app_logo) {
          setLogoPreviewUrl(`${getApiUrl()}${s.app_logo}`);
        }
      }
    } catch (err: any) {
      console.error('[Settings] Error loading admin settings:', err);
      setErrorMsg(err.message || 'Gagal memuat pengaturan sistem.');
    }

    try {
      // Load existing synced payment methods
      const pmRes = await apiFetch(`/api/settings/payment-methods?_=${Date.now()}`, { requireAuth: false });
      console.log('[Settings] Loaded payment methods:', pmRes);
      if (pmRes.success && pmRes.data?.paymentFee) {
        setPaymentMethods(pmRes.data.paymentFee);
      }
    } catch (err: any) {
      console.error('[Settings] Error loading payment methods:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran file logo terlalu besar. Maksimum 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setLogoBase64(b64);
      setLogoPreviewUrl(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestSuccessMsg('');
    setTestErrorMsg('');
    setPaymentMethods([]);
    try {
      const res = await apiFetch('/api/settings/payment-methods/sync', { 
        method: 'POST'
      });
      if (res.success && res.data) {
        const d = res.data;
        if (d.responseCode === '00' && Array.isArray(d.paymentFee)) {
          setPaymentMethods(d.paymentFee);
          setTestSuccessMsg(`Koneksi & Sinkronisasi Duitku Berhasil! ${d.paymentFee.length} metode pembayaran disimpan.`);
        } else {
          setTestErrorMsg(d.responseMessage || 'Duitku mengembalikan respon gagal.');
        }
      } else {
        setTestErrorMsg(res.message || 'Gagal terhubung ke API Gateway lokal.');
      }
    } catch (err: any) {
      setTestErrorMsg(err.message || 'Terjadi kesalahan saat melakukan sinkronisasi.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload: Record<string, any> = {
      app_name: appName.trim(),
      tax_enabled: taxEnabled,
      tax_rate: Number(taxRate) || 0,
      payment_gateway_qris: gwQris,
      payment_gateway_bank: gwBank,
      payment_gateway_cc: gwCc,
      duitku_merchant_code: duitkuMerchantCode.trim(),
      duitku_api_key: duitkuApiKey.trim(),
      duitku_sandbox_enabled: duitkuSandboxEnabled,
      fonnte_token: fonnteToken.trim(),
    };

    if (logoBase64) {
      payload.logo_base64 = logoBase64;
    }

    try {
      const res = await apiFetch('/api/settings/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.success) {
        setSuccessMsg('Pengaturan sistem berhasil disimpan.');
        setLogoBase64('');
        // Reload settings values and dynamic header branding logo
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Gagal menyimpan pengaturan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Pengaturan Sistem" activeMenu="settings">
      <div className="text-left text-xs text-black max-w-3xl">
        {/* Header */}
        <div className="border-b-3 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black">Pengaturan Sistem</h1>
          <p className="text-sm font-bold text-zinc-500 mt-2">
            Konfigurasi branding, upload logo, aturan pajak, dan metode pembayaran aktif.
          </p>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="alert alert-success mb-6 border-2 border-black rounded-sm bg-emerald-50">
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-error mb-6 border-2 border-black rounded-sm bg-rose-50">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSettingsSubmit} className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 flex flex-col gap-6 font-bold">
          
          {/* Identitas & Branding */}
          <div>
            <h3 className="text-base font-black border-b border-dashed border-black pb-2 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              Identitas & Branding
            </h3>
            
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-zinc-500">Nama Aplikasi / Brand</label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-bold"
                placeholder="misal: Ruangtunggu"
              />
              <span className="text-[10px] text-zinc-400 font-normal">Nama ini akan memengaruhi title di halaman web dan footer portal Anda.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-500">Upload Logo Aplikasi</label>
              <div className="flex items-center gap-4 flex-wrap mt-1">
                <div className="w-36 h-16 border-2 border-dashed border-black bg-zinc-50 flex items-center justify-center overflow-hidden rounded-sm">
                  {logoPreviewUrl ? (
                    <img src={logoPreviewUrl} alt="Logo preview" className="max-h-12 max-w-[90%] object-contain" />
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-normal">Belum ada logo</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoSelect}
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline py-2 px-4 text-xs font-black bg-white"
                  >
                    Pilih Gambar
                  </button>
                  <span className="text-[10px] text-zinc-400 font-normal">PNG, JPG, SVG. Maks 2MB.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Perhitungan Pajak */}
          <div>
            <h3 className="text-base font-black border-b border-dashed border-black pb-2 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="19" y1="5" x2="5" y2="19" />
                <circle cx="6.5" cy="6.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
              </svg>
              Perhitungan Pajak (PPN)
            </h3>

            <div className="flex items-center justify-between bg-zinc-50 p-4 border-2 border-black rounded-sm mb-4">
              <div>
                <div className="text-sm font-black text-black">Aktifkan PPN / Pajak</div>
                <div className="text-[10px] text-zinc-500 font-normal">Tampilkan baris pajak PPN saat checkout dan kalkulasikan ke total bayar.</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className={`flex flex-col gap-1 transition-opacity duration-150 ${taxEnabled ? 'opacity-100' : 'opacity-50'}`}>
              <label className="text-zinc-500">Besaran Pajak (%)</label>
              <div className="relative flex items-center max-w-[160px]">
                <input
                  type="number"
                  disabled={!taxEnabled}
                  min={0}
                  max={100}
                  step={0.1}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-bold w-full pr-8"
                />
                <span className="absolute right-3 text-sm font-black text-zinc-500">%</span>
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div>
            <h3 className="text-base font-black border-b border-dashed border-black pb-2 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Metode Pembayaran (Payment Gateway)
            </h3>
            <p className="text-[11px] text-zinc-400 font-normal mb-3">
              Pilih metode pembayaran mana saja yang ingin Anda tampilkan ke customer pada halaman transaksi.
            </p>

            <div className="flex flex-col gap-2">
              {/* QRIS */}
              <div className="flex justify-between items-center bg-zinc-50 p-3 border-2 border-black rounded-sm">
                <div>
                  <div className="text-xs font-black text-black">Gerbang QRIS (E-Wallet)</div>
                  <div className="text-[10px] text-zinc-400 font-normal">GoPay, OVO, Dana, LinkAja</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={gwQris}
                    onChange={(e) => setGwQris(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* VA */}
              <div className="flex justify-between items-center bg-zinc-50 p-3 border-2 border-black rounded-sm">
                <div>
                  <div className="text-xs font-black text-black">Virtual Account (Transfer Bank)</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Virtual Account bank-bank nasional utama</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={gwBank}
                    onChange={(e) => setGwBank(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* CC */}
              <div className="flex justify-between items-center bg-zinc-50 p-3 border-2 border-black rounded-sm">
                <div>
                  <div className="text-xs font-black text-black">Kartu Kredit (Visa/Mastercard)</div>
                  <div className="text-[10px] text-zinc-400 font-normal">Pembayaran langsung kartu kredit/debit</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={gwCc}
                    onChange={(e) => setGwCc(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Integrasi Duitku Gateway */}
          <div>
            <h3 className="text-base font-black border-b border-dashed border-black pb-2 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Integrasi Duitku Payment Gateway (Kredensial)
            </h3>
            <p className="text-[11px] text-zinc-400 font-normal mb-4">
              Konfigurasikan Merchant Code dan API Key dari Duitku. Data disimpan dengan enkripsi AES-256-CBC di database.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-500 font-bold">Duitku Merchant Code</label>
                <input
                  type="text"
                  value={duitkuMerchantCode}
                  onChange={(e) => setDuitkuMerchantCode(e.target.value)}
                  className="px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-bold w-full"
                  placeholder="contoh: DXXXX"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-500 font-bold">Duitku API Key / Merchant Key</label>
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={duitkuApiKey}
                    onChange={(e) => setDuitkuApiKey(e.target.value)}
                    className="px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-bold w-full pr-12"
                    placeholder="contoh: XXXXXXXXXX7968XXXXXXXXXFB05332AF"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 text-zinc-500 hover:text-black font-black text-xs cursor-pointer focus:outline-none"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-50 p-4 border-2 border-black rounded-sm mb-4">
                <div>
                  <div className="text-sm font-black text-black">Mode Sandbox Duitku</div>
                  <div className="text-[10px] text-zinc-500 font-normal">Aktifkan untuk pengetesan transaksi dummy menggunakan environment Sandbox.</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={duitkuSandboxEnabled}
                    onChange={(e) => setDuitkuSandboxEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="border-2 border-black p-4 bg-zinc-50 rounded-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-black block">Sinkronkan & Uji Koneksi Duitku</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Periksa koneksi Anda ke API Duitku, unduh logo secara lokal, dan simpan ke database.</span>
                  </div>
                  <button
                    type="button"
                    disabled={testingConnection}
                    onClick={handleTestConnection}
                    className="btn btn-outline py-2 px-4 text-xs font-black bg-white shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer"
                  >
                    {testingConnection ? "Menguji..." : "Sinkronkan & Uji"}
                  </button>
                </div>

                {/* Connection Status Messages */}
                {testSuccessMsg && (
                  <div className="mt-3 text-xs text-green-700 bg-green-50 border-2 border-green-300 p-3 rounded-sm font-bold">
                    {testSuccessMsg}
                  </div>
                )}
                {testErrorMsg && (
                  <div className="mt-3 text-xs text-red-700 bg-red-50 border-2 border-red-300 p-3 rounded-sm font-bold font-mono">
                    Error: {testErrorMsg}
                  </div>
                )}

                {/* Payment Methods Active Listing with Drag & Drop */}
                {paymentMethods.length > 0 && (
                  <div className="mt-4 border-t border-dashed border-zinc-300 pt-4">
                    <span className="text-xs font-black block mb-1">Metode Pembayaran Aktif:</span>
                    <span className="text-[9px] text-zinc-400 font-bold block mb-3">💡 Geser kartu di bawah ini (drag & drop) untuk mengatur urutan posisinya bagi pelanggan saat checkout.</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {paymentMethods.map((pm: any, idx: number) => {
                        const imgUrl = pm.paymentImage.startsWith('http') 
                          ? pm.paymentImage 
                          : `${getApiUrl()}${pm.paymentImage}`;
                        return (
                          <div
                            key={pm.paymentMethod}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-2 border-2 border-black bg-white p-2 rounded-sm shadow-[1.5px_1.5px_0_#000] cursor-grab active:cursor-grabbing select-none transition-all ${
                              draggedItemIndex === idx ? 'opacity-40 border-dashed bg-zinc-100' : ''
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <circle cx="9" cy="5" r="1.2" fill="currentColor" />
                              <circle cx="9" cy="12" r="1.2" fill="currentColor" />
                              <circle cx="9" cy="19" r="1.2" fill="currentColor" />
                              <circle cx="15" cy="5" r="1.2" fill="currentColor" />
                              <circle cx="15" cy="12" r="1.2" fill="currentColor" />
                              <circle cx="15" cy="19" r="1.2" fill="currentColor" />
                            </svg>
                            <img
                              src={imgUrl}
                              alt={pm.paymentName}
                              className="w-10 h-6 object-contain border border-zinc-200 p-0.5 shrink-0"
                            />
                            <div className="overflow-hidden flex-1">
                              <span className="text-[10px] font-black block truncate">{pm.paymentName}</span>
                              <span className="text-[8px] text-zinc-400 font-semibold block uppercase">Code: {pm.paymentMethod}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Integrasi Fonnte WhatsApp API Gateway */}
          <div className="md:col-span-2 border-t-2 border-dashed border-zinc-300 pt-6 mt-2">
            <h3 className="text-base font-black border-b border-dashed border-black pb-2 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742c.15-.316.368-.6.643-.843c.27-.238.588-.415.932-.519a2.023 2.023 0 0 1 1.085.02c.341.109.65.295.91.543l2.84 2.84a1.8 1.8 0 0 1-.02 2.56l-.16.16a1.8 1.8 0 0 1-2.54 0L10 13.12" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c.49 0 .98-.03 1.47-.08c3.96-.46 7.03-3.69 7.37-7.66c.2-2.3-.28-4.52-1.3-6.42M12 20.25a8.966 8.966 0 0 1-5.94-2.28m5.94 2.28a9.006 9.006 0 0 0 5.94-2.28M6.06 17.97A8.967 8.967 0 0 1 3 12c0-4.03 2.65-7.44 6.32-8.58m3.74 14.55C9.5 17.65 6.5 15.5 6.5 12c0-2.3 1.5-4 4.5-4.5" />
              </svg>
              Integrasi Fonnte WhatsApp API Gateway
            </h3>
            <p className="text-[11px] text-zinc-400 font-normal mb-4">
              Konfigurasikan token API Gateway Fonnte Anda untuk mengirim notifikasi penagihan & konfirmasi domain ke nomor WhatsApp pelanggan. Data token disimpan secara terenkripsi AES-256-CBC.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-500 font-bold text-xs">Fonnte API Token</label>
                <div className="relative">
                  <input
                    type={showWaToken ? "text" : "password"}
                    value={fonnteToken}
                    onChange={(e) => setFonnteToken(e.target.value)}
                    placeholder="Masukkan Token Fonnte..."
                    className="w-full border-3 border-black p-3 font-bold text-sm focus:outline-none focus:bg-rose-50 shadow-[3px_3px_0px_#000000] focus:shadow-[1px_1px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWaToken(!showWaToken)}
                    className="absolute right-3 top-3 text-zinc-500 font-black text-[10px] hover:text-black uppercase cursor-pointer"
                  >
                    {showWaToken ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t-2 border-black pt-4 md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary font-black py-2 px-8 text-sm"
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
