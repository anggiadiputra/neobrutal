import React from 'react';
import Layout from '../layouts/Layout';

export const About: React.FC = () => {
  return (
    <Layout title="Tentang Kami">
      <div className="max-w-[800px] mx-auto text-left py-12 px-4 animate-[fadeSlideUp_0.25s_ease-out]">
        {/* Header */}
        <div className="mb-8 border-b-3 border-black pb-4">
          <h1 className="text-3xl font-black flex items-center gap-2">
            <span className="w-8 h-8 border-3 border-black bg-[var(--accent-primary)] flex items-center justify-center rounded-sm shadow-[2px_2px_0_0_#000] text-sm">ℹ️</span>
            Tentang Kami
          </h1>
          <p className="text-sm font-bold text-zinc-500 mt-2">
            Kenali lebih dekat platform pengelolaan dan registrasi domain kami.
          </p>
        </div>

        {/* Content Card */}
        <div className="card bg-white border-3 border-black p-6 sm:p-8 shadow-[6px_6px_0px_#000] text-black mb-8">
          <h3 className="text-lg font-black mb-4">Siapa Kami?</h3>
          <p className="text-sm font-semibold text-zinc-600 leading-relaxed mb-6">
            Kami adalah penyedia layanan registrasi, transfer, dan pengelolaan nama domain terpercaya yang berkomitmen untuk memberikan kemudahan bagi individu, pelaku bisnis, hingga developer dalam memiliki identitas digital mereka secara instan dan aman.
          </p>

          <h3 className="text-lg font-black mb-4">Visi & Misi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-amber-50 border-2 border-black p-4 shadow-[3px_3px_0px_#000]">
              <strong className="text-sm font-black block mb-2 text-amber-900">🌟 Visi Kami</strong>
              <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
                Menjadi platform pengelolaan domain nomor satu yang dikenal dengan transparansi harga, kesederhanaan sistem, dan performa yang tangguh tanpa biaya-biaya tersembunyi.
              </p>
            </div>
            <div className="bg-rose-50 border-2 border-black p-4 shadow-[3px_3px_0px_#000]">
              <strong className="text-sm font-black block mb-2 text-rose-900">🚀 Misi Kami</strong>
              <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
                Menghadirkan antarmuka pengelolaan yang intuitif, integrasi otomatis instan ke registry global, serta dukungan pelanggan yang responsif guna membantu setiap ide dapat mengudara dengan cepat di internet.
              </p>
            </div>
          </div>

          <h3 className="text-lg font-black mb-4">Mengapa Memilih Kami?</h3>
          <ul className="space-y-3 text-sm font-semibold text-zinc-600">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-black">✔</span>
              <span><strong>Registrasi Instan:</strong> Domain langsung aktif dalam hitungan detik setelah pembayaran diverifikasi otomatis.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-black">✔</span>
              <span><strong>Tanpa Biaya Tersembunyi:</strong> Harga perpanjangan transparan dan harga promo yang jujur.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-black">✔</span>
              <span><strong>Kontrol Penuh:</strong> Kelola DNS Record kustom dan nameserver dengan mudah kapan saja melalui dasbor terintegrasi.</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default About;
