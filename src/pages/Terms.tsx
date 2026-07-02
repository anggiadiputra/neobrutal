import React from 'react';
import Layout from '../layouts/Layout';

export const Terms: React.FC = () => {
  return (
    <Layout title="Syarat & Ketentuan">
      <div className="max-w-[800px] mx-auto text-left py-12 px-4 animate-[fadeSlideUp_0.25s_ease-out]">
        {/* Header */}
        <div className="mb-8 border-b-3 border-black pb-4">
          <h1 className="text-3xl font-black flex items-center gap-2">
            <span className="w-8 h-8 border-3 border-black bg-[var(--accent-primary)] flex items-center justify-center rounded-sm shadow-[2px_2px_0_0_#000] text-sm">📝</span>
            Syarat & Ketentuan (TOS)
          </h1>
          <p className="text-sm font-bold text-zinc-500 mt-2">
            Aturan penggunaan layanan registrasi dan pengelolaan domain di platform kami.
          </p>
        </div>

        {/* Content */}
        <div className="card bg-white border-3 border-black p-6 sm:p-8 shadow-[6px_6px_0px_#000] text-black space-y-6">
          <section>
            <h3 className="text-lg font-black mb-2">1. Ketentuan Akun Pengguna</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Saat mendaftar akun, Anda setuju untuk memberikan informasi pendaftaran yang akurat, lengkap, dan terkini. Anda bertanggung jawab penuh untuk menjaga keamanan password akun Anda serta seluruh aktivitas transaksi yang terjadi di bawah akun Anda.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">2. Pendaftaran Nama Domain</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Registrasi nama domain tunduk pada ketersediaan nama domain pada saat pemrosesan oleh registry pusat. Pengajuan pembayaran atau invoice tidak menjamin domain berhasil didaftarkan sebelum sistem kami mendapat konfirmasi sukses dari API registrar. Jika domain gagal didaftarkan akibat kendala teknis atau domain telah dibeli orang lain terlebih dahulu, kami akan mengembalikan dana Anda sepenuhnya.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">3. Kebijakan Pembayaran & Perpanjangan</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Seluruh biaya pendaftaran, transfer, dan perpanjangan domain harus dilunasi sesuai invoice sebelum masa aktif domain berakhir. Pengguna bertanggung jawab penuh atas perpanjangan domain mereka sendiri. Kami akan mengirimkan email pengingat sebelum tanggal kedaluwarsa domain, namun kami tidak bertanggung jawab atas hilangnya hak kepemilikan domain akibat keterlambatan perpanjangan oleh pengguna.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">4. Penggunaan Domain yang Diizinkan</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Domain yang didaftarkan melalui platform kami dilarang keras digunakan untuk aktivitas ilegal yang melanggar hukum Negara Kesatuan Republik Indonesia, termasuk namun tidak terbatas pada: perjudian online, phishing, distribusi malware, pornografi anak, atau ujaran kebencian. Kami berhak melakukan penangguhan (*suspend*) domain secara sepihak jika ditemukan pelanggaran terhadap aturan ini.
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

export default Terms;
