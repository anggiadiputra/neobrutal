import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { apiFetch } from '../../utils/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Statistics
  const [totalCount, setTotalCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  // Filters & search
  const [searchInput, setSearchInput] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Active payment methods synced from database
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Edit / Add Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [modalForm, setModalForm] = useState({
    status: '',
    paymentMethod: ''
  });
  const [savingTx, setSavingTx] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState('');
  const [modalErrorMsg, setModalErrorMsg] = useState('');
  const [syncingTxId, setSyncingTxId] = useState<number | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [syncErrorMsg, setSyncErrorMsg] = useState('');

  const loadPaymentMethods = async () => {
    try {
      const res = await apiFetch(`/api/settings/payment-methods?_=${Date.now()}`);
      if (res && res.success && res.data?.paymentFee) {
        setPaymentMethods(res.data.paymentFee);
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const getPaymentMethodName = (code: string) => {
    if (!code) return '-';
    const pm = paymentMethods.find((p: any) => p.paymentMethod === code);
    return pm ? pm.paymentName : code;
  };

  const getStatusLabel = (status: string) => {
    const s = status ? status.toUpperCase() : '';
    if (s === 'SUCCESS') return 'SUKSES';
    if (s === 'PENDING') return 'PENDING';
    if (s === 'FAILED') return 'GAGAL';
    if (s === 'REGISTRATION_FAILED') return 'REG. GAGAL';
    if (s === 'RENEWAL_FAILED') return 'RENEW GAGAL';
    return s || '-';
  };

  const getStatusBadgeColor = (status: string) => {
    const s = status ? status.toUpperCase() : '';
    if (s === 'SUCCESS') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (s === 'PENDING') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (s === 'FAILED') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (s === 'REGISTRATION_FAILED') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (s === 'RENEWAL_FAILED') return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-zinc-100 text-zinc-800 border-zinc-300';
  };

  const openEditModal = (tx: any) => {
    setEditingTx(tx);
    setModalForm({
      status: tx.status || 'PENDING',
      paymentMethod: tx.payment_method || ''
    });
    setModalSuccessMsg('');
    setModalErrorMsg('');
    setShowEditModal(true);
  };

  const handleSyncPayment = async (tx: any) => {
    setSyncStatusMsg('');
    setSyncErrorMsg('');
    setSyncingTxId(tx.id);

    try {
      const res = await apiFetch(`/api/admin/transactions/${tx.id}/sync-payment`, {
        method: 'POST'
      });

      if (res && res.success) {
        setSyncStatusMsg(`Sync berhasil: ${res.data.action}`);
        await loadTransactions();
      } else {
        setSyncErrorMsg(res.message || 'Gagal sinkron pembayaran.');
      }
    } catch (err: any) {
      setSyncErrorMsg(err.message || 'Gagal sinkron pembayaran.');
    } finally {
      setSyncingTxId(null);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    setSavingTx(true);
    setModalErrorMsg('');
    setModalSuccessMsg('');

    try {
      const res = await apiFetch(`/api/admin/transactions/${editingTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: modalForm.status,
          paymentMethod: modalForm.paymentMethod || null
        })
      });

      if (res && res.success) {
        setModalSuccessMsg('Transaksi berhasil diperbarui.');
        await loadTransactions();
        setTimeout(() => {
          setShowEditModal(false);
        }, 1000);
      } else {
        setModalErrorMsg(res.message || 'Gagal memperbarui transaksi.');
      }
    } catch (err: any) {
      setModalErrorMsg(err.message || 'Gagal memperbarui transaksi.');
    } finally {
      setSavingTx(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getActionLabel = (action: string) => {
    if (action === 'register') return 'Registrasi';
    if (action === 'renew') return 'Perpanjangan';
    if (action === 'transfer') return 'Transfer';
    return action;
  };

  const getActionBadgeColor = (action: string) => {
    if (action === 'register') return 'bg-cyan-100 text-cyan-800';
    if (action === 'renew') return 'bg-amber-100 text-amber-800';
    if (action === 'transfer') return 'bg-purple-100 text-purple-800';
    return 'bg-zinc-100 text-zinc-800';
  };

  const loadTransactions = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const q = new URLSearchParams();
      q.append('page', String(currentPage));
      q.append('limit', String(limit));
      if (filterAction !== 'all') q.append('action', filterAction);
      if (searchInput.trim()) q.append('search', searchInput.trim());

      const res = await apiFetch(`/api/admin/transactions?${q.toString()}`);
      if (res && res.success) {
        setTransactions(res.data || []);
        
        const meta = res.meta || {};
        setTotalCount(meta.total || 0);
        setTotalPages(meta.last_page || 1);

        const stats = meta.stats || { total_cost: 0, total_revenue: 0, total_profit: 0 };
        setTotalRevenue(stats.total_revenue || 0);
        setTotalProfit(stats.total_profit || 0);
      } else {
        setTransactions([]);
        setErrorMsg(res.message || 'Gagal mengambil riwayat transaksi.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengambil riwayat transaksi.');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [currentPage, filterAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadTransactions();
  };

  return (
    <AdminLayout title="Transaksi" activeMenu="transactions">
      <div className="text-left text-xs text-black">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-3 border-black pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black">Transaksi Lokal</h1>
            <p className="text-sm font-bold text-zinc-500 mt-2">
              Laporan riwayat transaksi customer untuk registrasi, perpanjangan, dan transfer domain
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 font-bold">
          {/* Card 1: Total Transactions */}
          <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase">Total Transaksi</span>
              <div className="w-8 h-8 border-2 border-black bg-indigo-200 flex items-center justify-center rounded-sm text-black">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black">{totalCount}</h2>
            <p className="text-[10px] text-zinc-400 font-bold mt-2">Jumlah transaksi lokal tercatat</p>
          </div>

          {/* Card 2: Total Omset */}
          <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase">Total Omset (Revenue)</span>
              <div className="w-8 h-8 border-2 border-black bg-rose-200 flex items-center justify-center rounded-sm text-black">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black">{formatCurrency(totalRevenue)}</h2>
            <p className="text-[10px] text-zinc-400 font-bold mt-2">Total pembayaran dari customer</p>
          </div>

          {/* Card 3: Total Profit */}
          <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-zinc-500 uppercase">Total Keuntungan (Margin)</span>
              <div className="w-8 h-8 border-2 border-black bg-emerald-200 flex items-center justify-center rounded-sm text-black">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-black text-emerald-600">+{formatCurrency(totalProfit)}</h2>
            <p className="text-[10px] text-zinc-400 font-bold mt-2">Selisih markup harga jual vs modal</p>
          </div>
        </div>

        {/* Filters Box */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-grow max-w-sm w-full">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full text-sm font-bold px-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_#000] transition-all"
                placeholder="Cari domain, referensi, customer..."
              />
            </div>

            <div className="flex gap-4">
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
                className="text-sm font-bold px-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all min-w-[160px] cursor-pointer appearance-none"
                style={{ backgroundImage: 'var(--select-arrow-bg)', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', paddingRight: '36px' }}
              >
                <option value="all">Semua Aktivitas</option>
                <option value="register">Registrasi Domain</option>
                <option value="renew">Perpanjangan Domain</option>
                <option value="transfer">Transfer Domain</option>
              </select>

              <button type="submit" className="bg-white px-6 py-3 font-black text-sm border-3 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all rounded-sm">
                Filter
              </button>
            </div>
          </form>
        </div>

        {/* List Table */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 font-bold gap-3">
              <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-xs">Memuat riwayat transaksi...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-12 text-center text-rose-600 font-bold">{errorMsg}</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-bold">
              Tidak ada data transaksi lokal terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-bold text-black">
                <thead>
                  <tr className="bg-zinc-100 border-b-3 border-black">
                    <th className="p-4 border-r border-black w-20">ID</th>
                    <th className="p-4 border-r border-black">Customer</th>
                    <th className="p-4 border-r border-black">Domain</th>
                    <th className="p-4 border-r border-black">Tipe</th>
                    <th className="p-4 border-r border-black text-center">Durasi</th>
                    <th className="p-4 border-r border-black text-right">Biaya Modal (Cost)</th>
                    <th className="p-4 border-r border-black text-right">Harga Jual</th>
                    <th className="p-4 border-r border-black text-right">Profit (Margin)</th>
                    <th className="p-4 border-r border-black">Metode</th>
                    <th className="p-4 border-r border-black text-center">Status</th>
                    <th className="p-4 border-r border-black">Tanggal</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t: any) => {
                    const costVal = parseFloat(t.cost_price ?? 0);
                    const retailVal = parseFloat(t.markup_price ?? 0);
                    const marginVal = parseFloat(t.margin ?? 0);

                    return (
                      <tr key={t.id} className="border-b-2 border-black hover:bg-zinc-50">
                        <td className="p-4 border-r border-black font-bold">#{t.id}</td>
                        <td className="p-4 border-r border-black">
                          <div className="font-extrabold">{t.customer?.name ?? 'Customer'}</div>
                          <div className="text-[10px] text-zinc-400 font-semibold">{t.customer?.email ?? '-'}</div>
                        </td>
                        <td className="p-4 border-r border-black">
                          <div className="font-mono font-black text-rose-600">{t.domain_name}</div>
                          {t.reference && (
                            <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                              Ref: <code className="bg-zinc-100 border border-zinc-200 px-1 py-0.2 rounded-sm">{t.reference}</code>
                            </div>
                          )}
                        </td>
                        <td className="p-4 border-r border-black">
                          <span className={`inline-block px-2.5 py-0.5 border border-black text-[9px] font-black uppercase rounded-sm ${getActionBadgeColor(t.action)}`}>
                            {getActionLabel(t.action)}
                          </span>
                        </td>
                        <td className="p-4 border-r border-black text-center">{t.period} Th</td>
                        <td className="p-4 border-r border-black text-right text-zinc-500">{formatCurrency(costVal)}</td>
                        <td className="p-4 border-r border-black text-right text-black font-black">{formatCurrency(retailVal)}</td>
                        <td className="p-4 border-r border-black text-right text-emerald-600 font-black">+{formatCurrency(marginVal)}</td>
                        <td className="p-4 border-r border-black">
                          {getPaymentMethodName(t.payment_method)}
                        </td>
                        <td className="p-4 border-r border-black text-center">
                          <span className={`inline-block px-2.5 py-0.5 border border-black text-[9px] font-black uppercase rounded-sm ${getStatusBadgeColor(t.status)}`}>
                            {getStatusLabel(t.status)}
                          </span>
                        </td>
                        <td className="p-4 border-r border-black text-zinc-500">{new Date(t.created_at).toLocaleString('id-ID')}</td>
                        <td className="p-4 text-center space-y-2">
                          <button
                            onClick={() => openEditModal(t)}
                            className="bg-white hover:bg-zinc-100 text-black px-2 py-1 border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000] text-[10px] font-bold rounded-sm cursor-pointer transition-all w-full"
                          >
                            Edit
                          </button>
                          {t.status === 'PENDING' && (
                            <button
                              onClick={() => handleSyncPayment(t)}
                              disabled={syncingTxId === t.id}
                              className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover,#e0b000)] text-black px-2 py-1 border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000] text-[10px] font-black rounded-sm cursor-pointer transition-all w-full disabled:bg-zinc-300 disabled:cursor-not-allowed"
                            >
                              {syncingTxId === t.id ? 'Sync...' : 'Sync Pembayaran'}
                            </button>
                          )}
                        </td>
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
                Halaman {currentPage} dari {totalPages} (Total: {totalCount})
              </span>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {syncStatusMsg && (
                  <div className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-sm px-3 py-2">
                    {syncStatusMsg}
                  </div>
                )}
                {syncErrorMsg && (
                  <div className="text-[10px] font-black text-rose-700 bg-rose-100 border border-rose-300 rounded-sm px-3 py-2">
                    {syncErrorMsg}
                  </div>
                )}
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
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && editingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative card border-3 border-black bg-white shadow-[8px_8px_0_#000] max-w-sm w-full overflow-hidden text-left p-0! z-10 animate-fade-in">
              <div className="flex justify-between items-center p-5 border-b-3 border-black bg-amber-100">
                <h3 className="font-extrabold text-sm text-black">Ubah Status & Metode Pembayaran #{editingTx.id}</h3>
                <button onClick={() => setShowEditModal(false)} className="w-7 h-7 border-2 border-black bg-white hover:bg-zinc-100 flex items-center justify-center rounded-sm font-bold text-black cursor-pointer">✕</button>
              </div>
              <form onSubmit={handleModalSubmit}>
                <div className="p-5 flex flex-col gap-4 font-bold text-xs text-black">
                  {/* Notifications inside Modal */}
                  {modalSuccessMsg && (
                    <div className="alert alert-success border-2 border-black rounded-sm bg-emerald-50 text-emerald-800 p-2 font-bold mb-2">
                      {modalSuccessMsg}
                    </div>
                  )}
                  {modalErrorMsg && (
                    <div className="alert alert-error border-2 border-black rounded-sm bg-rose-50 text-rose-800 p-2 font-bold mb-2">
                      {modalErrorMsg}
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-500">Domain</label>
                    <div className="px-3 py-2 border-2 border-black bg-zinc-100 text-zinc-600 rounded-sm font-mono font-bold">
                      {editingTx.domain_name}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-500">Status Transaksi</label>
                    <select
                      value={modalForm.status}
                      onChange={(e) => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                    >
                      <option value="PENDING">PENDING (Tertunda)</option>
                      <option value="SUCCESS">SUCCESS (Sukses)</option>
                      <option value="FAILED">FAILED (Gagal)</option>
                      <option value="REGISTRATION_FAILED">REGISTRATION_FAILED (Registrasi Gagal)</option>
                      <option value="RENEWAL_FAILED">RENEWAL_FAILED (Perpanjangan Gagal)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-500">Metode Pembayaran</label>
                    <select
                      value={modalForm.paymentMethod}
                      onChange={(e) => setModalForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                    >
                      <option value="">-- Pilih Metode Pembayaran --</option>
                      {/* Gather payment methods dynamically */}
                      {(() => {
                        const allMethods = [...paymentMethods];
                        if (editingTx.payment_method && !allMethods.some(pm => pm.paymentMethod === editingTx.payment_method)) {
                          allMethods.push({
                            paymentMethod: editingTx.payment_method,
                            paymentName: editingTx.payment_method
                          });
                        }
                        return allMethods.map((pm: any) => (
                          <option key={pm.paymentMethod} value={pm.paymentMethod}>
                            {pm.paymentName} ({pm.paymentMethod})
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
                <div className="p-5 border-t-2 border-black flex justify-end gap-2 bg-zinc-50">
                  <button type="submit" disabled={savingTx} className="btn btn-primary font-black text-xs py-2 px-6">
                    {savingTx ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline bg-white font-bold text-xs py-2 px-6 text-black">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
