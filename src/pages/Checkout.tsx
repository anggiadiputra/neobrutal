import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import DashboardLayout from '../layouts/DashboardLayout';
import { apiFetch } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { useToast } from '../components/ui/Toast';
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchVillages
} from '../utils/region';
import type { RegionItem } from '../utils/region';
import type { DomainPriceItem } from './Prices';

interface SystemSettings {
  tax_enabled: boolean;
  tax_rate: number;
  [key: string]: unknown;
}

interface SearchResult {
  domain: string;
  status: string;
  price: number;
  is_premium?: boolean;
  premium_price?: number;
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const domainParam = searchParams.get('domain') || '';
  const isPremiumParam = searchParams.get('is_premium') === 'true';

  const loggedIn = isAuthenticated();

  // State 1: Search Box (If no domain query is present)
  const [searchDomainInput, setSearchDomainInput] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQueryText, setSearchQueryText] = useState('');
  const [searchExtensions, setSearchExtensions] = useState<string[]>([
    '.com', '.net', '.org', '.id', '.co.id', '.web.id', '.my.id', '.xyz'
  ]);
  const [pricesCache, setPricesCache] = useState<DomainPriceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // State 2: Checkout Details (If domain is present)
  const [isPremiumDomain, setIsPremiumDomain] = useState(isPremiumParam);
  const [premiumRetailPrice, setPremiumRetailPrice] = useState(0);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    tax_enabled: true,
    tax_rate: 11
  });

  // Config fields
  const [registerYears, setRegisterYears] = useState(1);
  const [ns1, setNs1] = useState('');
  const [ns2, setNs2] = useState('');

  // Guest flow tabs
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Guest Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regVoice, setRegVoice] = useState('');
  const [regStreet1, setRegStreet1] = useState('');
  const [regStreet2, setRegStreet2] = useState('');
  const [regPostal, setRegPostal] = useState('');
  const [regCountry, setRegCountry] = useState('ID');

  // Cascading regions
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedRegencyId, setSelectedRegencyId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');

  // Guest Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load basic configurations
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const pricesRes = await apiFetch('/api/domains/prices', { requireAuth: false });
        if (pricesRes.success && pricesRes.data) {
          setPricesCache(pricesRes.data);
          setSearchExtensions(pricesRes.data.map((p: DomainPriceItem) => p.extension));
        }

        const settingsRes = await apiFetch('/api/settings', { requireAuth: false });
        if (settingsRes && settingsRes.success && settingsRes.data) {
          setSystemSettings(settingsRes.data);
        }

        // Provinces for guest registration dropdowns
        if (!loggedIn) {
          const prov = await fetchProvinces();
          setProvinces(prov);
        }
      } catch (e) {
        console.warn('Failed to load settings or prices:', e);
      }
    };
    fetchInit();
  }, [loggedIn]);

  // Load checkout details if domain parameter is present
  useEffect(() => {
    if (!domainParam) return;

    const initCheckoutInfo = async () => {
      // 1. Fetch reseller nameservers default
      try {
        const resellerRes = await apiFetch('/api/domains/reseller', { requireAuth: false });
        if (resellerRes.success && resellerRes.data && resellerRes.data.nameservers) {
          const ns = resellerRes.data.nameservers || [];
          if (ns[0]) setNs1(ns[0]);
          if (ns[1]) setNs2(ns[1]);
        } else {
          setNs1('ns1.ruangtunggu.id');
          setNs2('ns2.ruangtunggu.id');
        }
      } catch (e) {
        setNs1('ns1.ruangtunggu.id');
        setNs2('ns2.ruangtunggu.id');
      }

      // 2. Check if premium
      try {
        const cleanDomain = domainParam.toLowerCase();
        const firstDot = cleanDomain.indexOf('.');
        const domainNameOnly = firstDot !== -1 ? cleanDomain.substring(0, firstDot) : cleanDomain;
        const domainExtOnly = firstDot !== -1 ? cleanDomain.substring(firstDot) : '';

        const checkRes = await apiFetch(
          `/api/domains/availability?domainName=${encodeURIComponent(domainNameOnly)}&extensions=${encodeURIComponent(domainExtOnly)}`,
          { requireAuth: false }
        );

        if (checkRes.success && checkRes.data && checkRes.data.length > 0) {
          const item = checkRes.data[0];
          if (item.is_premium) {
            setIsPremiumDomain(true);
            setPremiumRetailPrice(item.premium_price);
            setAlert({
              message: 'Domain ini adalah domain premium dengan harga khusus dari registry global.',
              type: 'warning'
            });
          }
        }
      } catch (e) {
        console.warn('Premium status check failed:', e);
      }
    };

    initCheckoutInfo();
  }, [domainParam]);

  // Administrative regions cascading handlers
  useEffect(() => {
    if (!selectedProvinceId) {
      setRegencies([]);
      return;
    }
    const loadRegencies = async () => {
      try {
        const list = await fetchRegencies(selectedProvinceId);
        setRegencies(list);
        setDistricts([]);
        setVillages([]);
        setSelectedRegencyId('');
        setSelectedDistrictId('');
        setSelectedVillageId('');
      } catch (e) {
        console.error(e);
      }
    };
    loadRegencies();
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedRegencyId) {
      setDistricts([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        const list = await fetchDistricts(selectedRegencyId);
        setDistricts(list);
        setVillages([]);
        setSelectedDistrictId('');
        setSelectedVillageId('');
      } catch (e) {
        console.error(e);
      }
    };
    loadDistricts();
  }, [selectedRegencyId]);

  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      return;
    }
    const loadVillages = async () => {
      try {
        const list = await fetchVillages(selectedDistrictId);
        setVillages(list);
        setSelectedVillageId('');
      } catch (e) {
        console.error(e);
      }
    };
    loadVillages();
  }, [selectedDistrictId]);

  // Search logic in checkout
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter('');
    const query = searchDomainInput.trim().toLowerCase();
    if (!query) return;

    const cleanName = query.split('.')[0];
    if (cleanName.length < 3) {
      toast.error('Nama domain minimal terdiri dari 3 karakter.');
      return;
    }

    setIsSearching(true);
    setSearchQueryText(cleanName);
    setSearchResults([]);

    try {
      const initialPlaceholderRows = searchExtensions.map(ext => ({
        domain: `${cleanName}${ext}`,
        status: 'checking',
        price: 0
      }));
      setSearchResults(initialPlaceholderRows);

      const tlds = searchExtensions.join(',');
      const response = await apiFetch(
        `/api/domains/availability?domainName=${encodeURIComponent(cleanName)}&extensions=${encodeURIComponent(tlds)}`,
        { requireAuth: false }
      );

      if (response.success && response.data) {
        const sorted = [...response.data].sort((a: SearchResult, b: SearchResult) => {
          const aIsExact = a.domain.toLowerCase() === query.toLowerCase();
          const bIsExact = b.domain.toLowerCase() === query.toLowerCase();
          if (aIsExact && !bIsExact) return -1;
          if (!aIsExact && bIsExact) return 1;
          return 0;
        });
        setSearchResults(sorted);
      }
    } catch (err) {
      console.error('Availability check failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Pricing calculations
  const getSidebarCalculations = () => {
    if (!domainParam) return { basePrice: 0, finalPrice: 0, saving: 0, tax: 0, subTotal: 0 };

    const cleanDomain = domainParam.toLowerCase();
    const firstDot = cleanDomain.indexOf('.');
    const ext = firstDot !== -1 ? cleanDomain.substring(firstDot) : '';

    const p = pricesCache.find(price => price.extension === ext) || { registerPrice: 145000, regularRegisterPrice: 145000, promo: false } as any;

    let registerPrice = 0;
    let regularPrice = 0;

    if (isPremiumDomain && premiumRetailPrice > 0) {
      registerPrice = premiumRetailPrice * registerYears;
      regularPrice = premiumRetailPrice * registerYears;
    } else {
      if (p.registrationByYear) {
        const yearPrice = p.registrationByYear[String(registerYears)];
        registerPrice = yearPrice || (p.registerPrice * registerYears);

        if (p.promo) {
          if (p.regularRegistrationByYear) {
            const regYearPrice = p.regularRegistrationByYear[String(registerYears)];
            if (regYearPrice) regularPrice = regYearPrice;
          }
          if (!regularPrice && p.regularRegisterPrice > 0) {
            regularPrice = p.regularRegisterPrice * registerYears;
          }
        } else {
          regularPrice = registerPrice;
        }
      } else {
        registerPrice = p.registerPrice * registerYears;
        regularPrice = (p.regularRegisterPrice || p.registerPrice) * registerYears;
      }
    }

    const taxRatePercent = systemSettings.tax_enabled ? (systemSettings.tax_rate || 0) : 0;
    const tax = Math.round(registerPrice * (taxRatePercent / 100));
    const subTotal = registerPrice + tax;
    const saving = regularPrice - registerPrice;

    return {
      basePrice: regularPrice,
      finalPrice: registerPrice,
      saving,
      tax,
      subTotal,
      taxRatePercent
    };
  };

  const calcs = getSidebarCalculations();

  // Guest Registration Form Submission
  const handleGuestRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const name = regName.trim();
    const email = regEmail.replace(/\s+/g, '');
    const password = regPassword.trim();
    const organization = regOrg;
    const voice = regVoice;
    const street_1 = regStreet1;

    // Region texts
    const state = provinces.find(p => p.id === selectedProvinceId)?.name || '';
    const city = regencies.find(r => r.id === selectedRegencyId)?.name || '';
    const district = districts.find(d => d.id === selectedDistrictId)?.name || '';
    const village = villages.find(v => v.id === selectedVillageId)?.name || '';

    let street_2 = regStreet2.trim() || undefined;
    if (district && village) {
      const regionAddress = `Kec. ${district}, Kel. ${village}`;
      street_2 = regStreet2.trim() ? `${regStreet2.trim()}, ${regionAddress}` : regionAddress;
    }

    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({
          name,
          email,
          password,
          organization,
          voice,
          street_1,
          street_2,
          city,
          state,
          postal_code: regPostal,
          country_code: regCountry.toUpperCase()
        })
      });

      setAlert({
        message: 'Akun Anda berhasil didaftarkan! Silakan cek email masuk/spam Anda untuk memverifikasi akun. Setelah terverifikasi, silakan masuk ke tab "Masuk ke Akun" di atas untuk melanjutkan.',
        type: 'success'
      });

      setTimeout(() => {
        setActiveTab('login');
        setLoginEmail(email);
      }, 3000);
    } catch (err: unknown) {
      console.error('Guest Register failed:', err);
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      let errorMsg = apiErr.message || 'Pendaftaran gagal. Silakan coba lagi.';
      if (apiErr.errors) {
        const errorFields = Object.entries(apiErr.errors)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join('; ');
        errorMsg = `Validasi gagal: ${errorFields}`;
      }
      setAlert({ message: errorMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guest Login Step 1 Submission
  const handleGuestLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const email = loginEmail.replace(/\s+/g, '');
    try {
      const response = await apiFetch('/api/auth/login-step1', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({ email, password: loginPassword })
      });

      setLoginStep(2);
      setAlert({
        message: response.message || 'Kode OTP telah dikirimkan ke email Anda.',
        type: 'success'
      });
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { message?: string };
      setAlert({ message: apiErr.message || 'Email atau password salah.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guest Login Step 2 Submission
  const handleGuestLoginStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = loginOtpCode.replace(/\D/g, '');
    if (otp.length !== 6) {
      setAlert({ message: 'Kode OTP harus berupa 6 digit angka.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const response = await apiFetch('/api/auth/login-step2', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({ email: loginEmail, otp_code: otp })
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setAlert({ message: 'Autentikasi berhasil! Menyinkronkan checkout...', type: 'success' });
      
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { message?: string };
      setAlert({ message: apiErr.message || 'OTP tidak cocok atau kedaluwarsa.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Authenticated Order submission
  const handleProcessOrder = () => {
    if ((ns1 && !ns2) || (!ns1 && ns2)) {
      setAlert({
        message: 'Jika Anda ingin menggunakan nameserver kustom, silakan masukkan minimal 2 nameservers kustom.',
        type: 'error'
      });
      return;
    }

    const cleanDomain = domainParam.toLowerCase();
    const firstDot = cleanDomain.indexOf('.');
    const domainName = firstDot !== -1 ? cleanDomain.substring(0, firstDot) : cleanDomain;
    const domainExtension = firstDot !== -1 ? cleanDomain.substring(firstDot).replace(/^\./, '') : '';

    const pendingCheckout = {
      domainName,
      domainExtension,
      years: registerYears,
      ns: ns1 && ns2 ? [ns1, ns2] : [],
      price: calcs.finalPrice,
      regularPrice: calcs.basePrice,
      isPromo: calcs.saving > 0,
      isPremium: isPremiumDomain
    };

    sessionStorage.setItem('pending_domain_checkout', JSON.stringify(pendingCheckout));
    navigate('/dashboard/domains/payment');
  };

  const filteredSearchResults = searchResults.filter(item =>
    item.domain.toLowerCase().includes(searchFilter.trim().toLowerCase())
  );

  // RENDER CONTENT
  const renderCheckoutContent = () => {
    return (
      <div className="text-left">
        {alert && (
          <div className={`alert alert-${alert.type} mb-4`}>
            <span>{alert.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Forms */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {!loggedIn ? (
              // GUEST FLOW
              <div className="card bg-white border-3 border-black p-0! shadow-[4px_4px_0_#000] overflow-hidden rounded-sm">
                <div className="flex border-b-3 border-black bg-zinc-100 font-black text-xs text-zinc-500">
                  <button
                    onClick={() => { setActiveTab('register'); setAlert(null); }}
                    className={`flex-1 py-3 border-r-3 border-black text-center cursor-pointer transition-colors ${activeTab === 'register' ? 'bg-amber-100 text-black' : 'bg-transparent hover:bg-zinc-200'}`}
                  >
                    Daftar Akun Baru
                  </button>
                  <button
                    onClick={() => { setActiveTab('login'); setAlert(null); }}
                    className={`flex-1 py-3 text-center cursor-pointer transition-colors ${activeTab === 'login' ? 'bg-amber-100 text-black' : 'bg-transparent hover:bg-zinc-200'}`}
                  >
                    Masuk ke Akun
                  </button>
                </div>

                <div className="p-6 text-xs font-bold text-black">
                  {activeTab === 'register' ? (
                    // Registration Form
                    <form onSubmit={handleGuestRegister} className="flex flex-col gap-4">
                      <div className="text-rose-600 font-extrabold uppercase border-b border-black pb-1">Informasi Akun</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Nama Lengkap *</label>
                          <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="Nama Anda" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Alamat Email *</label>
                          <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="nama@email.com" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500">Kata Sandi (Min. 6 Karakter) *</label>
                        <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="••••••••" />
                      </div>

                      <div className="text-rose-600 font-extrabold uppercase border-b border-black pb-1 mt-2">Informasi Profil Domain (Registrar)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Nama Organisasi / Perusahaan *</label>
                          <input type="text" value={regOrg} onChange={(e) => setRegOrg(e.target.value)} required className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="PT / Personal" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Nomor Telepon *</label>
                          <input type="tel" value={regVoice} onChange={(e) => setRegVoice(e.target.value)} required className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="+62812345678" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500">Alamat Lengkap *</label>
                        <input type="text" value={regStreet1} onChange={(e) => setRegStreet1(e.target.value)} required className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="Nama jalan, nomor rumah" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500">Alamat (Baris 2 - Opsional)</label>
                        <input type="text" value={regStreet2} onChange={(e) => setRegStreet2(e.target.value)} className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="Nomor unit/gedung" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Provinsi *</label>
                          <select value={selectedProvinceId} onChange={(e) => setSelectedProvinceId(e.target.value)} required className="px-2 py-2 border-2 border-black rounded-sm bg-white">
                            <option value="">Pilih Provinsi</option>
                            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Kabupaten / Kota *</label>
                          <select value={selectedRegencyId} onChange={(e) => setSelectedRegencyId(e.target.value)} required disabled={!selectedProvinceId} className="px-2 py-2 border-2 border-black rounded-sm bg-white disabled:bg-zinc-100 disabled:cursor-not-allowed">
                            <option value="">Pilih Kabupaten/Kota</option>
                            {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Kecamatan *</label>
                          <select value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)} required disabled={!selectedRegencyId} className="px-2 py-2 border-2 border-black rounded-sm bg-white disabled:bg-zinc-100 disabled:cursor-not-allowed">
                            <option value="">Pilih Kecamatan</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Kelurahan *</label>
                          <select value={selectedVillageId} onChange={(e) => setSelectedVillageId(e.target.value)} required disabled={!selectedDistrictId} className="px-2 py-2 border-2 border-black rounded-sm bg-white disabled:bg-zinc-100 disabled:cursor-not-allowed">
                            <option value="">Pilih Kelurahan</option>
                            {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Kode Pos *</label>
                          <input type="text" value={regPostal} onChange={(e) => setRegPostal(e.target.value)} required className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="Kode Pos" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-zinc-500">Kode Negara (2 Karakter) *</label>
                          <input type="text" value={regCountry} onChange={(e) => setRegCountry(e.target.value)} required maxLength={2} className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="ID" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary w-full py-2.5 font-black text-sm"
                      >
                        {isSubmitting ? 'Memproses...' : 'Daftar Akun & Lanjutkan'}
                      </button>
                    </form>
                  ) : (
                    // Login Form
                    <div className="py-2">
                      {loginStep === 1 ? (
                        <form onSubmit={handleGuestLoginStep1} className="flex flex-col gap-4">
                          <p className="text-[11px] text-zinc-500 font-bold leading-normal">
                            Silakan masuk ke akun Ruangtunggu Anda untuk memproses domain ini.
                          </p>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-zinc-500">Alamat Email</label>
                            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="nama@email.com" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-zinc-500">Kata Sandi</label>
                            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="px-3 py-2 border-2 border-black rounded-sm bg-white" placeholder="••••••••" />
                          </div>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full py-2.5 font-black text-sm mt-2"
                          >
                            {isSubmitting ? 'Memproses...' : 'Lanjutkan ke Verifikasi OTP'}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleGuestLoginStep2} className="flex flex-col gap-4 text-center">
                          <span className="text-3xl">✉️</span>
                          <h3 className="font-extrabold text-sm leading-tight">Masukkan Kode OTP</h3>
                          <p className="text-[11px] text-zinc-500 font-bold leading-normal">
                            Kami telah mengirimkan 6 digit OTP keamanan ke email Anda <strong className="text-rose-600">{loginEmail}</strong>.
                          </p>
                          <input
                            type="text"
                            value={loginOtpCode}
                            onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                            required
                            maxLength={6}
                            className="px-3 py-2.5 border-2 border-black rounded-sm bg-white font-mono text-xl tracking-[0.2em] text-center max-w-[200px] mx-auto"
                            placeholder="000000"
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full py-2.5 font-black text-sm mt-2"
                          >
                            {isSubmitting ? 'Verifikasi...' : 'Verifikasi & Masuk'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setLoginStep(1)}
                            className="btn btn-outline py-1 px-3 text-[10px] font-bold bg-white mx-auto mt-2"
                          >
                            Ganti Email
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // AUTHENTICATED CONFIGURATION FORM
              <div className="card bg-white border-3 border-black p-6 shadow-[4px_4px_0_#000] rounded-sm text-black">
                <h3 className="font-extrabold text-base mb-4 flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  Konfigurasi Pendaftaran Domain
                </h3>

                <div className="flex flex-col gap-4 text-xs font-bold">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider">Durasi Registrasi</label>
                    <select
                      value={registerYears}
                      onChange={(e) => setRegisterYears(Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-bold"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                        <option key={y} value={y}>{y} Tahun</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider">
                      Nameserver Kustom <span className="text-zinc-400 font-normal">(opsional)</span>
                    </label>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                      Biarkan kosong untuk menggunakan Nameserver default yang ditentukan secara otomatis.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <input
                        type="text"
                        value={ns1}
                        onChange={(e) => setNs1(e.target.value)}
                        className="px-3 py-2 border-2 border-black rounded-sm outline-none bg-white placeholder-zinc-400"
                        placeholder="ns1.nameserverkustom.com"
                      />
                      <input
                        type="text"
                        value={ns2}
                        onChange={(e) => setNs2(e.target.value)}
                        className="px-3 py-2 border-2 border-black rounded-sm outline-none bg-white placeholder-zinc-400"
                        placeholder="ns2.nameserverkustom.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Transaction Sidebar */}
          <div className="lg:col-span-5">
            <div className="card bg-zinc-50 border-3 border-black p-6 shadow-[4px_4px_0_#000] rounded-sm text-black sticky top-24">
              <h3 className="font-extrabold text-sm mb-4 border-b-2 border-dashed border-black pb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                Rincian Transaksi Domain
              </h3>

              <div className="flex flex-col gap-4 text-xs font-bold">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Domain Pilihan:</span>
                  <span className="font-mono text-sm text-rose-600 bg-rose-50 border-2 border-black px-3 py-1 rounded-sm shadow-[1px_1px_0_#000] inline-block">
                    {domainParam.toLowerCase()}
                  </span>
                </div>

                <div className="border-t-2 border-black pt-3 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Harga Registrasi ({registerYears} thn):</span>
                    <span>Rp {calcs.basePrice.toLocaleString('id-ID')}</span>
                  </div>
                  {calcs.saving > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Diskon Promo:</span>
                      <span>-Rp {calcs.saving.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {systemSettings.tax_enabled && (
                    <div className="flex justify-between">
                      <span>PPN / Pajak ({calcs.taxRatePercent}%):</span>
                      <span>Rp {calcs.tax.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Biaya Admin:</span>
                    <span className="text-xs font-semibold text-zinc-400">Dihitung saat checkout</span>
                  </div>
                </div>

                <div className="border-t-2 border-black pt-3 flex justify-between items-center text-sm font-black text-rose-600">
                  <span>Estimasi Total:</span>
                  <span className="text-lg">Rp {calcs.subTotal.toLocaleString('id-ID')}</span>
                </div>

                <button
                  onClick={handleProcessOrder}
                  disabled={!loggedIn || isSubmitting}
                  className="btn btn-primary w-full py-3 font-black text-sm mt-2 shadow-[2px_2px_0_#000] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loggedIn ? 'Proses Pendaftaran Domain' : 'Daftar / Masuk Terlebih Dahulu'}
                </button>

                {!loggedIn && (
                  <div className="border-2 border-black bg-amber-50 p-3 rounded-sm text-[10px] leading-relaxed text-zinc-700">
                    Lengkapi pendaftaran akun baru Anda atau lakukan login terlebih dahulu untuk melanjutkan proses pendaftaran domain ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Switch wrapper layouts based on authenticated state to keep the user inside dashboard shell
  if (loggedIn) {
    return (
      <DashboardLayout title="Checkout Domain" activeMenu="domains">
        {domainParam ? (
          renderCheckoutContent()
        ) : (
          <div className="text-left max-w-2xl mx-auto py-8">
            {/* If no domain provided, render domain search state */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black">Memulai Pemesanan Domain Baru</h1>
              <p className="text-xs text-zinc-500 font-bold mt-1">
                Ketik nama domain pilihan Anda untuk mengecek ketersediaan dan melanjutkan ke proses checkout.
              </p>
            </div>

            <div className="card border-3 border-black bg-white shadow-[4px_4px_0_#000] p-6 text-black">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={searchDomainInput}
                  onChange={(e) => setSearchDomainInput(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border-2 border-black rounded-sm bg-white"
                  placeholder="Ketik nama domain (misal: bisnissaya)..."
                  required
                />
                <button type="submit" disabled={isSearching} className="btn btn-primary px-4 text-xs font-black">
                  {isSearching ? 'Mengecek...' : 'Cari'}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="border-t-2 border-black mt-6 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black">Hasil Pencarian: <strong className="text-rose-600">{searchQueryText}</strong></span>
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="text-[10px] font-bold px-2 py-1 border-2 border-black rounded-sm bg-white outline-none w-36"
                      placeholder="Saring ekstensi..."
                    />
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {filteredSearchResults.map((item) => {
                      const isAvailable = item.status === 'available';
                      const isPremium = !!item.is_premium;
                      return (
                        <div key={item.domain} className="flex justify-between items-center p-3 border-2 border-black bg-zinc-50 rounded-sm">
                          <span className="font-extrabold text-xs">{item.domain}</span>
                          <div>
                            {isAvailable ? (
                              <a
                                href={`/dashboard/checkout?domain=${encodeURIComponent(item.domain)}${isPremium ? '&is_premium=true' : ''}`}
                                className="btn btn-primary py-1 px-3 text-xs font-black"
                              >
                                Order
                              </a>
                            ) : (
                              <a
                                href={`/dashboard/whois?domain=${encodeURIComponent(item.domain)}`}
                                className="btn btn-outline py-1 px-3 text-xs font-bold bg-white"
                              >
                                WHOIS
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  // PUBLIC GUEST WRAPPER
  return (
    <Layout title="Checkout Domain">
      <div className="container py-12 max-w-5xl px-4">
        {domainParam ? (
          renderCheckoutContent()
        ) : (
          <div className="text-left max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black">Memulai Pemesanan Domain Baru</h1>
              <p className="text-xs text-zinc-500 font-bold mt-1">
                Ketik nama domain pilihan Anda untuk mengecek ketersediaan dan melanjutkan ke proses checkout.
              </p>
            </div>

            <div className="card border-3 border-black bg-white shadow-[4px_4px_0_#000] p-6 text-black">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={searchDomainInput}
                  onChange={(e) => setSearchDomainInput(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 border-2 border-black rounded-sm bg-white"
                  placeholder="Ketik nama domain (misal: bisnissaya)..."
                  required
                />
                <button type="submit" disabled={isSearching} className="btn btn-primary px-4 text-xs font-black">
                  {isSearching ? 'Mengecek...' : 'Cari'}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="border-t-2 border-black mt-6 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black">Hasil Pencarian: <strong className="text-rose-600">{searchQueryText}</strong></span>
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="text-[10px] font-bold px-2 py-1 border-2 border-black rounded-sm bg-white outline-none w-36"
                      placeholder="Saring ekstensi..."
                    />
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {filteredSearchResults.map((item) => {
                      const isAvailable = item.status === 'available';
                      const isPremium = !!item.is_premium;
                      return (
                        <div key={item.domain} className="flex justify-between items-center p-3 border-2 border-black bg-zinc-50 rounded-sm">
                          <span className="font-extrabold text-xs">{item.domain}</span>
                          <div>
                            {isAvailable ? (
                              <a
                                href={`/checkout?domain=${encodeURIComponent(item.domain)}${isPremium ? '&is_premium=true' : ''}`}
                                className="btn btn-primary py-1 px-3 text-xs font-black"
                              >
                                Order
                              </a>
                            ) : (
                              <a
                                href={`/whois?domain=${encodeURIComponent(item.domain)}`}
                                className="btn btn-outline py-1 px-3 text-xs font-bold bg-white"
                              >
                                WHOIS
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Checkout;
