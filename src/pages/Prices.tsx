import React, { useState, useEffect } from 'react';
import Layout from '../layouts/Layout';
import { apiFetch } from '../utils/api';

export interface DomainPriceItem {
  extension: string;
  registerPrice: number;
  renewPrice: number;
  regularRegisterPrice: number;
  regularRenewPrice: number;
  transferPrice: number;
  whoisPrice: number;
  promo: boolean;
  registrationByYear?: Record<string, number>;
  renewalByYear?: Record<string, number>;
  regularRegistrationByYear?: Record<string, number>;
}

export const Prices: React.FC = () => {
  const [pricesList, setPricesList] = useState<DomainPriceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<DomainPriceItem | null>(null);

  const limitPerPage = 15;

  const getFallbackPrices = (): DomainPriceItem[] => [
    {
      extension: '.com',
      registerPrice: 145000,
      renewPrice: 165000,
      regularRegisterPrice: 0,
      regularRenewPrice: 0,
      transferPrice: 145000,
      whoisPrice: 15000,
      promo: false,
      registrationByYear: { "1": 145000, "2": 290000, "3": 435000, "5": 725000 },
      renewalByYear: { "1": 165000, "2": 330000, "3": 495000, "5": 825000 }
    },
    {
      extension: '.net',
      registerPrice: 165000,
      renewPrice: 185000,
      regularRegisterPrice: 0,
      regularRenewPrice: 0,
      transferPrice: 165000,
      whoisPrice: 15000,
      promo: false,
      registrationByYear: { "1": 165000, "2": 330000 },
      renewalByYear: { "1": 185000, "2": 370000 }
    },
    {
      extension: '.id',
      registerPrice: 200000,
      renewPrice: 220000,
      regularRegisterPrice: 250000,
      regularRenewPrice: 0,
      transferPrice: 200000,
      whoisPrice: 0,
      promo: true,
      registrationByYear: { "1": 200000, "2": 420000, "3": 640000, "5": 1080000 },
      renewalByYear: { "1": 220000, "2": 440000, "3": 660000, "5": 1100000 },
      regularRegistrationByYear: { "1": 250000, "2": 470000, "3": 690000, "5": 1130000 }
    },
    {
      extension: '.my.id',
      registerPrice: 9500,
      renewPrice: 15000,
      regularRegisterPrice: 15000,
      regularRenewPrice: 0,
      transferPrice: 15000,
      whoisPrice: 0,
      promo: true,
      registrationByYear: { "1": 9500, "2": 24500, "5": 69500 },
      renewalByYear: { "1": 15000, "2": 30000, "5": 75000 },
      regularRegistrationByYear: { "1": 15000, "2": 30000, "5": 75000 }
    },
    {
      extension: '.web.id',
      registerPrice: 50000,
      renewPrice: 60000,
      regularRegisterPrice: 0,
      regularRenewPrice: 0,
      transferPrice: 50000,
      whoisPrice: 0,
      promo: false,
      registrationByYear: { "1": 50000, "2": 100000 },
      renewalByYear: { "1": 60000, "2": 120000 }
    },
    {
      extension: '.xyz',
      registerPrice: 38000,
      renewPrice: 185000,
      regularRegisterPrice: 185000,
      regularRenewPrice: 0,
      transferPrice: 185000,
      whoisPrice: 15000,
      promo: true,
      registrationByYear: { "1": 38000, "2": 223000 },
      renewalByYear: { "1": 185000, "2": 370000 },
      regularRegistrationByYear: { "1": 185000, "2": 370000 }
    }
  ];

  useEffect(() => {
    const loadPrices = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch('/api/domains/prices', { requireAuth: false });
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setPricesList(res.data);
        } else {
          throw new Error('Data empty');
        }
      } catch (err) {
        console.warn('Realtime prices fetch failed, using fallback:', err);
        setPricesList(getFallbackPrices());
      } finally {
        setIsLoading(false);
      }
    };
    loadPrices();
  }, []);

  const checkCategory = (item: DomainPriceItem, category: string): boolean => {
    const ext = item.extension.toLowerCase();
    if (category === 'all') return true;
    if (category === 'promo') return !!item.promo;
    if (category === 'id') {
      return ext.endsWith('.id') || ext.includes('.id.');
    }
    if (category === 'popular') {
      const populars = ['.com', '.net', '.org', '.id', '.co.id', '.info', '.xyz'];
      return populars.includes(ext);
    }
    return true;
  };

  const getRestorePrice = (extension: string, renewPrice: number): number => {
    const ext = extension.toLowerCase();
    if (ext === '.id') return renewPrice + 800000;
    if (ext === '.co.id') return renewPrice + 1200000;
    if (ext.endsWith('.id')) return renewPrice + 198000;
    return renewPrice + 1200000;
  };

  const formatCurrency = (amount: number): string => {
    return 'Rp' + amount.toLocaleString('id-ID', { minimumFractionDigits: 0 }).replace(/,/g, '.');
  };

  // Filter prices
  const filteredPrices = pricesList.filter(item => {
    const matchSearch = item.extension.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = checkCategory(item, currentCategory);
    return matchSearch && matchCategory;
  });

  const totalItems = filteredPrices.length;
  const totalPages = Math.ceil(totalItems / limitPerPage);
  const activePage = currentPage > totalPages ? Math.max(1, totalPages) : currentPage;

  const startIdx = (activePage - 1) * limitPerPage;
  const pageItems = filteredPrices.slice(startIdx, startIdx + limitPerPage);

  return (
    <Layout title="Harga">
      <div className="container py-10 min-h-[70vh] text-left px-4">
        {/* Header */}
        <div className="border-b-3 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black flex items-center gap-2">
            <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            Harga Ekstensi Domain
          </h1>
          <p className="text-xs sm:text-sm font-bold text-zinc-500 mt-2">
            Lihat harga pendaftaran, perpanjangan, dan transfer domain secara realtime langsung dari registrar.
          </p>
        </div>

        {/* Filters Card */}
        <div className="card p-4 mb-6 bg-zinc-50 border-black border-3 shadow-md rounded-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Live Search */}
            <div className="w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-sm font-bold px-4 py-3 bg-white border-3 border-black rounded-sm outline-none focus:bg-white text-black shadow-[4px_4px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_#000] transition-all"
                placeholder="Cari TLD (contoh: .id, .com)..."
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Semua' },
                { key: 'popular', label: 'Populer' },
                { key: 'id', label: 'Indonesian (.ID)' },
                { key: 'promo', label: 'Sedang Promo 🔥' }
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setCurrentCategory(cat.key);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-3 text-sm font-black border-3 border-black rounded-sm transition-all cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] ${
                    currentCategory === cat.key
                      ? 'bg-[var(--accent-primary)] shadow-[2px_2px_0_0_#000] translate-x-[2px] translate-y-[2px]'
                      : 'bg-white shadow-[4px_4px_0_0_#000]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prices Table Card */}
        <div className="card p-0 bg-white border-black border-3 shadow-[4px_4px_0_#000] rounded-sm overflow-hidden mb-10">
          {isLoading ? (
            <div className="text-center py-16 text-zinc-500 font-bold">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black mx-auto mb-4" />
              Memuat harga realtime...
            </div>
          ) : pageItems.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 font-bold">
              Tidak ada ekstensi yang cocok dengan filter pencarian.
            </div>
          ) : (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Extension</th>
                    <th className="text-right">Registration</th>
                    <th className="text-right">Transfer</th>
                    <th className="text-right">Renewal</th>
                    <th className="text-right">Restore</th>
                    <th className="text-center" style={{ width: '120px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => {
                    const isPromoActive =
                      item.promo &&
                      item.regularRegisterPrice > 0 &&
                      item.registerPrice < item.regularRegisterPrice;

                    return (
                      <tr key={item.extension} className="hover:bg-zinc-50">
                        <td className="font-extrabold">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-600 bg-cyan-50 px-2 py-0.5 border border-cyan-300">
                              {item.extension}
                            </span>
                            {item.promo && (
                              <span className="text-[9px] font-black uppercase bg-emerald-200 border border-black px-1.5 py-0.2">
                                Promo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right font-bold">
                          {isPromoActive ? (
                            <div className="flex flex-col items-end">
                              <span className="line-through text-[10px] text-zinc-400">
                                {formatCurrency(item.regularRegisterPrice)}
                              </span>
                              <span className="text-red-600">
                                {formatCurrency(item.registerPrice)}
                              </span>
                            </div>
                          ) : (
                            formatCurrency(item.registerPrice)
                          )}
                        </td>
                        <td className="text-right font-extrabold">
                          {formatCurrency(item.transferPrice)}
                        </td>
                        <td className="text-right font-extrabold">
                          {formatCurrency(item.renewPrice)}
                        </td>
                        <td className="text-right font-extrabold">
                          {formatCurrency(getRestorePrice(item.extension, item.renewPrice))}
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="btn btn-sm btn-secondary hover:bg-[var(--accent-light)] px-3 py-1 font-bold"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 bg-zinc-50 border-t-3 border-black flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500">
                    Halaman {activePage} dari {totalPages} (Total {totalItems} ekstensi)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={activePage === 1}
                      className="btn btn-sm btn-secondary px-3 py-1 bg-white hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black font-bold"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={activePage >= totalPages}
                      className="btn btn-sm btn-secondary px-3 py-1 bg-white hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black font-bold"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Details Comparison Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-3 border-black p-5 w-full max-w-xl shadow-[8px_8px_0_#000] relative">
            <div className="flex justify-between items-center border-b-3 border-black pb-3 mb-4">
              <h3 className="text-md font-black flex items-center gap-1.5">
                <span>Detail Harga Lengkap:</span>
                <span className="font-mono text-cyan-600 bg-cyan-50 px-2 py-0.5 border border-cyan-300">
                  {selectedItem.extension}
                </span>
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="font-black text-lg text-zinc-500 hover:text-black border-none bg-transparent cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Registration column */}
              <div className="p-3 bg-zinc-50 border-2 border-black">
                <h4 className="text-xs font-black text-rose-600 border-b-2 border-dashed border-black pb-1 mb-2">
                  Pendaftaran (Register)
                </h4>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-300 text-[10px] text-zinc-400">
                      <th className="py-1">Tahun</th>
                      <th className="py-1 text-right">Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selectedItem.registrationByYear || {}).map(([yr, price]: [string, unknown]) => {
                      const numPrice = price as number;
                      const regPrice = selectedItem.regularRegistrationByYear?.[yr] || 0;
                      const isPromoActive =
                        selectedItem.promo && regPrice > 0 && numPrice < regPrice;

                      return (
                        <tr key={yr} className="border-b border-zinc-200">
                          <td className="py-1.5 font-bold">{yr} Tahun</td>
                          <td className="py-1.5 text-right font-black">
                            {isPromoActive ? (
                              <div className="flex flex-col items-end">
                                <span className="line-through text-[9px] text-zinc-400">
                                  {formatCurrency(regPrice)}
                                </span>
                                <span className="text-red-600">{formatCurrency(numPrice)}</span>
                              </div>
                            ) : (
                              formatCurrency(numPrice)
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Renewal column */}
              <div className="p-3 bg-zinc-50 border-2 border-black">
                <h4 className="text-xs font-black text-emerald-600 border-b-2 border-dashed border-black pb-1 mb-2">
                  Perpanjangan (Renewal)
                </h4>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-300 text-[10px] text-zinc-400">
                      <th className="py-1">Tahun</th>
                      <th className="py-1 text-right">Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selectedItem.renewalByYear || {}).map(([yr, price]: [string, unknown]) => (
                      <tr key={yr} className="border-b border-zinc-200">
                        <td className="py-1.5 font-bold">{yr} Tahun</td>
                        <td className="py-1.5 text-right font-black text-zinc-800">
                          {formatCurrency(price as number)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Extra Info */}
            <div className="bg-amber-50 border-2 border-black p-3 text-xs font-bold leading-normal text-zinc-700">
              <div><strong>Informasi Tambahan:</strong></div>
              <ul className="list-disc list-inside mt-1 flex flex-col gap-1 text-[11px]">
                <li>
                  Transfer Domain:{' '}
                  <span className="text-black font-black">
                    {formatCurrency(selectedItem.transferPrice || 0)}
                  </span>{' '}
                  (Termasuk penambahan masa aktif 1 tahun)
                </li>
                <li>
                  WHOIS Privacy Protection:{' '}
                  <span className="text-black font-black">
                    {selectedItem.whoisPrice > 0
                      ? formatCurrency(selectedItem.whoisPrice)
                      : 'GRATIS / FREE'}
                  </span>
                </li>
                {(selectedItem.extension.toLowerCase().endsWith('.id') ||
                  selectedItem.extension.toLowerCase().includes('.id.')) && (
                  <li className="text-orange-600 font-extrabold mt-1">
                    ⚠️ Domain Indonesia (.ID) memerlukan persyaratan verifikasi dokumen (KTP/SK).
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default Prices;
