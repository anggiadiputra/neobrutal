import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { apiFetch } from '../../utils/api';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/admin/customers');
      if (res && res.success) {
        setCustomers(res.data || []);
      } else {
        setCustomers([]);
        setErrorMsg(res.message || 'Gagal mengambil daftar customer.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengambil daftar customer.');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSyncCustomers = async () => {
    setSyncing(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiFetch('/api/admin/sync-customers', {
        method: 'POST'
      });
      if (res && res.success) {
        setSuccessMsg(res.message || 'Berhasil mensinkronisasikan data customer dari RDASH.');
        loadCustomers();
      } else {
        setErrorMsg(res.message || 'Gagal mensinkronisasikan customer.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mensinkronisasikan customer.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.whatsapp || c.phone || '').toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout title="Daftar Customer" activeMenu="customers">
      <div className="text-left text-xs text-black">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-3 border-black pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black">Daftar Customer</h1>
            <p className="text-sm font-bold text-zinc-500 mt-2">
              Manajemen akun customer/pelanggan yang terintegrasi dengan database lokal dan RDASH
            </p>
          </div>
          <button
            onClick={handleSyncCustomers}
            disabled={syncing}
            className="btn btn-primary font-black text-sm"
          >
            {syncing ? 'Sinkronisasi...' : '🔄 Sync dari RDASH'}
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

        {/* Filter and Search Bar */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-4 mb-6">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm font-bold px-4 py-3 border-3 border-black rounded-sm outline-none bg-white focus:bg-white text-black shadow-[4px_4px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0_0_#000] transition-all max-w-sm w-full"
              placeholder="Cari nama, email, whatsapp..."
            />
            <button onClick={loadCustomers} className="bg-white px-6 py-3 font-black text-sm border-3 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all rounded-sm">
              Refresh
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 font-bold gap-3">
              <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-xs">Memuat daftar customer...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-bold">
              Tidak ada data customer terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto font-bold">
              <table className="w-full border-collapse text-left text-xs font-bold text-black">
                <thead>
                  <tr className="bg-zinc-100 border-b-3 border-black">
                    <th className="p-4 border-r border-black w-24">ID</th>
                    <th className="p-4 border-r border-black">Nama</th>
                    <th className="p-4 border-r border-black">Email</th>
                    <th className="p-4 border-r border-black">Whatsapp</th>
                    <th className="p-4 border-r border-black text-center">RDASH ID</th>
                    <th className="p-4 border-r border-black">Role</th>
                    <th className="p-4">Terdaftar Sejak</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c: any) => (
                    <tr key={c.id} className="border-b-2 border-black hover:bg-zinc-50">
                      <td className="p-4 border-r border-black font-bold">#{c.id}</td>
                      <td className="p-4 border-r border-black text-rose-600 font-black text-sm">{c.name}</td>
                      <td className="p-4 border-r border-black font-mono">{c.email}</td>
                      <td className="p-4 border-r border-black font-mono">{c.whatsapp || c.phone || '-'}</td>
                      <td className="p-4 border-r border-black text-center font-mono text-zinc-500">
                        {c.rdash_customer_id ? `#${c.rdash_customer_id}` : '-'}
                      </td>
                      <td className="p-4 border-r border-black">
                        <span className={`inline-block px-2 py-0.5 border border-black text-[9px] font-black uppercase rounded-sm ${c.is_admin ? 'bg-rose-100 text-rose-800' : 'bg-zinc-100 text-zinc-800'}`}>
                          {c.is_admin ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-500">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
