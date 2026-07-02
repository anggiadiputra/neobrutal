import React from 'react';
import Layout from '../layouts/Layout';

export const Privacy: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-[800px] mx-auto text-left py-12 px-4 animate-[fadeSlideUp_0.25s_ease-out]">
        {/* Header */}
        <div className="mb-8 border-b-3 border-black pb-4">
          <h1 className="text-3xl font-black flex items-center gap-2">
            <span className="w-8 h-8 border-3 border-black bg-[var(--accent-primary)] flex items-center justify-center rounded-sm shadow-[2px_2px_0_0_#000] text-sm">🔒</span>
            Kebijakan Privasi
          </h1>
          <p className="text-sm font-bold text-zinc-500 mt-2">
            Bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.
          </p>
        </div>

        {/* Content */}
        <div className="card bg-white border-3 border-black p-6 sm:p-8 shadow-[6px_6px_0px_#000] text-black space-y-6">
          <section>
            <h3 className="text-lg font-black mb-2">1. Informasi Yang Kami Kumpulkan</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Kami mengumpulkan informasi pribadi yang Anda berikan secara sukarela saat mendaftar akun, melakukan transaksi pemesanan domain, atau saat berkorespondensi dengan kami. Informasi ini meliputi nama, alamat email, alamat rumah/kantor, nomor telepon, dan data nameserver/pendaftaran WHOIS domain.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">2. Penggunaan Informasi Pribadi</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed mb-3">
              Informasi pribadi Anda digunakan untuk kepentingan operasional berikut:
            </p>
            <ul className="list-disc list-inside text-sm font-semibold text-zinc-600 space-y-1.5 ml-2">
              <li>Memproses pendaftaran, transfer, dan perpanjangan nama domain Anda ke registri pusat.</li>
              <li>Menyediakan akses lengkap ke dashboard pengelolaan domain.</li>
              <li>Mengirimkan notifikasi tagihan pembayaran dan konfirmasi transaksi.</li>
              <li>Menghubungi Anda terkait kendala teknis atau pemeliharaan sistem.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">3. Perlindungan & Keamanan Informasi</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Kami mengimplementasikan langkah-langkah keamanan teknologi standar industri untuk menjaga kerahasiaan data pribadi Anda dari akses yang tidak sah. Data sensitif seperti kredensial akun dan password dienkripsi secara aman di dalam sistem kami.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">4. Pembagian Data Dengan Pihak Ketiga</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Kami membagikan informasi pendaftaran domain Anda kepada mitra registrar (seperti RDASH / PANDI) sesuai dengan kebijakan registrasi domain yang berlaku. Informasi WHOIS yang dipublikasikan secara umum mengikuti regulasi resmi dari badan pengawas domain (ICANN/PANDI). Kami tidak pernah menjual atau menyewakan informasi pribadi Anda kepada pengiklan pihak ketiga mana pun.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">5. Perubahan Kebijakan</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Kami berhak untuk memperbarui Kebijakan Privasi ini dari waktu ke waktu. Setiap perubahan akan diumumkan langsung di halaman ini dan berlaku segera setelah dipublikasikan.
            </p>
          </section>

          <div className="border-t border-dashed border-black pt-4 mt-6 text-xs text-zinc-500 font-bold">
            Terakhir Diperbarui: 2 Juli 2026
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
