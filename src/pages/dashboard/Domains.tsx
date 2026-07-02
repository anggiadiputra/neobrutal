import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import type { DomainPriceItem } from '../Prices';

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

interface DomainItem {
  id: number | string;
  name?: string;
  domain_name?: string;
  domain?: string;
  status: number;
  expired_at?: string;
  created_at?: string;
  registered_at?: string;
  created?: string;
  [key: string]: unknown;
}

export const Domains: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  
  // Search & filter
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Domain search / availability check (collapsible)
  const [showSearchSection, setShowSearchSection] = useState(() => {
    return new URLSearchParams(window.location.search).get('new') === '1';
  });
  const [newDomainInput, setNewDomainInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQueryText, setSearchQueryText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [pricesCache, setPricesCache] = useState<DomainPriceItem[]>([]);
  const [extensionsCache, setExtensionsCache] = useState<string[]>([
    '.com', '.net', '.org', '.id', '.co.id', '.web.id', '.my.id', '.xyz'
  ]);
  const [resultsFilter, setResultsFilter] = useState('');

  // Checkout Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalDomain, setModalDomain] = useState('');
  const [modalIsPremium, setModalIsPremium] = useState(false);
  const [modalPremiumPrice, setModalPremiumPrice] = useState(0);
  const [modalYears, setModalYears] = useState(1);
  const [modalNs1, setModalNs1] = useState('');
  const [modalNs2, setModalNs2] = useState('');
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    tax_enabled: true,
    tax_rate: 11
  });

  // Load registered domains
  const loadDomains = async () => {
    setIsLoading(true);
    setIsEmpty(false);
    try {
      const q = new URLSearchParams();
      q.append('page', String(currentPage));
      q.append('limit', String(limit));
      if (searchInput.trim()) q.append('name', searchInput.trim());
      if (statusFilter) q.append('status', statusFilter);

      const res = await apiFetch(`/api/domains?${q.toString()}`);
      if (res.success && res.data && res.data.length > 0) {
        setDomains(res.data);
        const meta = res.meta || {};
        const total = meta.total || res.data.length;
        setTotalPages(meta.last_page || Math.ceil(total / limit) || 1);
        setTotalItems(total);
      } else {
        setDomains([]);
        setIsEmpty(true);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to load domains:', err);
      setDomains([]);
      setIsEmpty(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load prices list & settings
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const pricesRes = await apiFetch('/api/domains/prices', { requireAuth: false });
        if (pricesRes.success && Array.isArray(pricesRes.data) && pricesRes.data.length > 0) {
          setPricesCache(pricesRes.data);
          setExtensionsCache(pricesRes.data.map((p: DomainPriceItem) => p.extension));
        }

        const settingsRes = await apiFetch('/api/settings', { requireAuth: false });
        if (settingsRes && settingsRes.success && settingsRes.data) {
          setSystemSettings(settingsRes.data);
        }
      } catch (err) {
        console.warn('Failed to load init data:', err);
      }
    };
    fetchInitData();
  }, []);

  // Reload domains on pagination, filter or search changes
  useEffect(() => {
    loadDomains();
  }, [currentPage, statusFilter]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadDomains();
  };

  // Domain search / checking availability
  const handleAvailabilityCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultsFilter('');
    const query = newDomainInput.trim().toLowerCase();
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
      // 1. Populate loaders
      const initialPlaceholderRows = extensionsCache.map(ext => ({
        domain: `${cleanName}${ext}`,
        status: 'checking',
        price: 0
      }));
      setSearchResults(initialPlaceholderRows);

      // 2. Query API
      const tlds = extensionsCache.join(',');
      const response = await apiFetch(
        `/api/domains/availability?domainName=${encodeURIComponent(cleanName)}&extensions=${encodeURIComponent(tlds)}`,
        { requireAuth: false }
      );

      if (response.success && response.data) {
        const sorted = [...response.data].sort((a: SearchResult, b: SearchResult) => {
          const aExact = a.domain.toLowerCase() === query.toLowerCase();
          const bExact = b.domain.toLowerCase() === query.toLowerCase();
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return 0;
        });
        setSearchResults(sorted);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Availability check failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Open Checkout Modal
  const openCheckout = (domain: string, isPremium: boolean, premiumPrice: number) => {
    setModalDomain(domain);
    setModalIsPremium(isPremium);
    setModalPremiumPrice(premiumPrice);
    setModalYears(1);
    setModalNs1('');
    setModalNs2('');
    setShowModal(true);
  };

  // Calculate Modal Price
  const getModalPriceDetails = () => {
    let registerPrice = 0;
    let regularPrice = 0;
    
    const dotIdx = modalDomain.indexOf('.');
    const ext = dotIdx !== -1 ? modalDomain.substring(dotIdx) : '';
    const pricingObj = pricesCache.find((p) => p.extension === ext) || null;

    if (modalIsPremium && modalPremiumPrice > 0) {
      registerPrice = modalPremiumPrice * modalYears;
      regularPrice = modalPremiumPrice * modalYears;
    } else if (pricingObj) {
      if (pricingObj.registrationByYear) {
        const yearPrice = pricingObj.registrationByYear[String(modalYears)];
        registerPrice = yearPrice || (pricingObj.registerPrice * modalYears);

        if (pricingObj.promo) {
          if (pricingObj.regularRegistrationByYear) {
            const regYP = pricingObj.regularRegistrationByYear[String(modalYears)];
            if (regYP) regularPrice = regYP;
          }
          if (!regularPrice && pricingObj.regularRegisterPrice > 0) {
            regularPrice = pricingObj.regularRegisterPrice * modalYears;
          }
        } else {
          regularPrice = registerPrice;
        }
      } else {
        registerPrice = pricingObj.registerPrice * modalYears;
        regularPrice = (pricingObj.regularRegisterPrice || pricingObj.registerPrice) * modalYears;
      }
    }

    const taxRatePercent = systemSettings.tax_enabled ? (systemSettings.tax_rate || 0) : 0;
    const tax = Math.round(registerPrice * (taxRatePercent / 100));
    const subTotal = registerPrice + tax;
    const saving = regularPrice - registerPrice;

    return {
      registerPrice,
      regularPrice,
      saving,
      tax,
      subTotal,
      taxRatePercent
    };
  };

  const handleModalConfirm = () => {
    if ((modalNs1 && !modalNs2) || (!modalNs1 && modalNs2)) {
      toast.warning('Jika menggunakan nameserver kustom, silakan isi minimal 2 nameservers.');
      return;
    }

    const dotIdx = modalDomain.indexOf('.');
    const domainName = dotIdx !== -1 ? modalDomain.substring(0, dotIdx) : modalDomain;
    const domainExtension = dotIdx !== -1 ? modalDomain.substring(dotIdx).replace(/^\./, '') : '';
    const calc = getModalPriceDetails();

    const pendingCheckout = {
      domainName,
      domainExtension,
      years: modalYears,
      ns: modalNs1 && modalNs2 ? [modalNs1, modalNs2] : [],
      price: calc.registerPrice,
      regularPrice: calc.regularPrice,
      isPromo: !modalIsPremium && calc.saving > 0,
      isPremium: modalIsPremium
    };

    sessionStorage.setItem('pending_domain_checkout', JSON.stringify(pendingCheckout));
    setShowModal(false);
    navigate('/dashboard/domains/payment');
  };

  const calcDetails = getModalPriceDetails();

  // Filter search results
  const filteredSearchResults = searchResults.filter(item =>
    item.domain.toLowerCase().includes(resultsFilter.trim().toLowerCase())
  );

  return (
    <DashboardLayout title="Domains" activeMenu="domains">
      <div className="text-left">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-3 border-black pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black">Domains</h1>
            <p className="text-xs sm:text-sm font-bold text-zinc-500 mt-2">
              Kelola nama domain Anda dengan mudah
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/dashboard/domains/transfer"
              className="btn btn-outline flex items-center gap-2 font-bold text-sm bg-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="m16 3 4 4-4 4" />
                <path d="M20 7H9a4 4 0 0 0-4 4v9" />
                <path d="m8 21-4-4 4-4" />
                <path d="M4 17h11a4 4 0 0 0 4-4V4" />
              </svg>
              Transfer Domain
            </a>
            <button
              onClick={() => setShowSearchSection(!showSearchSection)}
              type="button"
              className="btn btn-primary flex items-center gap-2 font-black text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Daftar Domain
            </button>
          </div>
        </div>

        {/* Collapsible Domain Search Box */}
        {showSearchSection && (
          <div className="card border-3 border-black bg-amber-50 shadow-[4px_4px_0_#000] p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 border-3 border-black bg-[var(--accent-primary)] flex items-center justify-center rounded-sm shadow-[2px_2px_0_0_#000]">
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Cari & Daftarkan Domain Baru</h3>
                  <p className="text-xs text-zinc-600 font-bold mt-0.5">
                    Ketik nama domain untuk mengecek ketersediaan di semua ekstensi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSearchSection(false)}
                className="w-8 h-8 border-3 border-black bg-white hover:bg-zinc-100 flex items-center justify-center rounded-sm font-black text-sm shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAvailabilityCheck} className="flex gap-3 mb-4">
              <div className="relative flex-grow">
                <svg className="w-5 h-5 text-black absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
                </svg>
                <input
                  type="text"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  className="w-full text-sm font-bold pl-10 pr-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_#000] transition-all"
                  placeholder="Ketik nama domain (misal: bisnissaya)..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-[var(--accent-primary)] text-black px-8 py-3 font-black text-sm border-3 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all rounded-sm flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {isSearching ? 'Mengecek...' : 'Cari'}
              </button>
            </form>

            {/* Availability Search Results */}
            {searchResults.length > 0 && (
              <div className="border-t-2 border-black pt-4 mt-4 text-black">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <span className="text-xs font-black uppercase">
                    Hasil pencarian untuk:{' '}
                    <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 border border-rose-300">
                      {searchQueryText}
                    </span>
                  </span>
                  <input
                    type="text"
                    value={resultsFilter}
                    onChange={(e) => setResultsFilter(e.target.value)}
                    className="w-full sm:w-44 text-[11px] font-bold px-2 py-1 border-2 border-black rounded-sm bg-white outline-none"
                    placeholder="Saring ekstensi..."
                  />
                </div>

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {filteredSearchResults.map((item) => {
                    const dotIndex = item.domain.indexOf('.');
                    const namePart = dotIndex !== -1 ? item.domain.substring(0, dotIndex) : item.domain;
                    const extPart = dotIndex !== -1 ? item.domain.substring(dotIndex) : '';

                    const isAvailable = item.status === 'available';
                    const isChecking = item.status === 'checking';
                    const isPremium = !!item.is_premium;

                    const pricingObj = pricesCache.find((p) => p.extension === extPart);
                    const isPromo = pricingObj?.promo && pricingObj.regularRegisterPrice > pricingObj.registerPrice;

                    let priceText = '';
                    if (isPremium && item.premium_price && item.premium_price > 0) {
                      priceText = `Rp ${item.premium_price.toLocaleString('id-ID')}`;
                    } else if (pricingObj) {
                      priceText = `Rp ${pricingObj.registerPrice.toLocaleString('id-ID')}`;
                    }

                    return (
                      <div
                        key={item.domain}
                        className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center p-3 border-2 border-black bg-white shadow-[2px_2px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#000] transition-all rounded-sm gap-2"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-sm">
                              {namePart}
                              <span className="text-zinc-500">{extPart}</span>
                            </span>
                            {isPremium && (
                              <span className="text-[9px] font-black bg-amber-200 border border-black px-1.5 py-0.2">
                                Premium
                              </span>
                            )}
                            {isPromo && (
                              <span className="text-[9px] font-black bg-emerald-200 border border-black px-1.5 py-0.2">
                                Promo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {isChecking ? (
                              <span className="text-[10px] text-zinc-500 animate-pulse font-bold">Memeriksa...</span>
                            ) : isAvailable ? (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 border border-emerald-300">Tersedia</span>
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-50 px-1.5 border border-zinc-300">Terdaftar</span>
                            )}

                            {priceText && (
                              <span className="text-xs font-black text-black">
                                • {priceText}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          {isAvailable ? (
                            <button
                              onClick={() => openCheckout(item.domain, isPremium, isPremium ? (item.premium_price || 0) : 0)}
                              type="button"
                              className="btn btn-primary py-1 px-3 text-xs font-black"
                            >
                              Daftarkan
                            </button>
                          ) : (
                            <a
                              href={`/dashboard/whois?domain=${encodeURIComponent(item.domain)}`}
                              className="btn btn-outline py-1 px-3 text-xs font-bold bg-white text-center"
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
        )}

        {/* Filter and Search Bar */}
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 mb-6 items-center">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="text-sm font-bold px-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_#000] transition-all w-full sm:max-w-xs"
            placeholder="Cari nama domain..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm font-bold px-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all w-full sm:max-w-[160px] cursor-pointer appearance-none"
            style={{ backgroundImage: 'var(--select-arrow-bg)', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', paddingRight: '36px' }}
          >
            <option value="">Semua Status</option>
            <option value="1">Aktif</option>
            <option value="2">Expired</option>
            <option value="0">Pending</option>
            <option value="7">Suspended</option>
          </select>
          <button type="submit" className="bg-white px-6 py-3 font-black text-sm border-3 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all rounded-sm">
            Filter
          </button>
          <button
            type="button"
            onClick={loadDomains}
            className="bg-white px-5 py-3 font-black text-sm border-3 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all ml-auto flex items-center gap-2 rounded-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Refresh
          </button>
        </form>

        {/* Domains Listing Table */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 font-bold gap-3">
              <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-xs">Memuat daftar domain...</p>
            </div>
          ) : isEmpty ? (
            <div className="py-12 px-6 text-center">
              <div className="text-4xl mb-3">👋</div>
              <h3 className="font-extrabold text-base mb-1">Belum Ada Domain Terdaftar</h3>
              <p className="text-xs text-zinc-500 font-bold max-w-sm mx-auto mb-4">
                {searchInput || statusFilter
                  ? 'Tidak ada domain yang cocok dengan pencarian atau status filter.'
                  : 'Anda belum memiliki domain di akun ini. Daftarkan domain pertama Anda sekarang!'}
              </p>
              {!searchInput && !statusFilter && (
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setShowSearchSection(true);
                      setTimeout(() => (document.querySelector('input[placeholder*="bisnissaya"]') as HTMLElement)?.focus(), 200);
                    }}
                    type="button"
                    className="btn btn-primary text-xs font-black"
                  >
                    Daftar Domain Baru
                  </button>
                  <a
                    href="/dashboard/domains/transfer"
                    className="btn btn-outline text-xs font-bold bg-white"
                  >
                    Transfer Domain
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-bold text-black">
                  <thead>
                    <tr className="bg-zinc-100 border-b-3 border-black">
                      <th className="p-4 border-r-2 border-black">Nama Domain</th>
                      <th className="p-4 border-r-2 border-black">Status</th>
                      <th className="p-4 border-r-2 border-black text-right">Durasi</th>
                      <th className="p-4 border-r-2 border-black">Tanggal Registrasi</th>
                      <th className="p-4 border-r-2 border-black">Tanggal Kadaluarsa</th>
                      <th className="p-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map((domain) => {
                      const name = domain.name || domain.domain_name || domain.domain || '-';
                      const sc = domain.status;
                      let badgeColor = 'bg-emerald-200';
                      let statusText = 'active';
                      if (sc === 0) {
                        badgeColor = 'bg-amber-200';
                        statusText = 'pending';
                      } else if (sc === 2) {
                        badgeColor = 'bg-rose-200';
                        statusText = 'expired';
                      } else if (sc === 3) {
                        badgeColor = 'bg-rose-200';
                        statusText = 'pend. delete';
                      } else if (sc === 7) {
                        badgeColor = 'bg-zinc-300';
                        statusText = 'suspended';
                      }

                      let expDisplay = '-';
                      let remainHTML = null;
                      if (domain.expired_at) {
                        const exp = new Date(domain.expired_at);
                        expDisplay = exp.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                        const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000);
                        if (daysLeft > 0) {
                          const cls = daysLeft <= 14 ? 'text-red-600' : daysLeft <= 30 ? 'text-amber-600' : 'text-zinc-400';
                          remainHTML = <div className={`text-[10px] font-bold ${cls} mt-0.5`}>{daysLeft} hari tersisa</div>;
                        } else {
                          remainHTML = <div className="text-[10px] font-bold text-red-600 mt-0.5">Expired</div>;
                        }
                      }

                      let regDisplay = '-';
                      const regDateStr = domain.created_at || domain.registered_at || domain.created;
                      if (regDateStr) {
                        const reg = new Date(regDateStr);
                        regDisplay = reg.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                      }

                      return (
                        <tr key={domain.id} className="border-b-2 border-black hover:bg-zinc-50">
                          <td className="p-4 border-r-2 border-black font-extrabold text-sm text-rose-600">
                            {name}
                          </td>
                          <td className="p-4 border-r-2 border-black">
                            <span className={`inline-block px-2.5 py-0.5 border-2 border-black text-[10px] font-black uppercase rounded-sm shadow-[1px_1px_0_#000] ${badgeColor}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="p-4 border-r-2 border-black text-right">
                            <div className="font-extrabold">1 Tahun</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">Rp 120.000</div>
                          </td>
                          <td className="p-4 border-r-2 border-black text-zinc-500">{regDisplay}</td>
                          <td className="p-4 border-r-2 border-black text-right">
                            <div className="font-extrabold">{expDisplay}</div>
                            {remainHTML}
                          </td>
                          <td className="p-4">
                            <a
                              href={`/dashboard/domains/${domain.id}`}
                              className="btn btn-outline py-1 px-3 text-xs font-black bg-white inline-flex items-center gap-1 hover:bg-amber-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                              Kelola
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card-List View */}
              <div className="block md:hidden text-xs">
                {domains.map((domain) => {
                  const name = domain.name || domain.domain_name || domain.domain || '-';
                  const sc = domain.status;
                  let badgeColor = 'bg-emerald-200';
                  let statusText = 'active';
                  if (sc === 0) {
                    badgeColor = 'bg-amber-200';
                    statusText = 'pending';
                  } else if (sc === 2) {
                    badgeColor = 'bg-rose-200';
                    statusText = 'expired';
                  } else if (sc === 3) {
                    badgeColor = 'bg-rose-200';
                    statusText = 'pend. delete';
                  } else if (sc === 7) {
                    badgeColor = 'bg-zinc-300';
                    statusText = 'suspended';
                  }

                  let expDisplay = '-';
                  let remainHTML = null;
                  if (domain.expired_at) {
                    const exp = new Date(domain.expired_at);
                    expDisplay = exp.toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                    const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000);
                    if (daysLeft > 0) {
                      const cls = daysLeft <= 14 ? 'text-red-600' : daysLeft <= 30 ? 'text-amber-600' : 'text-zinc-400';
                      remainHTML = <span className={`text-[10px] font-bold ${cls} ml-2`}>({daysLeft} hari lagi)</span>;
                    }
                  }

                  return (
                    <div key={domain.id} className="p-4 border-b-2 border-black text-left flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-sm text-rose-600">{name}</span>
                        <span className={`inline-block px-2 py-0.5 border-2 border-black text-[9px] font-black uppercase rounded-sm ${badgeColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1 text-zinc-500 font-bold">
                        <span>Kadaluarsa:</span>
                        <span className="text-black">
                          {expDisplay} {remainHTML}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-zinc-200">
                        <span className="text-zinc-400">1 Thn • Rp 120.000</span>
                        <a
                          href={`/dashboard/domains/${domain.id}`}
                          className="btn btn-outline py-1 px-3 text-xs font-black bg-white inline-flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                          Kelola
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination Footer */}
          {!isLoading && !isEmpty && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t-3 border-black bg-zinc-50 gap-4">
              <span className="text-xs font-bold text-zinc-500">
                Halaman {currentPage} dari {totalPages} (Total: {totalItems})
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="btn btn-outline flex-grow sm:flex-none py-1.5 px-3 text-xs font-bold bg-white"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="btn btn-outline flex-grow sm:flex-none py-1.5 px-3 text-xs font-bold bg-white"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CHECKOUT CONFIGURATION MODAL (NEOBRUTALISM STYLE) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative card border-3 border-black bg-white shadow-[8px_8px_0_#000] max-w-md w-full overflow-hidden text-left animate-fade-in z-10 p-0!">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b-3 border-black bg-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 border-2 border-black bg-rose-300 flex items-center justify-center rounded-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">Konfigurasi Pendaftaran</h3>
                  <p className="font-mono text-xs text-rose-600 font-bold mt-0.5">{modalDomain}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 border-2 border-black bg-white hover:bg-zinc-100 flex items-center justify-center rounded-sm font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4 text-xs font-bold text-black max-h-[70vh] overflow-y-auto">
              {/* Premium Alert */}
              {modalIsPremium && (
                <div className="border-2 border-black bg-amber-50 p-3 rounded-sm flex gap-2">
                  <span className="text-lg">⚠️</span>
                  <p className="text-[11px] leading-relaxed">
                    Domain ini adalah domain <strong className="text-rose-600">premium</strong> dengan harga khusus dari registry.
                  </p>
                </div>
              )}

              {/* Years Duration Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider">Durasi Registrasi</label>
                <select
                  value={modalYears}
                  onChange={(e) => setModalYears(Number(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => (
                    <option key={y} value={y}>{y} Tahun</option>
                  ))}
                </select>
              </div>

              {/* Nameservers Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider">
                  Nameserver Kustom <span className="text-zinc-400 font-normal">(opsional)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={modalNs1}
                    onChange={(e) => setModalNs1(e.target.value)}
                    className="px-3 py-2 border-2 border-black rounded-sm outline-none bg-white placeholder-zinc-400"
                    placeholder="ns1.example.com"
                  />
                  <input
                    type="text"
                    value={modalNs2}
                    onChange={(e) => setModalNs2(e.target.value)}
                    className="px-3 py-2 border-2 border-black rounded-sm outline-none bg-white placeholder-zinc-400"
                    placeholder="ns2.example.com"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 font-bold leading-normal mt-0.5">
                  Kosongkan untuk menggunakan nameserver bawaan Ruangtunggu.
                </p>
              </div>

              {/* Pricing breakdown summary */}
              <div className="border-2 border-black bg-zinc-50 p-4 rounded-sm flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Harga Registrasi ({modalYears} thn):</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {calcDetails.saving > 0 ? (
                      <>
                        <span className="text-zinc-400 line-through text-xs">Rp {calcDetails.regularPrice.toLocaleString('id-ID')}</span>
                        <span className="text-emerald-600 font-extrabold">Rp {calcDetails.registerPrice.toLocaleString('id-ID')}</span>
                      </>
                    ) : (
                      <span>Rp {calcDetails.registerPrice.toLocaleString('id-ID')}</span>
                    )}
                  </div>
                </div>
                {systemSettings.tax_enabled && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">PPN / Pajak ({calcDetails.taxRatePercent}%):</span>
                    <span>Rp {calcDetails.tax.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Biaya Admin:</span>
                  <span className="text-xs font-semibold text-zinc-400">Dihitung saat checkout</span>
                </div>
                <div className="border-t border-dashed border-black pt-2 mt-1 flex justify-between items-center text-sm font-black text-rose-600">
                  <span>Estimasi Total:</span>
                  <span className="text-lg">Rp {calcDetails.subTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {calcDetails.saving > 0 && (
                <div className="bg-emerald-100 border-2 border-black p-3.5 mt-3 font-bold text-[11px] text-emerald-800 flex items-start gap-2.5 shadow-[2px_2px_0px_#000]">
                  <span className="text-sm">🎉</span>
                  <span>Selamat! Anda mendapatkan Harga Promo spesial untuk pendaftaran domain ini.</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 p-5 border-t-3 border-black bg-zinc-50">
              <button
                onClick={() => setShowModal(false)}
                type="button"
                className="btn btn-outline py-2.5 flex-1 font-bold bg-white"
              >
                Batal
              </button>
              <button
                onClick={handleModalConfirm}
                type="button"
                className="btn btn-primary py-2.5 flex-[2] font-black text-center"
              >
                Lanjutkan Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Domains;
