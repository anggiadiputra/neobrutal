import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { apiFetch } from '../../utils/api';

export default function Billing() {
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('IDR');
  const [totalDomains, setTotalDomains] = useState<number>(0);
  const [estimatedProfit, setEstimatedProfit] = useState<number>(0);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering / search states
  const [searchInput, setSearchInput] = useState('');
  const [dateRange, setDateRange] = useState('90');
  const [filterType, setFilterType] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Markups cache to compute margins
  const [markups, setMarkups] = useState<any[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const loadDashboardStats = async () => {
    try {
      // 1. Fetch balance account
      const accountRes = await apiFetch('/api/admin/billing/account');
      if (accountRes && accountRes.data) {
        setBalance(accountRes.data.balance || 0);
        setCurrency(accountRes.data.currency || 'IDR');
      }

      // 2. Fetch total domains (FIX FOR ACCURACY: Fetch with limit=1 to get the actual meta.total count)
      const domainsRes = await apiFetch('/api/admin/domains?limit=1');
      if (domainsRes && domainsRes.success) {
        const count = domainsRes.meta && typeof domainsRes.meta.total === 'number'
          ? domainsRes.meta.total
          : (domainsRes.data ? domainsRes.data.length : 0);
        setTotalDomains(count);
      }
    } catch (e) {
      console.warn('Failed to load billing status metrics:', e);
      setOfflineMode(true);
    }
  };

  const loadPricingMarkups = async () => {
    try {
      const res = await apiFetch('/api/admin/pricing-markups');
      if (res && res.data) {
        setMarkups(res.data);
      }
    } catch (e) {
      console.warn('Failed to fetch pricing markups:', e);
    }
  };

  const loadTransactions = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const q = new URLSearchParams();
      q.append('page', String(currentPage));
      q.append('limit', String(limit));
      if (filterType !== 'all') q.append('transaction', filterType);
      if (searchInput.trim()) q.append('description', searchInput.trim());

      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - parseInt(dateRange, 10));
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      q.append('date_range', `${formatDate(past)}_${formatDate(today)}`);

      const res = await apiFetch(`/api/admin/billing/transactions?${q.toString()}`);
      if (res && res.success && res.data) {
        setTransactions(res.data);
        const meta = res.meta || {};
        const total = meta.total || res.data.length;
        setTotalItems(total);
        setTotalPages(meta.last_page || Math.ceil(total / limit) || 1);
      } else {
        setTransactions([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Error loading billing transactions:', err);
      setErrorMsg(err.message || 'Gagal memuat data transaksi billing.');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate profit based on high-limit transaction check in the current range
  const calculateEstimatedProfit = async () => {
    try {
      const q = new URLSearchParams();
      q.append('limit', '100'); // fetch large limit to sum profits in selected date range
      if (filterType !== 'all') q.append('transaction', filterType);
      if (searchInput.trim()) q.append('description', searchInput.trim());

      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - parseInt(dateRange, 10));
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      q.append('date_range', `${formatDate(past)}_${formatDate(today)}`);

      const res = await apiFetch(`/api/admin/billing/transactions?${q.toString()}`);
      if (res && res.success && res.data) {
        let totalProfit = 0;
        res.data.forEach((t: any) => {
          const isCredit = t.direction ? t.direction === 'Credit' : (t.type === 'deposit' || parseFloat(t.amount) > 0);
          const isDomainCharge = !isCredit &&
            (t.type === 'domain' || [1, 2, 3].includes(t.type) || (t.description && (
              t.description.toLowerCase().includes('register') || 
              t.description.toLowerCase().includes('renew') || 
              t.description.toLowerCase().includes('transfer') ||
              t.description.toLowerCase().includes('protection')
            )));

          if (!isDomainCharge) return;

          const costPrice = Math.abs(parseFloat(t.amount));
          const match = t.description.match(/(?:register|renew|transfer|domain|protection)\s+([a-zA-Z0-9.-]+)/i);
          if (!match) return;
          const domainName = match[1].toLowerCase();
          const parts = domainName.split('.');
          if (parts.length < 2) return;
          const tld = '.' + parts.slice(1).join('.');

          let markup = markups.find(m => m.extension.toLowerCase() === tld);
          if (!markup) {
            markup = markups.find(m => m.extension === '*');
          }

          if (markup) {
            const val = parseFloat(markup.markup_value);
            if (markup.markup_type === 'percentage') {
              totalProfit += costPrice * (val / 100);
            } else {
              totalProfit += val;
            }
          }
        });
        setEstimatedProfit(totalProfit);
      }
    } catch (e) {
      console.warn('Profit margin calculation failed', e);
    }
  };

  // On mount: Load markups, stats
  useEffect(() => {
    loadDashboardStats();
    loadPricingMarkups();
  }, []);

  // Load transactions whenever pagination, search filters change
  useEffect(() => {
    loadTransactions();
  }, [currentPage, filterType, dateRange]);

  // Recalculate profit when transactions/markups are ready or dateRange changes
  useEffect(() => {
    if (markups.length > 0) {
      calculateEstimatedProfit();
    }
  }, [markups, filterType, dateRange, searchInput]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadTransactions();
  };

  return (
    <AdminLayout title="Billings" activeMenu="billing">
      <div className="text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-3 border-black pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black">Riwayat Transaksi Realtime</h1>
            <p className="text-xs sm:text-sm font-bold text-zinc-500 mt-2">
              Semua arus keluar masuk deposit reseller dari api.rdash.id
            </p>
          </div>
        </div>

        {/* Offline Simulation banner */}
        {offlineMode && (
          <div className="alert alert-warning mb-6 text-xs border-2 border-black rounded-sm bg-amber-50 flex items-center gap-2">
            <span>⚠️ <strong>Status API Offline:</strong> Menampilkan data simulasi lokal untuk mempermudah demonstrasi dashboard.</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card 1: Saldo Reseller */}
          <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase">Saldo Reseller (RDASH)</span>
              <div className="w-8 h-8 border-2 border-black bg-rose-200 flex items-center justify-center rounded-sm text-black">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black">{formatCurrency(balance)}</h2>
            <p className="text-[10px] text-zinc-400 font-bold mt-2">Mata Uang: {currency}</p>
          </div>

          {/* Card 2: Estimasi Profit */}
          <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase">Estimasi Keuntungan</span>
              <div className="w-8 h-8 border-2 border-black bg-emerald-200 flex items-center justify-center rounded-sm text-black">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black text-emerald-600">{formatCurrency(estimatedProfit)}</h2>
            <p className="text-[10px] text-zinc-400 font-bold mt-2">Dari markup penjualan domain</p>
          </div>

          {/* Card 3: Total Domain */}
          <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase">Total Domain Terdaftar</span>
              <div className="w-8 h-8 border-2 border-black bg-cyan-200 flex items-center justify-center rounded-sm text-black">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black">{totalDomains} Domain</h2>
            <p className="text-[10px] text-zinc-400 font-bold mt-2">Domain pelanggan aktif terhitung akurat</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-grow max-w-sm w-full">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full text-sm font-bold px-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_#000] transition-all"
                placeholder="Cari keterangan / referensi..."
              />
            </div>

            {/* Select options */}
            <div className="flex gap-4 flex-wrap">
              <select
                value={dateRange}
                onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1); }}
                className="text-sm font-bold px-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer appearance-none"
                style={{ backgroundImage: 'var(--select-arrow-bg)', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', paddingRight: '36px' }}
              >
                <option value="30">30 Hari Terakhir</option>
                <option value="90">90 Hari Terakhir</option>
                <option value="365">1 Tahun Terakhir</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="text-sm font-bold px-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all cursor-pointer appearance-none"
                style={{ backgroundImage: 'var(--select-arrow-bg)', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', paddingRight: '36px' }}
              >
                <option value="all">Semua Tipe</option>
                <option value="deposit">Top Up (Deposit)</option>
                <option value="domain">Domain (Charge)</option>
                <option value="ssl">SSL (Charge)</option>
                <option value="object-storage">Object Storage (Charge)</option>
              </select>

              <button type="submit" className="bg-white px-6 py-3 font-black text-sm border-3 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all rounded-sm">
                Filter
              </button>
              <button type="button" onClick={() => loadTransactions()} className="bg-white px-5 py-3 font-black text-sm border-3 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all flex items-center gap-2 rounded-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Refresh
              </button>
            </div>
          </form>
        </div>

        {/* Transactions Table */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 font-bold gap-3">
              <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-xs">Memuat riwayat transaksi billing...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-12 text-center text-rose-600 font-bold">{errorMsg}</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-bold">
              Tidak ada data transaksi billing ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-bold text-black">
                <thead>
                  <tr className="bg-zinc-100 border-b-3 border-black">
                    <th className="p-4 border-r border-black w-20">ID</th>
                    <th className="p-4 border-r border-black">Referensi</th>
                    <th className="p-4 border-r border-black">Keterangan</th>
                    <th className="p-4 border-r border-black">Tanggal</th>
                    <th className="p-4 border-r border-black text-right">Biaya RDASH</th>
                    <th className="p-4 border-r border-black text-right">Harga Jual</th>
                    <th className="p-4 border-r border-black text-right">Margin</th>
                    <th className="p-4 text-right">Saldo RDASH</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t: any) => {
                    const isCredit = t.direction 
                      ? t.direction === 'Credit' 
                      : (t.type === 'deposit' || parseFloat(t.amount) > 0);
                    
                    const referenceText = t.reference ?? t.note ?? t.type_label ?? '-';
                    const balanceVal = t.closing_balance ?? t.balance_after ?? 0;

                    // Determine if domain charge to calculate margins
                    const isDomainCharge = !isCredit &&
                      (t.type === 'domain' || [1, 2, 3].includes(t.type) || (t.description && (
                        t.description.toLowerCase().includes('register') || 
                        t.description.toLowerCase().includes('renew') || 
                        t.description.toLowerCase().includes('transfer') ||
                        t.description.toLowerCase().includes('protection')
                      )));

                    let rdashCostHtml: React.ReactNode = null;
                    let customerPriceHtml: React.ReactNode = <span className="text-zinc-400">-</span>;
                    let marginHtml: React.ReactNode = <span className="text-zinc-400">-</span>;

                    const costPrice = Math.abs(parseFloat(t.amount));

                    if (isDomainCharge) {
                      rdashCostHtml = <span className="text-rose-600 font-extrabold">-{formatCurrency(costPrice)}</span>;

                      let marginVal = 0;
                      const match = t.description.match(/(?:register|renew|transfer|domain|protection)\s+([a-zA-Z0-9.-]+)/i);
                      if (match) {
                        const domainName = match[1].toLowerCase();
                        const parts = domainName.split('.');
                        if (parts.length >= 2) {
                          const tld = '.' + parts.slice(1).join('.');
                          let markup = markups.find(m => m.extension.toLowerCase() === tld);
                          if (!markup) {
                            markup = markups.find(m => m.extension === '*');
                          }
                          if (markup) {
                            const val = parseFloat(markup.markup_value);
                            if (markup.markup_type === 'percentage') {
                              marginVal = costPrice * (val / 100);
                            } else {
                              marginVal = val;
                            }
                          }
                        }
                      }

                      const customerPriceVal = costPrice + marginVal;
                      customerPriceHtml = <span className="text-black font-extrabold">{formatCurrency(customerPriceVal)}</span>;
                      marginHtml = marginVal > 0 
                        ? <span className="text-emerald-600 font-extrabold">+{formatCurrency(marginVal)}</span>
                        : <span className="text-zinc-500">Rp0</span>;
                    } else {
                      rdashCostHtml = <span className={isCredit ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                        {isCredit ? '+' : '-'}{formatCurrency(costPrice)}
                      </span>;
                    }

                    return (
                      <tr key={t.id} className="border-b-2 border-black hover:bg-zinc-50">
                        <td className="p-4 border-r border-black font-bold">#{t.id}</td>
                        <td className="p-4 border-r border-black">
                          <code className="bg-zinc-100 border border-zinc-300 px-1.5 py-0.5 rounded-sm font-mono text-[10px]">{referenceText}</code>
                        </td>
                        <td className="p-4 border-r border-black font-semibold">{t.description}</td>
                        <td className="p-4 border-r border-black text-zinc-500">
                          {new Date(t.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 border-r border-black text-right">{rdashCostHtml}</td>
                        <td className="p-4 border-r border-black text-right">{customerPriceHtml}</td>
                        <td className="p-4 border-r border-black text-right">{marginHtml}</td>
                        <td className="p-4 text-right text-zinc-600 font-mono">{formatCurrency(balanceVal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table pagination footer */}
          {!isLoading && !errorMsg && transactions.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t-3 border-black bg-zinc-50 gap-4">
              <span className="text-xs font-bold text-zinc-500">
                Halaman {currentPage} dari {totalPages} (Menampilkan {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, totalItems)} dari {totalItems} transaksi)
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
    </AdminLayout>
  );
}
