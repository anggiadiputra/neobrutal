import React, { useState, useEffect } from 'react';
import Layout from '../layouts/Layout';
import { apiFetch } from '../utils/api';
import { requireGuest } from '../utils/auth';
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  type RegionItem
} from '../utils/region';
import type { DomainPriceItem } from './Prices';
import Turnstile from '../components/ui/Turnstile';

const formatCurrency = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

export const Register: React.FC = () => {
  // Account Info State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Registrar Profile State
  const [organization, setOrganization] = useState('');
  const [voice, setVoice] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('ID');

  // Cascading Region Dropdown State
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedProvinceName, setSelectedProvinceName] = useState('');

  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [selectedRegencyId, setSelectedRegencyId] = useState('');
  const [selectedRegencyName, setSelectedRegencyName] = useState('');

  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');

  const [villages, setVillages] = useState<RegionItem[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [selectedVillageName, setSelectedVillageName] = useState('');

  // Sidebar Transaction Details State
  const [domainParam, setDomainParam] = useState('');
  const [sidebarPricing, setSidebarPricing] = useState<DomainPriceItem | null>(null);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(11);

  // Form State
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Guard page: guests only
  useEffect(() => {
    requireGuest();

    // Check for domain query param
    const params = new URLSearchParams(window.location.search);
    const dom = params.get('domain') || '';
    setDomainParam(dom);

    // Initial provinces load
    fetchProvinces()
      .then(setProvinces)
      .catch((err) => console.error('Failed to load provinces:', err));

    // Load settings for tax configuration
    const loadSettings = async () => {
      try {
        const settingsRes = await apiFetch('/api/settings', { requireAuth: false });
        if (settingsRes && settingsRes.success && settingsRes.data) {
          setTaxEnabled(settingsRes.data.tax_enabled !== false);
          setTaxRate(parseFloat(settingsRes.data.tax_rate) || 0);
        }
      } catch (err) {
        console.warn('Failed to load settings in register:', err);
      }
    };
    loadSettings();
  }, []);

  // Fetch regencies when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setRegencies([]);
      setSelectedRegencyId('');
      setSelectedRegencyName('');
      return;
    }
    fetchRegencies(selectedProvinceId)
      .then(setRegencies)
      .catch((err) => console.error('Failed to load regencies:', err));
  }, [selectedProvinceId]);

  // Fetch districts when regency changes
  useEffect(() => {
    if (!selectedRegencyId) {
      setDistricts([]);
      setSelectedDistrictId('');
      setSelectedDistrictName('');
      return;
    }
    fetchDistricts(selectedRegencyId)
      .then(setDistricts)
      .catch((err) => console.error('Failed to load districts:', err));
  }, [selectedRegencyId]);

  // Fetch villages when district changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      setSelectedVillageId('');
      setSelectedVillageName('');
      return;
    }
    fetchVillages(selectedDistrictId)
      .then(setVillages)
      .catch((err) => console.error('Failed to load villages:', err));
  }, [selectedDistrictId]);

  // Handle Sidebar domain calculation
  useEffect(() => {
    if (!domainParam) return;

    const loadPrices = async () => {
      let pricing = null;
      const cleanDomain = domainParam.trim().toLowerCase();
      const dotIndex = cleanDomain.indexOf('.');
      const ext = dotIndex !== -1 ? cleanDomain.substring(dotIndex) : '';

      try {
        const response = await apiFetch<{ success: boolean; data: DomainPriceItem[] }>('/api/domains/prices', { requireAuth: false });
        if (response.success && Array.isArray(response.data)) {
          pricing = response.data.find(p => p.extension === ext);
        }
      } catch (err) {
        console.warn('Failed to load prices for sidebar, using fallback:', err);
      }

      if (!pricing) {
        const fallbacks: Record<string, Partial<DomainPriceItem>> = {
          '.com': { registerPrice: 145000, regularRegisterPrice: 145000, promo: false },
          '.net': { registerPrice: 155000, regularRegisterPrice: 155000, promo: false },
          '.id': { registerPrice: 220000, regularRegisterPrice: 220000, promo: false },
          '.co.id': { registerPrice: 275000, regularRegisterPrice: 275000, promo: false },
          '.web.id': { registerPrice: 75000, regularRegisterPrice: 85000, promo: true },
          '.my.id': { registerPrice: 25000, regularRegisterPrice: 35000, promo: true }
        };
        pricing = fallbacks[ext] || { registerPrice: 145000, regularRegisterPrice: 145000, promo: false };
      }
      setSidebarPricing(pricing as DomainPriceItem);
    };

    loadPrices();
  }, [domainParam]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProvinceId(id);
    const selectedOpt = e.target.options[e.target.selectedIndex];
    setSelectedProvinceName(selectedOpt ? selectedOpt.textContent || '' : '');

    // Reset children selections
    setSelectedRegencyId('');
    setSelectedRegencyName('');
    setRegencies([]);
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setDistricts([]);
    setSelectedVillageId('');
    setSelectedVillageName('');
    setVillages([]);
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedRegencyId(id);
    const selectedOpt = e.target.options[e.target.selectedIndex];
    setSelectedRegencyName(selectedOpt ? selectedOpt.textContent || '' : '');

    // Reset children selections
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setDistricts([]);
    setSelectedVillageId('');
    setSelectedVillageName('');
    setVillages([]);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDistrictId(id);
    const selectedOpt = e.target.options[e.target.selectedIndex];
    setSelectedDistrictName(selectedOpt ? selectedOpt.textContent || '' : '');

    // Reset children selections
    setSelectedVillageId('');
    setSelectedVillageName('');
    setVillages([]);
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedVillageId(id);
    const selectedOpt = e.target.options[e.target.selectedIndex];
    setSelectedVillageName(selectedOpt ? selectedOpt.textContent || '' : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.replace(/\s+/g, '');

    // Construct street_2 with district and village details
    let finalStreet2 = street2.trim() || undefined;
    if (selectedDistrictName && selectedVillageName) {
      const regionAddress = `Kec. ${selectedDistrictName}, Kel. ${selectedVillageName}`;
      finalStreet2 = street2.trim() ? `${street2.trim()}, ${regionAddress}` : regionAddress;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          organization: organization.trim(),
          voice: voice.trim(),
          street_1: street1.trim(),
          street_2: finalStreet2,
          city: selectedRegencyName,
          state: selectedProvinceName,
          postal_code: postalCode,
          country_code: countryCode.toUpperCase(),
          turnstileToken
        })
      });

      setAlert({
        message: 'Pendaftaran Berhasil! Silakan periksa email masuk/spam Anda untuk memverifikasi akun.',
        type: 'success'
      });

      // Reset Form fields
      setName('');
      setEmail('');
      setPassword('');
      setOrganization('');
      setVoice('');
      setStreet1('');
      setStreet2('');
      setPostalCode('');
      setCountryCode('ID');
      setSelectedProvinceId('');
      setSelectedRegencyId('');
      setSelectedDistrictId('');
      setSelectedVillageId('');
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      let errorMsg = apiErr.message || 'Pendaftaran gagal. Silakan periksa kembali data Anda.';
      if (apiErr.errors) {
        const errorFields = Object.entries(apiErr.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('; ');
        errorMsg = `Validasi gagal: ${errorFields}`;
      }
      setAlert({ message: errorMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Sidebar calculations
  let basePrice = 0;
  let promoDiscount = 0;
  let tax = 0;
  let totalEstimate = 0;

  if (sidebarPricing) {
    const regPrice = sidebarPricing.registerPrice;
    const regRegularPrice = sidebarPricing.regularRegisterPrice || regPrice;
    const isPromo = sidebarPricing.promo && regRegularPrice > regPrice;

    basePrice = regRegularPrice;
    if (isPromo) {
      promoDiscount = regRegularPrice - regPrice;
    }

    const priceAfterPromo = regPrice;
    if (taxEnabled) {
      tax = Math.round(priceAfterPromo * (taxRate / 100));
    }
    totalEstimate = priceAfterPromo + tax;
  }

  return (
    <Layout title="Daftar Akun Baru">
      <section className="py-12 bg-zinc-100 min-h-[80vh] flex items-center justify-center">
        <div
          className={`container px-4 ${
            domainParam ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl' : 'max-w-xl'
          }`}
        >
          {/* Form column */}
          <div className={`${domainParam ? 'lg:col-span-7' : 'w-full'}`}>
            <div className="card p-6 sm:p-10 bg-white border-3 border-black shadow-[6px_6px_0_#000] rounded-sm text-left">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black">Daftar Akun Baru</h2>
                <p className="text-xs text-zinc-500 font-bold mt-1">
                  Daftar sekarang untuk mulai mengelola domain Anda secara mandiri.
                </p>
              </div>

              {/* Alert */}
              {alert && (
                <div className={`alert alert-${alert.type}`}>
                  <span>{alert.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="border-b-2 border-black pb-1 mb-1">
                  <span className="text-xs font-black uppercase text-rose-600">Informasi Akun Lokal</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="name">Nama Lengkap *</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-control font-bold border-black border-3"
                      placeholder="Nama Anda"
                      required
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="email">Alamat Email *</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control font-bold border-black border-3"
                      placeholder="nama@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label" htmlFor="password">Kata Sandi (Min. 6 Karakter) *</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control font-bold border-black border-3"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="toggle-password-btn"
                      aria-label="Lihat kata sandi"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="border-b-2 border-black pb-1 mb-1 mt-3">
                  <span className="text-xs font-black uppercase text-rose-600">
                    Informasi Profil Domain (Sinkronisasi Registrar)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="organization">Nama Organisasi / Perusahaan *</label>
                    <input
                      type="text"
                      id="organization"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="form-control font-bold border-black border-3"
                      placeholder="Contoh: Personal / PT Bisnis"
                      required
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="voice">Nomor Telepon (Min. 9 Digit) *</label>
                    <input
                      type="tel"
                      id="voice"
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      className="form-control font-bold border-black border-3"
                      placeholder="+62812345678"
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-0">
                  <label className="form-label" htmlFor="street_1">Alamat Lengkap (Baris 1) *</label>
                  <input
                    type="text"
                    id="street_1"
                    value={street1}
                    onChange={(e) => setStreet1(e.target.value)}
                    className="form-control font-bold border-black border-3"
                    placeholder="Nama jalan, nomor rumah"
                    required
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label" htmlFor="street_2">Alamat Lengkap (Baris 2 - Opsional)</label>
                  <input
                    type="text"
                    id="street_2"
                    value={street2}
                    onChange={(e) => setStreet2(e.target.value)}
                    className="form-control font-bold border-black border-3"
                    placeholder="Nomor unit, lantai, gedung"
                  />
                </div>

                {/* Cascading Region Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="state">Provinsi *</label>
                    <select
                      id="state"
                      value={selectedProvinceId}
                      onChange={handleProvinceChange}
                      className="form-control font-bold border-black border-3"
                      required
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="city">Kabupaten / Kota *</label>
                    <select
                      id="city"
                      value={selectedRegencyId}
                      onChange={handleRegencyChange}
                      className="form-control font-bold border-black border-3"
                      required
                      disabled={!selectedProvinceId}
                    >
                      <option value="">Pilih Kabupaten/Kota</option>
                      {regencies.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="district">Kecamatan *</label>
                    <select
                      id="district"
                      value={selectedDistrictId}
                      onChange={handleDistrictChange}
                      className="form-control font-bold border-black border-3"
                      required
                      disabled={!selectedRegencyId}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="village">Kelurahan *</label>
                    <select
                      id="village"
                      value={selectedVillageId}
                      onChange={handleVillageChange}
                      className="form-control font-bold border-black border-3"
                      required
                      disabled={!selectedDistrictId}
                    >
                      <option value="">Pilih Kelurahan</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="postal_code">Kode Pos *</label>
                    <input
                      type="text"
                      id="postal_code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="form-control font-bold border-black border-3"
                      placeholder="Kode Pos"
                      required
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" htmlFor="country_code">Kode Negara (2 Karakter) *</label>
                    <input
                      type="text"
                      id="country_code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="form-control font-bold border-black border-3"
                      placeholder="ID"
                      required
                      maxLength={2}
                    />
                  </div>
                </div>

                {/* Cloudflare Turnstile */}
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken('')}
                />

                <button
                  type="submit"
                  disabled={isLoading || !turnstileToken}
                  className="btn btn-primary w-full mt-4 h-12 font-black shadow-[3px_3px_0_#000] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
                </button>
              </form>

              <div className="text-center mt-6 border-t-2 border-zinc-200 pt-4">
                <p className="text-xs font-bold text-zinc-500">
                  Sudah memiliki akun?{' '}
                  <a href="/login" className="text-black font-black underline">
                    Masuk di sini
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Right column: Transaction details sidebar */}
          {domainParam && (
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="card p-6 bg-white border-3 border-black shadow-[6px_6px_0_#000] rounded-sm text-left">
                <h3 className="text-sm font-black uppercase tracking-wider border-b-2 border-dashed border-black pb-2 mb-4">
                  🛒 Rincian Transaksi Domain
                </h3>

                <div className="mb-4">
                  <span className="text-[10px] uppercase text-zinc-500 font-extrabold block mb-1">
                    Domain Pilihan:
                  </span>
                  <strong className="font-mono text-xs font-black text-rose-600 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-sm">
                    {domainParam.toLowerCase()}
                  </strong>
                </div>

                <div className="flex flex-col gap-3 font-semibold text-xs border-b-2 border-black pb-4 mb-4 text-zinc-600">
                  <div className="flex justify-between">
                    <span>Harga Registrasi (1 thn):</span>
                    <span className="font-extrabold text-black">
                      {formatCurrency(basePrice)}
                    </span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Diskon Promo:</span>
                      <span className="font-extrabold">
                        - {formatCurrency(promoDiscount)}
                      </span>
                    </div>
                  )}

                  {taxEnabled && (
                    <div className="flex justify-between">
                      <span>PPN / Pajak ({taxRate}%):</span>
                      <span className="font-extrabold text-black">
                        {formatCurrency(tax)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Biaya Gerbang / Admin:</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      Dihitung saat checkout
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-black">Estimasi Total:</span>
                  <strong className="text-lg font-black text-black">
                    {formatCurrency(totalEstimate)}
                  </strong>
                </div>

                <div className="alert alert-success text-[10px] leading-relaxed p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm mb-0">
                  🔒 Pembayaran dan aktivasi domain ini akan dilakukan setelah pendaftaran akun baru Anda berhasil dan email Anda telah diverifikasi.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};
export default Register;
