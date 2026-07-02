import React from 'react';
import Layout from '../layouts/Layout';

export const Disclaimer: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-[800px] mx-auto text-left py-12 px-4 animate-[fadeSlideUp_0.25s_ease-out]">
        {/* Header */}
        <div className="mb-8 border-b-3 border-black pb-4">
          <h1 className="text-3xl font-black flex items-center gap-2">
            <span className="w-8 h-8 border-3 border-black bg-[var(--accent-primary)] flex items-center justify-center rounded-sm shadow-[2px_2px_0_0_#000] text-sm">⚠️</span>
            Disklaimer
          </h1>
          <p className="text-sm font-bold text-zinc-500 mt-2">
            Batasan tanggung jawab dan ketentuan penggunaan informasi layanan kami.
          </p>
        </div>

        {/* Content */}
        <div className="card bg-white border-3 border-black p-6 sm:p-8 shadow-[6px_6px_0px_#000] text-black space-y-6">
          <section>
            <h3 className="text-lg font-black mb-2">1. Umum</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Seluruh informasi dan layanan yang disediakan di platform kami disajikan "sebagaimana adanya" (*as is*) tanpa jaminan dalam bentuk apa pun. Kami berusaha keras untuk menjaga keakuratan informasi harga, ketersediaan domain, dan performa sistem, namun tidak menjamin bahwa layanan akan bebas dari gangguan teknis atau kesalahan penulisan data.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">2. Batasan Tanggung Jawab</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Kami tidak bertanggung jawab atas segala kerugian finansial, kehilangan data, atau dampak bisnis tidak langsung yang disebabkan oleh:
            </p>
            <ul className="list-disc list-inside text-sm font-semibold text-zinc-600 space-y-1.5 ml-2 mt-2">
              <li>Kegagalan pendaftaran nama domain oleh registri pusat (registry error).</li>
              <li>Keterlambatan konfirmasi pembayaran dari pihak payment gateway.</li>
              <li>Kehilangan kepemilikan domain akibat kelalaian perpanjangan oleh pengguna.</li>
              <li>Penyalahgunaan nama domain oleh pihak ketiga (misal: sengketa merek).</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">3. Pranala Luar (External Links)</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Situs web kami mungkin menyertakan tautan ke situs web eksternal yang dioperasikan oleh pihak ketiga (misalnya gateway pembayaran atau penyedia DNS). Kami tidak mengontrol, meninjau, atau bertanggung jawab atas konten, kebijakan privasi, atau keandalan situs web pihak ketiga tersebut.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black mb-2">4. Kebijakan Hukum</h3>
            <p className="text-sm font-semibold text-zinc-600 leading-relaxed">
              Pengguna bertanggung jawab penuh untuk memastikan bahwa nama domain yang didaftarkan tidak melanggar hak kekayaan intelektual (HAKI) atau merek dagang terdaftar milik pihak lain. Segala sengketa hukum terkait nama domain harus diselesaikan langsung oleh pendaftar melalui badan arbitrase domain yang berwenang (misalnya PANDI untuk domain .ID).
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

export default Disclaimer;
