import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { apiFetch } from '../../utils/api';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<'toggles' | 'reminders' | 'receipts'>('toggles');
  const [activeTemplate, setActiveTemplate] = useState<string>('h30');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Toggles
  const [toggles, setToggles] = useState({
    notify_h30_enabled: true,
    notify_h7_enabled: true,
    notify_h3_enabled: true,
    notify_h0_enabled: true,
    notify_hp7_enabled: true,
    notify_payment_success_enabled: true,
    notify_domain_active_enabled: true,
    notify_whatsapp_enabled: false
  });

  // Templates
  const [templates, setTemplates] = useState<Record<string, string>>({
    template_h30_subject: '',
    template_h30_body: '',
    template_h7_subject: '',
    template_h7_body: '',
    template_h3_subject: '',
    template_h3_body: '',
    template_h0_subject: '',
    template_h0_body: '',
    template_hp7_subject: '',
    template_hp7_body: '',
    template_payment_success_subject: '',
    template_payment_success_body: '',
    template_domain_active_subject: '',
    template_domain_active_body: '',
    template_h30_wa: '',
    template_h7_wa: '',
    template_h3_wa: '',
    template_h0_wa: '',
    template_hp7_wa: '',
    template_payment_success_wa: '',
    template_domain_active_wa: ''
  });

  const loadSettings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/settings/notifications', { requireAuth: true });
      if (res.success && res.data) {
        const d = res.data;
        setToggles({
          notify_h30_enabled: d.notify_h30_enabled !== false,
          notify_h7_enabled: d.notify_h7_enabled !== false,
          notify_h3_enabled: d.notify_h3_enabled !== false,
          notify_h0_enabled: d.notify_h0_enabled !== false,
          notify_hp7_enabled: d.notify_hp7_enabled !== false,
          notify_payment_success_enabled: d.notify_payment_success_enabled !== false,
          notify_domain_active_enabled: d.notify_domain_active_enabled !== false,
          notify_whatsapp_enabled: d.notify_whatsapp_enabled === true
        });

        setTemplates({
          template_h30_subject: d.template_h30_subject || '',
          template_h30_body: d.template_h30_body || '',
          template_h7_subject: d.template_h7_subject || '',
          template_h7_body: d.template_h7_body || '',
          template_h3_subject: d.template_h3_subject || '',
          template_h3_body: d.template_h3_body || '',
          template_h0_subject: d.template_h0_subject || '',
          template_h0_body: d.template_h0_body || '',
          template_hp7_subject: d.template_hp7_subject || '',
          template_hp7_body: d.template_hp7_body || '',
          template_payment_success_subject: d.template_payment_success_subject || '',
          template_payment_success_body: d.template_payment_success_body || '',
          template_domain_active_subject: d.template_domain_active_subject || '',
          template_domain_active_body: d.template_domain_active_body || '',
          template_h30_wa: d.template_h30_wa || '',
          template_h7_wa: d.template_h7_wa || '',
          template_h3_wa: d.template_h3_wa || '',
          template_h0_wa: d.template_h0_wa || '',
          template_hp7_wa: d.template_hp7_wa || '',
          template_payment_success_wa: d.template_payment_success_wa || '',
          template_domain_active_wa: d.template_domain_active_wa || ''
        });
      }
    } catch (err: any) {
      console.error('[Notifications] Gagal memuat pengaturan:', err);
      setErrorMsg(err.message || 'Gagal memuat pengaturan notifikasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleChange = (key: keyof typeof toggles) => {
    setToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTemplateChange = (key: string, value: string) => {
    setTemplates(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...toggles,
        ...templates
      };

      const res = await apiFetch('/api/settings/notifications', {
        method: 'POST',
        body: JSON.stringify(payload),
        requireAuth: true
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Konfigurasi notifikasi berhasil disimpan.');
        // scroll back up to see success alert
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('[Notifications] Gagal menyimpan pengaturan:', err);
      setErrorMsg(err.message || 'Gagal menyimpan konfigurasi notifikasi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Pengaturan Notifikasi" activeMenu="notifications">
      <div className="mb-6">
        <h1 className="text-3xl font-black uppercase tracking-wider mb-2">Pengaturan Notifikasi</h1>
        <p className="text-zinc-600 font-bold text-sm">
          Konfigurasi status pengiriman alert email otomatis dan kustomisasi template pesan pelanggan.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-200 border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_#000000] font-bold text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-200 border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_#000000] font-bold text-sm">
          ✅ {successMsg}
        </div>
      )}

      {loading ? (
        <div className="border-4 border-black bg-white p-8 text-center font-black uppercase tracking-widest shadow-[8px_8px_0px_#000000]">
          Memuat Pengaturan...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* TABS NAVIGATION */}
          <div className="flex flex-wrap gap-2 border-b-4 border-black pb-3">
            <button
              onClick={() => setActiveTab('toggles')}
              className={`px-4 py-2 font-black border-2 border-black uppercase text-xs sm:text-sm tracking-wider transition-all ${
                activeTab === 'toggles'
                  ? 'bg-rose-400 shadow-[3px_3px_0px_#000000] -translate-x-[1px] -translate-y-[1px]'
                  : 'bg-white hover:bg-zinc-100'
              }`}
            >
              ⚙️ Pemicu Notifikasi
            </button>
            <button
              onClick={() => {
                setActiveTab('reminders');
                setActiveTemplate('h30');
              }}
              className={`px-4 py-2 font-black border-2 border-black uppercase text-xs sm:text-sm tracking-wider transition-all ${
                activeTab === 'reminders'
                  ? 'bg-amber-300 shadow-[3px_3px_0px_#000000] -translate-x-[1px] -translate-y-[1px]'
                  : 'bg-white hover:bg-zinc-100'
              }`}
            >
              📅 Template Pengingat
            </button>
            <button
              onClick={() => {
                setActiveTab('receipts');
                setActiveTemplate('payment_success');
              }}
              className={`px-4 py-2 font-black border-2 border-black uppercase text-xs sm:text-sm tracking-wider transition-all ${
                activeTab === 'receipts'
                  ? 'bg-teal-300 shadow-[3px_3px_0px_#000000] -translate-x-[1px] -translate-y-[1px]'
                  : 'bg-white hover:bg-zinc-100'
              }`}
            >
              💸 Transaksi & Aktivasi
            </button>
          </div>

          {/* TAB CONTENT: TOGGLES */}
          {activeTab === 'toggles' && (
            <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-5">
              <h2 className="text-xl font-black uppercase tracking-wider mb-2">Aktifkan/Matikan Pemicu Email</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-black p-4 bg-zinc-50 flex items-start gap-3 shadow-[3px_3px_0px_#000000]">
                  <input
                    type="checkbox"
                    id="notify_h30_enabled"
                    checked={toggles.notify_h30_enabled}
                    onChange={() => handleToggleChange('notify_h30_enabled')}
                    className="w-5 h-5 border-3 border-black accent-rose-400 rounded-sm cursor-pointer mt-0.5 shadow-[1px_1px_0px_#000000]"
                  />
                  <div>
                    <label htmlFor="notify_h30_enabled" className="font-extrabold text-sm uppercase block cursor-pointer">
                      Tagihan Perpanjangan (H-30)
                    </label>
                    <span className="text-xs text-zinc-500 font-bold">
                      Membuat invoice perpanjangan baru secara otomatis dan mengirim tagihan ke pelanggan 30 hari sebelum kedaluwarsa.
                    </span>
                  </div>
                </div>

                <div className="border-2 border-black p-4 bg-zinc-50 flex items-start gap-3 shadow-[3px_3px_0px_#000000]">
                  <input
                    type="checkbox"
                    id="notify_h7_enabled"
                    checked={toggles.notify_h7_enabled}
                    onChange={() => handleToggleChange('notify_h7_enabled')}
                    className="w-5 h-5 border-3 border-black accent-rose-400 rounded-sm cursor-pointer mt-0.5 shadow-[1px_1px_0px_#000000]"
                  />
                  <div>
                    <label htmlFor="notify_h7_enabled" className="font-extrabold text-sm uppercase block cursor-pointer">
                      Pengingat H-7
                    </label>
                    <span className="text-xs text-zinc-500 font-bold">
                      Mengirim email pengingat kedua 7 hari sebelum domain kedaluwarsa.
                    </span>
                  </div>
                </div>

                <div className="border-2 border-black p-4 bg-zinc-50 flex items-start gap-3 shadow-[3px_3px_0px_#000000]">
                  <input
                    type="checkbox"
                    id="notify_h3_enabled"
                    checked={toggles.notify_h3_enabled}
                    onChange={() => handleToggleChange('notify_h3_enabled')}
                    className="w-5 h-5 border-3 border-black accent-rose-400 rounded-sm cursor-pointer mt-0.5 shadow-[1px_1px_0px_#000000]"
                  />
                  <div>
                    <label htmlFor="notify_h3_enabled" className="font-extrabold text-sm uppercase block cursor-pointer">
                      Pengingat H-3 (Penting)
                    </label>
                    <span className="text-xs text-zinc-500 font-bold">
                      Mengirim email peringatan penting 3 hari sebelum layanan mati secara otomatis.
                    </span>
                  </div>
                </div>

                <div className="border-2 border-black p-4 bg-zinc-50 flex items-start gap-3 shadow-[3px_3px_0px_#000000]">
                  <input
                    type="checkbox"
                    id="notify_h0_enabled"
                    checked={toggles.notify_h0_enabled}
                    onChange={() => handleToggleChange('notify_h0_enabled')}
                    className="w-5 h-5 border-3 border-black accent-rose-400 rounded-sm cursor-pointer mt-0.5 shadow-[1px_1px_0px_#000000]"
                  />
                  <div>
                    <label htmlFor="notify_h0_enabled" className="font-extrabold text-sm uppercase block cursor-pointer">
                      Pengingat Hari H (Expired)
                    </label>
                    <span className="text-xs text-zinc-500 font-bold">
                      Mengirim email notifikasi tepat di hari kedaluwarsa domain berakhir.
                    </span>
                  </div>
                </div>

                <div className="border-2 border-black p-4 bg-zinc-50 flex items-start gap-3 shadow-[3px_3px_0px_#000000]">
                  <input
                    type="checkbox"
                    id="notify_hp7_enabled"
                    checked={toggles.notify_hp7_enabled}
                    onChange={() => handleToggleChange('notify_hp7_enabled')}
                    className="w-5 h-5 border-3 border-black accent-rose-400 rounded-sm cursor-pointer mt-0.5 shadow-[1px_1px_0px_#000000]"
                  />
                  <div>
                    <label htmlFor="notify_hp7_enabled" className="font-extrabold text-sm uppercase block cursor-pointer">
                      Pengingat H+7 (Grace Period)
                    </label>
                    <span className="text-xs text-zinc-500 font-bold">
                      Mengirim email peringatan denda pemulihan/penghapusan 7 hari setelah status domain kedaluwarsa.
                    </span>
                  </div>
                </div>

                <div className="border-2 border-black p-4 bg-zinc-50 flex items-start gap-3 shadow-[3px_3px_0px_#000000]">
                  <input
                    type="checkbox"
                    id="notify_payment_success_enabled"
                    checked={toggles.notify_payment_success_enabled}
                    onChange={() => handleToggleChange('notify_payment_success_enabled')}
                    className="w-5 h-5 border-3 border-black accent-rose-400 rounded-sm cursor-pointer mt-0.5 shadow-[1px_1px_0px_#000000]"
                  />
                  <div>
                    <label htmlFor="notify_payment_success_enabled" className="font-extrabold text-sm uppercase block cursor-pointer">
                      Konfirmasi Transaksi Sukses
                    </label>
                    <span className="text-xs text-zinc-500 font-bold">
                      Mengirim kuitansi pembayaran resmi secara real-time sesaat setelah transfer lunas dikonfirmasi Duitku.
                    </span>
                  </div>
                </div>

                <div className="border-2 border-black p-4 bg-zinc-50 flex items-start gap-3 shadow-[3px_3px_0px_#000000]">
                  <input
                    type="checkbox"
                    id="notify_domain_active_enabled"
                    checked={toggles.notify_domain_active_enabled}
                    onChange={() => handleToggleChange('notify_domain_active_enabled')}
                    className="w-5 h-5 border-3 border-black accent-rose-400 rounded-sm cursor-pointer mt-0.5 shadow-[1px_1px_0px_#000000]"
                  />
                  <div>
                    <label htmlFor="notify_domain_active_enabled" className="font-extrabold text-sm uppercase block cursor-pointer">
                      Layanan Domain Aktif
                    </label>
                    <span className="text-xs text-zinc-500 font-bold">
                      Mengirim email konfirmasi sukses sesaat setelah proses registrasi atau perpanjangan domain selesai dilakukan di RDASH.
                    </span>
                  </div>
                </div>

                <div className="border-2 border-black p-4 bg-green-50 flex items-start gap-3 shadow-[3px_3px_0px_#000000] md:col-span-2">
                  <input
                    type="checkbox"
                    id="notify_whatsapp_enabled"
                    checked={toggles.notify_whatsapp_enabled}
                    onChange={() => handleToggleChange('notify_whatsapp_enabled')}
                    className="w-5 h-5 border-3 border-black accent-green-600 rounded-sm cursor-pointer mt-0.5 shadow-[1px_1px_0px_#000000]"
                  />
                  <div>
                    <label htmlFor="notify_whatsapp_enabled" className="font-extrabold text-sm uppercase block cursor-pointer text-green-800">
                      WhatsApp Gateway (Fonnte)
                    </label>
                    <span className="text-xs text-green-700 font-bold">
                      Mengirim salinan notifikasi tagihan, pengingat jatuh tempo, konfirmasi pembayaran, dan aktivasi domain langsung ke WhatsApp pelanggan menggunakan Fonnte API.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: REMINDERS EDITORS */}
          {activeTab === 'reminders' && (
            <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider mb-2">Edit Template Pengingat Masa Aktif</h2>
                <p className="text-xs text-zinc-500 font-bold mb-4">
                  Desain layout email tetap dibungkus dalam tema Neobrutalist premium. Anda cukup mengisi pesan HTML spesifik untuk bagian isi di sini.
                </p>
              </div>

              {/* Sub tabs */}
              <div className="flex flex-wrap gap-2 bg-zinc-100 p-2 border-2 border-black shadow-[2px_2px_0px_#000000]">
                <button
                  onClick={() => setActiveTemplate('h30')}
                  className={`px-3 py-1 text-xs font-black uppercase border border-black ${
                    activeTemplate === 'h30' ? 'bg-amber-300 shadow-[1px_1px_0px_#000000]' : 'bg-white'
                  }`}
                >
                  H-30 (Tagihan)
                </button>
                <button
                  onClick={() => setActiveTemplate('h7')}
                  className={`px-3 py-1 text-xs font-black uppercase border border-black ${
                    activeTemplate === 'h7' ? 'bg-amber-300 shadow-[1px_1px_0px_#000000]' : 'bg-white'
                  }`}
                >
                  H-7
                </button>
                <button
                  onClick={() => setActiveTemplate('h3')}
                  className={`px-3 py-1 text-xs font-black uppercase border border-black ${
                    activeTemplate === 'h3' ? 'bg-amber-300 shadow-[1px_1px_0px_#000000]' : 'bg-white'
                  }`}
                >
                  H-3
                </button>
                <button
                  onClick={() => setActiveTemplate('h0')}
                  className={`px-3 py-1 text-xs font-black uppercase border border-black ${
                    activeTemplate === 'h0' ? 'bg-amber-300 shadow-[1px_1px_0px_#000000]' : 'bg-white'
                  }`}
                >
                  Hari H (Expired)
                </button>
                <button
                  onClick={() => setActiveTemplate('hp7')}
                  className={`px-3 py-1 text-xs font-black uppercase border border-black ${
                    activeTemplate === 'hp7' ? 'bg-amber-300 shadow-[1px_1px_0px_#000000]' : 'bg-white'
                  }`}
                >
                  H+7 (Grace)
                </button>
              </div>

              {/* Placeholder hints panel */}
              <div className="border-2 border-dashed border-zinc-400 bg-amber-50 p-4 font-bold text-xs">
                <span className="uppercase text-amber-800 block mb-1">🏷️ Placeholder yang didukung untuk Tab ini:</span>
                <ul className="list-disc pl-4 flex flex-col gap-1 text-zinc-700">
                  <li><code className="bg-white border border-black px-1 rounded">{'{name}'}</code> : Nama Lengkap Pelanggan</li>
                  <li><code className="bg-white border border-black px-1 rounded">{'{domainName}'}</code> : Nama domain pembeli (contoh: warnahost.com)</li>
                  <li><code className="bg-white border border-black px-1 rounded">{'{expiryDate}'}</code> : Tanggal kedaluwarsa domain terformat</li>
                  {activeTemplate === 'h30' && (
                    <li><code className="bg-white border border-black px-1 rounded">{'{price}'}</code> : Jumlah total nominal tagihan (contoh: Rp 150.000)</li>
                  )}
                </ul>
              </div>

              {/* Editor Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Section */}
                <div className="flex flex-col gap-4 border-2 border-black p-4 bg-zinc-50 shadow-[3px_3px_0px_#000000]">
                  <h3 className="text-sm font-black uppercase border-b-2 border-black pb-2 mb-2 flex items-center gap-1.5 text-zinc-800">
                    ✉️ Saluran Email
                  </h3>
                  
                  <div>
                    <label className="text-xs uppercase font-black block mb-2">Subject Email</label>
                    <input
                      type="text"
                      value={templates[`template_${activeTemplate}_subject`] || ''}
                      onChange={(e) => handleTemplateChange(`template_${activeTemplate}_subject`, e.target.value)}
                      placeholder="Masukkan subjek email..."
                      className="w-full border-3 border-black p-3 font-bold text-sm focus:outline-none focus:bg-rose-50 shadow-[3px_3px_0px_#000000] focus:shadow-[1px_1px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase font-black block mb-2">Isi Email (Format HTML)</label>
                    <textarea
                      rows={12}
                      value={templates[`template_${activeTemplate}_body`] || ''}
                      onChange={(e) => handleTemplateChange(`template_${activeTemplate}_body`, e.target.value)}
                      placeholder="Masukkan tag HTML untuk isi pesan..."
                      className="w-full border-3 border-black p-3 font-mono text-sm focus:outline-none focus:bg-rose-50 shadow-[3px_3px_0px_#000000] focus:shadow-[1px_1px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                    />
                  </div>
                </div>

                {/* WhatsApp Section */}
                <div className="flex flex-col gap-4 border-2 border-black p-4 bg-green-50 shadow-[3px_3px_0px_#000000]">
                  <h3 className="text-sm font-black uppercase border-b-2 border-black pb-2 mb-2 flex items-center gap-1.5 text-green-800">
                    💬 Saluran WhatsApp
                  </h3>

                  <div>
                    <label className="text-xs uppercase font-black block mb-2">Isi Pesan WhatsApp (Format Teks & Emoji)</label>
                    <textarea
                      rows={16}
                      value={templates[`template_${activeTemplate}_wa`] || ''}
                      onChange={(e) => handleTemplateChange(`template_${activeTemplate}_wa`, e.target.value)}
                      placeholder="Gunakan formatting WhatsApp seperti *tebal*, _miring_, dan emoji..."
                      className="w-full border-3 border-black p-3 font-semibold text-sm focus:outline-none focus:bg-emerald-50 shadow-[3px_3px_0px_#000000] focus:shadow-[1px_1px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: TRANSACTION / ACTIVATION EDITORS */}
          {activeTab === 'receipts' && (
            <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_#000000] flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider mb-2">Edit Template Transaksi & Aktivasi</h2>
                <p className="text-xs text-zinc-500 font-bold mb-4">
                  Desain layout email tetap dibungkus dalam tema Neobrutalist premium. Anda cukup mengisi pesan HTML spesifik untuk bagian isi di sini.
                </p>
              </div>

              {/* Sub tabs */}
              <div className="flex flex-wrap gap-2 bg-zinc-100 p-2 border-2 border-black shadow-[2px_2px_0px_#000000]">
                <button
                  onClick={() => setActiveTemplate('payment_success')}
                  className={`px-3 py-1 text-xs font-black uppercase border border-black ${
                    activeTemplate === 'payment_success' ? 'bg-teal-300 shadow-[1px_1px_0px_#000000]' : 'bg-white'
                  }`}
                >
                  Pembayaran Sukses
                </button>
                <button
                  onClick={() => setActiveTemplate('domain_active')}
                  className={`px-3 py-1 text-xs font-black uppercase border border-black ${
                    activeTemplate === 'domain_active' ? 'bg-teal-300 shadow-[1px_1px_0px_#000000]' : 'bg-white'
                  }`}
                >
                  Domain Aktif
                </button>
              </div>

              {/* Placeholder hints panel */}
              <div className="border-2 border-dashed border-zinc-400 bg-teal-50 p-4 font-bold text-xs">
                <span className="uppercase text-teal-800 block mb-1">🏷️ Placeholder yang didukung untuk Tab ini:</span>
                <ul className="list-disc pl-4 flex flex-col gap-1 text-zinc-700">
                  <li><code className="bg-white border border-black px-1 rounded">{'{name}'}</code> : Nama Lengkap Pelanggan</li>
                  <li><code className="bg-white border border-black px-1 rounded">{'{domainName}'}</code> : Nama domain (contoh: warnahost.com)</li>
                  
                  {activeTemplate === 'payment_success' && (
                    <>
                      <li><code className="bg-white border border-black px-1 rounded">{'{orderId}'}</code> : Nomor Order / ID Transaksi</li>
                      <li><code className="bg-white border border-black px-1 rounded">{'{price}'}</code> : Jumlah bayar terformat (contoh: Rp 150.000)</li>
                      <li><code className="bg-white border border-black px-1 rounded">{'{paymentMethod}'}</code> : Metode pembayaran yang dipilih</li>
                    </>
                  )}

                  {activeTemplate === 'domain_active' && (
                    <>
                      <li><code className="bg-white border border-black px-1 rounded">{'{actionText}'}</code> : Jenis aksi (Registrasi / Perpanjangan)</li>
                      <li><code className="bg-white border border-black px-1 rounded">{'{period}'}</code> : Durasi tahun aktif domain</li>
                      <li><code className="bg-white border border-black px-1 rounded">{'{expiryDate}'}</code> : Tanggal kedaluwarsa baru terformat</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Editor Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Section */}
                <div className="flex flex-col gap-4 border-2 border-black p-4 bg-zinc-50 shadow-[3px_3px_0px_#000000]">
                  <h3 className="text-sm font-black uppercase border-b-2 border-black pb-2 mb-2 flex items-center gap-1.5 text-zinc-800">
                    ✉️ Saluran Email
                  </h3>
                  
                  <div>
                    <label className="text-xs uppercase font-black block mb-2">Subject Email</label>
                    <input
                      type="text"
                      value={templates[`template_${activeTemplate}_subject`] || ''}
                      onChange={(e) => handleTemplateChange(`template_${activeTemplate}_subject`, e.target.value)}
                      placeholder="Masukkan subjek email..."
                      className="w-full border-3 border-black p-3 font-bold text-sm focus:outline-none focus:bg-rose-50 shadow-[3px_3px_0px_#000000] focus:shadow-[1px_1px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase font-black block mb-2">Isi Email (Format HTML)</label>
                    <textarea
                      rows={12}
                      value={templates[`template_${activeTemplate}_body`] || ''}
                      onChange={(e) => handleTemplateChange(`template_${activeTemplate}_body`, e.target.value)}
                      placeholder="Masukkan tag HTML untuk isi pesan..."
                      className="w-full border-3 border-black p-3 font-mono text-sm focus:outline-none focus:bg-rose-50 shadow-[3px_3px_0px_#000000] focus:shadow-[1px_1px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                    />
                  </div>
                </div>

                {/* WhatsApp Section */}
                <div className="flex flex-col gap-4 border-2 border-black p-4 bg-green-50 shadow-[3px_3px_0px_#000000]">
                  <h3 className="text-sm font-black uppercase border-b-2 border-black pb-2 mb-2 flex items-center gap-1.5 text-green-800">
                    💬 Saluran WhatsApp
                  </h3>

                  <div>
                    <label className="text-xs uppercase font-black block mb-2">Isi Pesan WhatsApp (Format Teks & Emoji)</label>
                    <textarea
                      rows={16}
                      value={templates[`template_${activeTemplate}_wa`] || ''}
                      onChange={(e) => handleTemplateChange(`template_${activeTemplate}_wa`, e.target.value)}
                      placeholder="Gunakan formatting WhatsApp seperti *tebal*, _miring_, dan emoji..."
                      className="w-full border-3 border-black p-3 font-semibold text-sm focus:outline-none focus:bg-emerald-50 shadow-[3px_3px_0px_#000000] focus:shadow-[1px_1px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT ACTIONS BAR */}
          <div className="flex justify-end mt-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-green-400 border-4 border-black px-6 py-3 font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_#000000] hover:bg-green-300 active:shadow-[1px_1px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] transition-all disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
