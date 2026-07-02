import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { apiFetch } from '../../utils/api';

export default function Pricing() {
  const [basePrices, setBasePrices] = useState<any[]>([]);
  const [markups, setMarkups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');

  // Edit / Add Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    id: '',
    extension: '',
    markup_type: 'fixed', // fixed or percentage
    markup_value: 0,
    whois_price: 15000
  });
  const [modalIsEdit, setModalIsEdit] = useState(false);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [pricesRes, markupsRes] = await Promise.all([
        apiFetch('/api/domains/prices?limit=100', { requireAuth: false }),
        apiFetch('/api/admin/pricing-markups')
      ]);

      if (pricesRes.success && Array.isArray(pricesRes.data)) {
        setBasePrices(pricesRes.data);
      }
      if (markupsRes.success && Array.isArray(markupsRes.data)) {
        setMarkups(markupsRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat data harga dan markup.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddMarkup = () => {
    setModalForm({
      id: '',
      extension: '',
      markup_type: 'fixed',
      markup_value: 0,
      whois_price: 15000
    });
    setModalIsEdit(false);
    setShowModal(true);
  };

  const openEditMarkup = (markup: any) => {
    setModalForm({
      id: String(markup.id),
      extension: markup.extension,
      markup_type: markup.markup_type || 'fixed',
      markup_value: markup.markup_value || 0,
      whois_price: markup.whois_price !== undefined ? Number(markup.whois_price) : 15000
    });
    setModalIsEdit(true);
    setShowModal(true);
  };

  const handleDeleteMarkup = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus markup ini?')) return;
    try {
      const res = await apiFetch(`/api/admin/pricing-markups/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setSuccessMsg('Markup berhasil dihapus.');
        loadData();
      } else {
        setErrorMsg(res.message || 'Gagal menghapus markup.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus markup.');
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/pricing-markups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modalForm.id ? Number(modalForm.id) : undefined,
          extension: modalForm.extension.trim(),
          markup_type: modalForm.markup_type,
          markup_value: Number(modalForm.markup_value),
          whois_price: Number(modalForm.whois_price)
        })
      });
      if (res.success) {
        setSuccessMsg(modalIsEdit ? 'Markup berhasil diperbarui.' : 'Markup baru berhasil ditambahkan.');
        setShowModal(false);
        loadData();
      } else {
        setErrorMsg(res.message || 'Gagal menyimpan markup.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan markup.');
    }
  };

  // Build a mapped list of base prices + pricing markup overrides to display retail prices
  const getMappedPrices = () => {
    const list = [...basePrices];

    // Find if there is a default fallback markup '*'
    const defaultMarkup = markups.find(m => m.extension === '*');

    return list.map(item => {
      // Find specific markup
      const specificMarkup = markups.find(m => m.extension.toLowerCase() === item.extension.toLowerCase());
      const activeMarkup = specificMarkup || defaultMarkup || null;

      let margin = 0;
      let finalPrice = item.registerPrice;

      if (activeMarkup) {
        const val = parseFloat(activeMarkup.markup_value);
        if (activeMarkup.markup_type === 'percentage') {
          margin = item.registerPrice * (val / 100);
        } else {
          margin = val;
        }
        finalPrice = item.registerPrice + margin;
      }

      return {
        ...item,
        markup: activeMarkup,
        margin,
        finalPrice
      };
    }).filter(item => 
      item.extension.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  };

  const mappedList = getMappedPrices();

  return (
    <AdminLayout title="Harga Domain" activeMenu="pricing">
      <div className="text-left text-xs text-black">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-3 border-black pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black">Markup Harga Domain</h1>
            <p className="text-sm font-bold text-zinc-500 mt-2">
              Atur keuntungan markup harga TLD registrasi dan perpanjangan secara kustom
            </p>
          </div>
          <button onClick={openAddMarkup} className="btn btn-primary font-black text-sm">
            + Tambah Markup TLD
          </button>
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

        {/* Search Filter */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-4 mb-6">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm font-bold px-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_#000] transition-all max-w-sm w-full"
              placeholder="Cari ekstensi TLD (misal: .id)..."
            />
            <button onClick={loadData} className="bg-white px-6 py-3 font-black text-sm border-3 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all rounded-sm">
              Refresh
            </button>
          </div>
        </div>

        {/* Active Markups List */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-6 mb-6">
          <h3 className="text-base font-black border-b-2 border-black pb-3 mb-4">Markup Kustom Terdaftar</h3>
          
          {isLoading ? (
            <div className="text-center py-6 font-bold text-zinc-500">Memuat data markup...</div>
          ) : markups.length === 0 ? (
            <div className="text-center py-6 font-bold text-zinc-500">Belum ada markup kustom terdaftar. Sistem menggunakan default.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-bold text-xs">
              {markups.map(m => (
                <div key={m.id} className="border-2 border-black rounded-sm p-4 bg-zinc-50 flex flex-col gap-3 shadow-sm">
                  <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                    <span className="font-mono text-sm font-black text-rose-600 bg-rose-50 px-2 py-0.5 border border-rose-300">
                      {m.extension}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditMarkup(m)}
                        className="px-2 py-1 border border-black bg-white hover:bg-zinc-100 rounded-sm"
                      >
                        Edit
                      </button>
                      {m.extension !== '*' && (
                        <button
                          onClick={() => handleDeleteMarkup(String(m.id))}
                          className="px-2 py-1 border border-black bg-rose-100 text-rose-800 hover:bg-rose-200 rounded-sm"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tipe Markup:</span>
                    <span className="capitalize">{m.markup_type === 'percentage' ? 'Persentase (%)' : 'Tetap (Rupiah)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Nilai Markup:</span>
                    <span>{m.markup_type === 'percentage' ? `${m.markup_value}%` : formatCurrency(m.markup_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Harga WHOIS:</span>
                    <span>{m.whois_price > 0 ? formatCurrency(m.whois_price) : 'Gratis / Free'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing List Table */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden mb-6 font-bold">
          <div className="p-4 border-b-2 border-black bg-zinc-50">
            <h3 className="text-sm font-black text-black">Tabel Estimasi Harga Jual Domain Pelanggan</h3>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 font-bold gap-3">
              <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-xs">Memuat estimasi harga...</p>
            </div>
          ) : mappedList.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">Tidak ada ekstensi yang cocok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-bold text-black">
                <thead>
                  <tr className="bg-zinc-100 border-b-3 border-black">
                    <th className="p-4 border-r border-black font-black w-24">Ekstensi</th>
                    <th className="p-4 border-r border-black text-right">Modal RDASH</th>
                    <th className="p-4 border-r border-black">Aturan Markup</th>
                    <th className="p-4 border-r border-black text-right">Margin Keuntungan</th>
                    <th className="p-4 text-right">Harga Jual (Est)</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedList.map((p, idx) => (
                    <tr key={idx} className="border-b-2 border-black hover:bg-zinc-50">
                      <td className="p-4 border-r border-black font-mono text-sm text-rose-600">{p.extension}</td>
                      <td className="p-4 border-r border-black text-right text-zinc-500">{formatCurrency(p.registerPrice)}</td>
                      <td className="p-4 border-r border-black">
                        {p.markup ? (
                          <span className="bg-cyan-50 text-cyan-800 px-2 py-0.5 border border-cyan-300 font-extrabold text-[10px]">
                            {p.markup.markup_type === 'percentage' ? `${p.markup.markup_value}%` : formatCurrency(p.markup.markup_value)}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-normal">Tidak ada markup</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-black text-right text-emerald-600 font-black">
                        +{formatCurrency(p.margin)}
                      </td>
                      <td className="p-4 text-right text-black font-black text-sm">{formatCurrency(p.finalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit / Add Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative card border-3 border-black bg-white shadow-[8px_8px_0_#000] max-w-sm w-full overflow-hidden text-left p-0! z-10">
              <div className="flex justify-between items-center p-5 border-b-3 border-black bg-amber-100">
                <h3 className="font-extrabold text-sm">{modalIsEdit ? 'Ubah Aturan Markup' : 'Tambah Aturan Markup'}</h3>
                <button onClick={() => setShowModal(false)} className="w-7 h-7 border-2 border-black bg-white hover:bg-zinc-100 flex items-center justify-center rounded-sm font-bold">✕</button>
              </div>
              <form onSubmit={handleModalSubmit}>
                <div className="p-5 flex flex-col gap-4 font-bold text-xs text-black">
                  <div className="flex flex-col gap-1">
                    <label>Ekstensi TLD</label>
                    <input
                      type="text"
                      required
                      disabled={modalIsEdit}
                      value={modalForm.extension}
                      onChange={(e) => setModalForm(prev => ({ ...prev, extension: e.target.value }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                      placeholder="misal: .id atau * untuk fallback default"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label>Tipe Markup</label>
                    <select
                      value={modalForm.markup_type}
                      onChange={(e) => setModalForm(prev => ({ ...prev, markup_type: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-black bg-white rounded-sm outline-none font-bold"
                    >
                      <option value="fixed">Tetap (Rupiah)</option>
                      <option value="percentage">Persentase (%)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label>Nilai Markup</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={modalForm.markup_value}
                      onChange={(e) => setModalForm(prev => ({ ...prev, markup_value: Number(e.target.value) }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                      placeholder="Nilai nominal rupiah atau persen"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label>Harga WHOIS (Rupiah)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={modalForm.whois_price}
                      onChange={(e) => setModalForm(prev => ({ ...prev, whois_price: Number(e.target.value) }))}
                      className="px-3 py-2 border-2 border-black bg-white text-black rounded-sm outline-none font-bold"
                      placeholder="Harga perlindungan WHOIS Privacy"
                    />
                  </div>
                </div>
                <div className="p-5 border-t-2 border-black flex justify-end gap-2 bg-zinc-50">
                  <button type="submit" className="btn btn-primary font-black text-xs py-2 px-6">Simpan Markup</button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline bg-white font-bold text-xs py-2 px-6">Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
