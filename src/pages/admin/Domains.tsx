import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { apiFetch } from '../../utils/api';

export default function Domains() {
  const [domains, setDomains] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering states
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const loadDomains = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const q = new URLSearchParams();
      q.append('page', String(currentPage));
      q.append('limit', String(limit));
      if (searchInput.trim()) q.append('search', searchInput.trim());
      if (statusFilter) q.append('status', statusFilter);

      const res = await apiFetch(`/api/admin/domains?${q.toString()}`);
      if (res && res.success) {
        setDomains(res.data || []);
        const meta = res.meta || {};
        const total = meta.total || res.data.length;
        setTotalItems(total);
        setTotalPages(meta.last_page || Math.ceil(total / limit) || 1);
      } else {
        setDomains([]);
        setErrorMsg(res.message || 'Gagal mengambil daftar domain.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengambil daftar domain.');
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, [currentPage, statusFilter]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadDomains();
  };

  return (
    <AdminLayout title="Semua Domain" activeMenu="domains">
      <div className="text-left text-xs text-black">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-3 border-black pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black">Semua Domain Pelanggan</h1>
            <p className="text-sm font-bold text-zinc-500 mt-2">
              Daftar seluruh domain pelanggan yang terdaftar di dalam sistem
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-4 mb-6">
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-center">
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
        </div>

        {/* Domains Listing Table */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 font-bold gap-3">
              <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-xs">Memuat daftar domain...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-12 text-center text-rose-600 font-bold">{errorMsg}</div>
          ) : domains.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-bold">
              Tidak ada domain yang terdaftar dalam sistem.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-bold text-black">
                <thead>
                  <tr className="bg-zinc-100 border-b-3 border-black">
                    <th className="p-4 border-r border-black w-24">ID</th>
                    <th className="p-4 border-r border-black">Nama Domain</th>
                    <th className="p-4 border-r border-black">Customer</th>
                    <th className="p-4 border-r border-black">Status</th>
                    <th className="p-4 border-r border-black">Tgl Registrasi</th>
                    <th className="p-4 border-r border-black">Tgl Kadaluarsa</th>
                    <th className="p-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((domain: any) => {
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

                    const expDisplay = domain.expired_at
                      ? new Date(domain.expired_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : '-';

                    const regDisplay = domain.created_at || domain.registered_at || domain.created
                      ? new Date(domain.created_at || domain.registered_at || domain.created).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : '-';

                    return (
                      <tr key={domain.id} className="border-b-2 border-black hover:bg-zinc-50">
                        <td className="p-4 border-r border-black font-bold">#{domain.id}</td>
                        <td className="p-4 border-r border-black font-mono font-black text-rose-600 text-sm">{name}</td>
                        <td className="p-4 border-r border-black">
                          <div className="font-extrabold">{domain.customer?.name ?? 'Customer'}</div>
                          <div className="text-[10px] text-zinc-400 font-semibold">{domain.customer?.email ?? '-'}</div>
                        </td>
                        <td className="p-4 border-r border-black">
                          <span className={`inline-block px-2.5 py-0.5 border border-black text-[9px] font-black uppercase rounded-sm ${badgeColor}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="p-4 border-r border-black text-zinc-500">{regDisplay}</td>
                        <td className="p-4 border-r border-black text-zinc-500">{expDisplay}</td>
                        <td className="p-4">
                          <a
                            href={`/dashboard/domains/${domain.id}`}
                            className="btn btn-outline py-1 px-3 text-xs font-black bg-white inline-flex items-center gap-1 hover:bg-amber-50"
                          >
                            Kelola
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table pagination footer */}
          {!isLoading && !errorMsg && domains.length > 0 && (
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
    </AdminLayout>
  );
}
