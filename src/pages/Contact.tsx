import React, { useState } from 'react';
import Layout from '../layouts/Layout';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <Layout title="Hubungi Kami">
      <div className="max-w-[900px] mx-auto text-left py-12 px-4 animate-[fadeSlideUp_0.25s_ease-out]">
        {/* Header */}
        <div className="mb-8 border-b-3 border-black pb-4">
          <h1 className="text-3xl font-black flex items-center gap-2">
            <span className="w-8 h-8 border-3 border-black bg-[var(--accent-primary)] flex items-center justify-center rounded-sm shadow-[2px_2px_0_0_#000] text-sm">✉️</span>
            Hubungi Kami
          </h1>
          <p className="text-sm font-bold text-zinc-500 mt-2">
            Ada pertanyaan atau butuh bantuan teknis? Hubungi kami langsung melalui form di bawah ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-start">
          {/* Form */}
          <div className="card bg-white border-3 border-black p-6 sm:p-8 shadow-[6px_6px_0px_#000] text-black">
            <h3 className="text-lg font-black mb-4">Kirim Pesan</h3>
            
            {submitted ? (
              <div className="bg-emerald-100 border-2 border-black p-4 mb-4 font-bold text-xs text-emerald-800 shadow-[3px_3px_0px_#000]">
                🎉 Terima kasih! Pesan Anda telah terkirim. Tim kami akan segera menghubungi Anda.
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2.5 border-2 border-black rounded-sm outline-none bg-white placeholder-zinc-400 font-semibold text-sm"
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-2.5 border-2 border-black rounded-sm outline-none bg-white placeholder-zinc-400 font-semibold text-sm"
                  placeholder="nama@email.com"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Isi Pesan</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="px-3 py-2.5 border-2 border-black rounded-sm outline-none bg-white placeholder-zinc-400 font-semibold text-sm resize-y"
                  placeholder="Tuliskan pesan atau pertanyaan Anda di sini..."
                />
              </div>

              <button
                type="submit"
                className="py-3 border-2 border-black bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover,#e0b000)] text-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer mt-2 text-center"
              >
                Kirim Pesan
              </button>
            </form>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-5">
            <div className="card bg-white border-3 border-black p-6 shadow-[5px_5px_0px_#000] text-black">
              <h3 className="text-sm font-black mb-4 border-b-2 border-black pb-2">Informasi Kontak</h3>
              <div className="flex flex-col gap-4 text-xs font-semibold text-zinc-600">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🏢</span>
                  <div>
                    <strong className="text-black block mb-0.5">Alamat Kantor</strong>
                    <span>Jl. Jenderal Sudirman No. 123, Jakarta Selatan, DKI Jakarta 12190</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">📧</span>
                  <div>
                    <strong className="text-black block mb-0.5">Email Support</strong>
                    <a href="mailto:support@ruangtunggu.com" className="text-[var(--accent-primary)] hover:underline">support@ruangtunggu.com</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">📞</span>
                  <div>
                    <strong className="text-black block mb-0.5">Telepon</strong>
                    <span>+62 (21) 555-0199</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-amber-50 border-3 border-black p-6 shadow-[5px_5px_0px_#000] text-black">
              <h3 className="text-xs font-black uppercase tracking-wider mb-2 text-amber-900">⏰ Jam Operasional</h3>
              <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
                Senin - Jumat: 09:00 - 18:00 WIB<br />
                Sabtu: 09:00 - 13:00 WIB<br />
                Hari Minggu & Libur Nasional: Tutup (Tetap melayani sistem otomatis 24 jam)
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
