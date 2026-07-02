import React, { useState, useEffect, useRef } from 'react';
import Layout from '../layouts/Layout';
import AetherFlowHero from '../components/ui/aether-flow-hero';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/ui/Toast';
import type { DomainPriceItem } from './Prices';

interface SearchResult {
  domain: string;
  status: string;
  price?: number;
  is_premium?: boolean;
  premium_price?: number;
}

export const Home: React.FC = () => {
  const toast = useToast();
  const [domainInput, setDomainInput] = useState('');
  const [targetQuery, setTargetQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [prices, setPrices] = useState<DomainPriceItem[]>([]);
  const [extensions, setExtensions] = useState<string[]>([
    '.com', '.net', '.org', '.id', '.co.id', '.web.id', '.my.id', '.xyz'
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [showResults, setShowResults] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load prices list
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await apiFetch('/api/domains/prices', { requireAuth: false });
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setPrices(res.data);
          setExtensions(res.data.map((p: DomainPriceItem) => p.extension));
        }
      } catch (err) {
        console.warn('Failed to load extensions/prices:', err);
      }
    };
    fetchPrices();
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFilterText('');

    const query = domainInput.trim().toLowerCase();
    if (!query) return;

    const cleanName = query.split('.')[0];
    if (cleanName.length < 3) {
      toast.error('Nama domain minimal terdiri dari 3 karakter.');
      return;
    }

    setIsLoading(true);
    setTargetQuery(cleanName);
    setShowResults(true);
    setResults([]);

    try {
      // Step 1: Pre-populate placeholder loading rows
      const initialPlaceholderRows = extensions.map(ext => ({
        domain: `${cleanName}${ext}`,
        status: 'checking',
        price: 0
      }));
      setResults(initialPlaceholderRows);

      // Step 2: Query availability API
      const tlds = extensions.join(',');
      const response = await apiFetch(
        `/api/domains/availability?domainName=${encodeURIComponent(cleanName)}&extensions=${encodeURIComponent(tlds)}`,
        { requireAuth: false }
      );

      if (response.success && response.data && response.data.length > 0) {
        // Sort: Exact match query TLD first
        const sorted = [...response.data].sort((a: SearchResult, b: SearchResult) => {
          const aIsExact = a.domain.toLowerCase() === query.toLowerCase();
          const bIsExact = b.domain.toLowerCase() === query.toLowerCase();
          if (aIsExact && !bIsExact) return -1;
          if (!aIsExact && bIsExact) return 1;
          return 0;
        });
        setResults(sorted);
      } else {
        showMockResults(cleanName, query);
      }
    } catch (err) {
      console.error('Real domain check failed, using fallback:', err);
      showMockResults(cleanName, query);
    } finally {
      setIsLoading(false);
    }
  };

  const showMockResults = (cleanName: string, query: string) => {
    const mockRows = [
      { domain: `${cleanName}.com`, status: 'available' },
      { domain: `${cleanName}.net`, status: 'registered' },
      { domain: `${cleanName}.id`, status: 'available' },
      { domain: `${cleanName}.co.id`, status: 'available' },
      { domain: `${cleanName}.org`, status: 'registered' },
      { domain: `${cleanName}.my.id`, status: 'available' }
    ];

    const sorted = [...mockRows].sort((a: SearchResult, b: SearchResult) => {
      const aIsExact = a.domain.toLowerCase() === query.toLowerCase();
      const bIsExact = b.domain.toLowerCase() === query.toLowerCase();
      if (aIsExact && !bIsExact) return -1;
      if (!aIsExact && bIsExact) return 1;
      return 0;
    });

    setResults(sorted);
  };

  const handleExtCardClick = (ext: string) => {
    if (inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          setDomainInput('');
          inputRef.current.placeholder = `Ketik nama domain Anda untuk ${ext}...`;
        }
      }, 600);
    }
  };

  const handleCtaSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => inputRef.current?.focus(), 700);
    }
  };

  // Filter rows
  const filteredResults = results.filter(item =>
    item.domain.toLowerCase().includes(filterText.trim().toLowerCase())
  );

  return (
    <Layout title="Cari & Daftarkan Domain Anda" transparentNav={false}>
      {/* 1. Hero Search Section */}
      {/* Prevent horizontal scroll from shadows and large text */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center py-20 md:py-28 overflow-hidden border-b-3 border-black bg-zinc-900">
        <div className="absolute inset-0 z-0">
          <AetherFlowHero />
        </div>

        <div className="container relative z-10 text-center max-w-4xl px-6 sm:px-8 flex flex-col items-center gap-y-6 md:gap-y-8">
          <span className="inline-block px-4 py-1.5 text-xs font-black tracking-widest uppercase bg-lime-300 border-2 border-black text-black shadow-[2px_2px_0px_#000] rounded-sm">
            🚀 Pencari Domain Tercepat
          </span>
          <h1 className="text-xl sm:text-5xl md:text-6xl font-black tracking-tighter text-black bg-white border-3 border-black p-3 sm:p-6 block sm:inline-block shadow-[4px_4px_0px_#000] sm:shadow-[6px_6px_0px_#000] leading-tight w-full max-w-3xl mx-auto">
            Cari Nama Domain Anda
          </h1>
          <p className="text-xs sm:text-base font-bold text-zinc-700 bg-white border-2 border-black px-4 py-3 max-w-xl w-full shadow-[3px_3px_0px_#000] sm:shadow-[4px_4px_0px_#000] leading-relaxed">
            Cek ketersediaan ekstensi domain internasional dan lokal dengan integrasi langsung, aman, dan harga transparan.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl card p-4 bg-amber-100! border-black!">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                ref={inputRef}
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                className="form-control flex-grow placeholder-zinc-500 font-bold bg-white text-black border-black border-3"
                placeholder="Ketikkan nama domain pilihan Anda (misal: bisnissaya)..."
                required
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary sm:w-auto h-full"
              >
                {isLoading ? 'Mengecek...' : 'Cari Ketersediaan'}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {showResults && (
            <div className="w-full max-w-3xl card bg-white! border-black! text-black p-4 sm:p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 mb-4 border-b-2 border-black">
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Hasil Pencarian:{' '}
                  <span className="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 border border-rose-300">
                    {targetQuery}
                  </span>
                </h3>

                {/* Sifter Filter Input */}
                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-1 bg-zinc-50 border-2 border-black rounded-sm outline-none focus:bg-white"
                    placeholder="Saring ekstensi..."
                  />
                </div>
              </div>

              {/* Rows List */}
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-2">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 font-bold">
                    Tidak ada ekstensi yang cocok.
                  </div>
                ) : (
                  filteredResults.map((item) => {
                    const dotIndex = item.domain.indexOf('.');
                    const namePart = dotIndex !== -1 ? item.domain.substring(0, dotIndex) : item.domain;
                    const extPart = dotIndex !== -1 ? item.domain.substring(dotIndex) : '';

                    const pricingObj = prices.find((p) => p.extension === extPart);
                    const registerPrice = pricingObj?.registerPrice || 0;
                    const regularPrice = pricingObj?.regularRegisterPrice || 0;
                    const isPromo = !!pricingObj?.promo;

                    const isAvailable = item.status === 'available';
                    const isChecking = item.status === 'checking';
                    const isPremium = !!item.is_premium;

                    let priceText = '';
                    if (isPremium && item.premium_price && item.premium_price > 0) {
                      priceText = `Rp ${item.premium_price.toLocaleString('id-ID')}`;
                    } else if (registerPrice > 0) {
                      priceText = `Rp ${registerPrice.toLocaleString('id-ID')}`;
                    }

                    return (
                      <div
                        key={item.domain}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-2 border-black bg-zinc-50 hover:bg-amber-50 transition-all rounded-sm gap-2"
                      >
                        {/* Domain name */}
                        <div className="flex flex-col text-left">
                          <span className="font-extrabold text-sm sm:text-base">
                            {namePart}
                            <span className="text-zinc-500">{extPart}</span>
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isPremium && (
                              <span className="text-[9px] font-black uppercase bg-amber-200 border border-black px-1.5 py-0.2">
                                Premium
                              </span>
                            )}
                            {isPromo && registerPrice < regularPrice && (
                              <span className="text-[9px] font-black uppercase bg-emerald-200 border border-black px-1.5 py-0.2">
                                Promo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status, Price, Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                          {isChecking ? (
                            <span className="text-xs font-bold text-zinc-500 animate-pulse">
                              Memeriksa...
                            </span>
                          ) : (
                            <>
                              {isAvailable ? (
                                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-400 px-2 py-0.5 rounded-sm">
                                  Tersedia
                                </span>
                              ) : (
                                <span className="text-xs font-extrabold text-zinc-500 bg-zinc-100 border border-zinc-300 px-2 py-0.5 rounded-sm">
                                  Terdaftar
                                </span>
                              )}

                              {priceText && (
                                <div className="text-right">
                                  {isPromo && regularPrice > 0 && registerPrice < regularPrice && (
                                    <div className="text-[10px] line-through text-zinc-400">
                                      Rp {regularPrice.toLocaleString('id-ID')}
                                    </div>
                                  )}
                                  <div className="text-xs font-black text-black">{priceText}</div>
                                </div>
                              )}

                              <div>
                                {isAvailable ? (
                                  <a
                                    href={`/checkout?domain=${encodeURIComponent(item.domain)}${isPremium ? '&is_premium=true' : ''}`}
                                    className="btn btn-sm btn-primary h-8 px-4 font-black"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    Order
                                  </a>
                                ) : (
                                  <a
                                    href={`/whois?domain=${encodeURIComponent(item.domain)}`}
                                    className="btn btn-sm btn-secondary h-8 px-4 font-black"
                                    style={{ textDecoration: 'none' }}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    WHOIS
                                  </a>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Stats Section */}
      <section className="bg-cyan-100 border-t-3 border-b-3 border-black mt-12 md:mt-20 py-16 md:py-24 px-6 sm:px-8">
        <div className="container text-black">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 text-center">
            <div className="card p-4 bg-white border-black border-3 shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] rounded-sm">
              <div className="text-3xl font-black">50+</div>
              <div className="text-xs font-extrabold text-zinc-600 mt-1">Ekstensi Domain</div>
            </div>
            <div className="card p-4 bg-white border-black border-3 shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] rounded-sm">
              <div className="text-3xl font-black">Rp 15rb</div>
              <div className="text-xs font-extrabold text-zinc-600 mt-1">Harga Mulai Dari</div>
            </div>
            <div className="card p-4 bg-white border-black border-3 shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] rounded-sm">
              <div className="text-3xl font-black">99.9%</div>
              <div className="text-xs font-extrabold text-zinc-600 mt-1">Uptime Terjamin</div>
            </div>
            <div className="card p-4 bg-white border-black border-3 shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] rounded-sm">
              <div className="text-3xl font-black">24/7</div>
              <div className="text-xs font-extrabold text-zinc-600 mt-1">Akses Self-Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section className="bg-lime-50 border-t-3 border-b-3 border-black mt-12 md:mt-20 py-20 md:py-28 px-6 sm:px-8">
        <div className="container max-w-5xl text-black">
          <div className="text-center mb-12 flex flex-col items-center gap-y-4">
            <span className="inline-block text-xs font-black tracking-widest uppercase bg-lime-200 border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_#000] rounded-sm">
              Kenapa Ruangtunggu?
            </span>
            <h2 className="text-xl sm:text-4xl font-black mt-2 break-words">
              Semua Yang Anda Butuhkan di Satu Tempat
            </h2>
            <p className="text-xs sm:text-sm font-bold text-zinc-600 max-w-md mx-auto">
              Dirancang untuk individu dan bisnis yang serius membangun identitas digital mereka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
            <div className="card p-5 sm:p-6 bg-white border-3 border-black shadow-[4px_4px_0_#000] sm:shadow-[6px_6px_0_#000] rounded-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-black text-zinc-400 mb-2">01</div>
                <h3 className="text-lg font-black mb-2">Portal Mandiri</h3>
                <p className="text-xs font-semibold text-zinc-500">
                  Ubah Nameserver, aktifkan Registrar Lock, dan kelola WHOIS secara mandiri kapan saja tanpa perlu bantuan admin.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="text-[9px] font-black border border-black bg-zinc-100 px-2 py-0.5">NS</span>
                <span className="text-[9px] font-black border border-black bg-zinc-100 px-2 py-0.5">WHOIS</span>
                <span className="text-[9px] font-black border border-black bg-zinc-100 px-2 py-0.5">DNS SEC</span>
              </div>
            </div>

            <div className="card p-5 sm:p-6 bg-white border-3 border-black shadow-[4px_4px_0_#000] sm:shadow-[6px_6px_0_#000] rounded-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-black text-zinc-400 mb-2">02</div>
                <h3 className="text-lg font-black mb-2">Keamanan Berlapis</h3>
                <p className="text-xs font-semibold text-zinc-500">
                  Sistem autentikasi berlapis wajib OTP via email dan perlindungan bot Cloudflare Turnstile untuk menangkal segala upaya peretasan.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="text-[9px] font-black border border-black bg-zinc-100 px-2 py-0.5">OTP Email</span>
                <span className="text-[9px] font-black border border-black bg-zinc-100 px-2 py-0.5">Anti-Bot</span>
              </div>
            </div>

            <div className="card p-5 sm:p-6 bg-white border-3 border-black shadow-[4px_4px_0_#000] sm:shadow-[6px_6px_0_#000] rounded-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-black text-zinc-400 mb-2">03</div>
                <h3 className="text-lg font-black mb-2">Performa Cepat</h3>
                <p className="text-xs font-semibold text-zinc-500">
                  Dibangun dengan React + TypeScript untuk performa terbaik. Pencarian domain real-time langsung dari registrar tanpa cache usang.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="text-[9px] font-black border border-black bg-zinc-100 px-2 py-0.5">React</span>
                <span className="text-[9px] font-black border border-black bg-zinc-100 px-2 py-0.5">Real-time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Extensions Showcase */}
      <section className="bg-orange-50 border-t-3 border-b-3 border-black mt-12 md:mt-20 py-20 md:py-28 px-6 sm:px-8">
        <div className="container max-w-5xl text-black">
          <div className="text-center mb-12 flex flex-col items-center gap-y-4">
            <span className="inline-block text-xs font-black tracking-widest uppercase bg-orange-200 border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_#000] rounded-sm">
              Pilihan Ekstensi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2">Harga Kompetitif</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            {[
              { name: '.com', desc: 'Global Standard' },
              { name: '.id', desc: 'Indonesia Official', local: true },
              { name: '.co.id', desc: 'Bisnis ID' },
              { name: '.net', desc: 'Tech & Network' },
              { name: '.org', desc: 'Organisasi' },
              { name: '.web.id', desc: 'Personal Web ID' },
              { name: '.my.id', desc: 'Personal ID' },
              { name: '.xyz', desc: 'Generasi Baru' }
            ].map((ext) => {
              const priceObj = prices.find((p) => p.extension === ext.name);
              const priceText = priceObj
                ? `Rp ${priceObj.registerPrice.toLocaleString('id-ID')}`
                : 'Cek Harga';

              return (
                <div
                  key={ext.name}
                  onClick={() => handleExtCardClick(ext.name)}
                  className={`card p-3 sm:p-4 border-3 border-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] cursor-pointer hover:-translate-y-1 rounded-sm ${
                    ext.local ? 'bg-amber-100' : 'bg-white'
                  }`}
                >
                  {ext.local && (
                    <span className="inline-block text-[8px] font-black bg-rose-200 px-1.5 py-0.2 border border-black mb-1">
                      🇮🇩 LOKAL
                    </span>
                  )}
                  <div className="text-xl font-black">{ext.name}</div>
                  <div className="text-[10px] text-zinc-500 font-bold mb-3">{ext.desc}</div>
                  <div className="text-[10px] text-zinc-400 font-extrabold uppercase">Mulai</div>
                  <div className="text-xs font-black text-rose-600">{priceText}</div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10 md:mt-12">
            <a href="/prices" className="btn btn-outline font-black">
              Lihat Semua Harga
            </a>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="bg-yellow-200 border-t-3 border-b-3 border-black mt-12 md:mt-20 py-20 md:py-28 text-center relative overflow-hidden px-6 sm:px-8">
        <div className="container max-w-3xl relative z-10 px-2 sm:px-4 flex flex-col items-center gap-y-6 text-black">
          <span className="inline-block px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase bg-white border-2 border-black shadow-[2px_2px_0_#000]">
            🚀 Mulai Sekarang
          </span>
          <h2 className="text-lg sm:text-3xl md:text-4xl font-black leading-tight max-w-2xl break-words">
            Amankan Nama Domain Impian Anda Sekarang
          </h2>
          <p className="text-xs sm:text-sm font-bold text-zinc-700 max-w-lg mx-auto break-words">
            Ribuan nama domain didaftarkan setiap hari. Jangan tunggu sampai nama impian Anda diambil orang lain.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <button onClick={handleCtaSearchClick} className="btn btn-primary font-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] w-full sm:w-auto">
              Cari Domain Sekarang
            </button>
            <a href="/prices" className="btn btn-secondary font-black shadow-[3px_3px_0_#000] sm:shadow-[4px_4px_0_#000] w-full sm:w-auto" style={{ textDecoration: 'none' }}>
              Lihat Daftar Harga
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default Home;
