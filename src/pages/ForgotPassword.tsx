import React, { useState } from 'react';
import Layout from '../layouts/Layout';
import { apiFetch } from '../utils/api';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.replace(/\s+/g, '');

    setIsLoading(true);
    setAlert(null);

    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({ email: cleanEmail })
      });

      setAlert({
        message: response.message || 'Tautan atur ulang kata sandi telah dikirimkan ke email Anda.',
        type: 'success'
      });
      setEmail('');
    } catch (err: unknown) {
      console.error('Forgot password failed:', err);
      const apiErr = err as { message?: string };
      setAlert({
        message: apiErr.message || 'Gagal mengirim permintaan. Silakan coba lagi.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Lupa Kata Sandi">
      <section className="flex items-center justify-center py-20 min-h-[70vh] bg-zinc-100">
        <div className="container max-w-md px-4 text-center">
          <div className="card p-8 sm:p-10 bg-white border-3 border-black shadow-[6px_6px_0_#000] rounded-sm text-left">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black">Lupa Kata Sandi</h2>
              <p className="text-xs text-zinc-500 font-bold mt-1">
                Masukkan alamat email Anda untuk menerima tautan atur ulang kata sandi.
              </p>
            </div>

            {/* Alert */}
            {alert && (
              <div className={`alert alert-${alert.type}`}>
                <span>{alert.message}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group mb-0">
                <label className="form-label" htmlFor="email">Alamat Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control font-bold border-black border-3"
                  placeholder="nama@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full mt-4 h-12 font-black shadow-[3px_3px_0_#000]"
              >
                {isLoading ? 'Mengirim...' : 'Kirim Tautan Atur Ulang'}
              </button>
            </form>

            <div className="text-center mt-6">
              <a href="/login" className="text-xs font-bold text-zinc-500 hover:text-black">
                Kembali ke Halaman Login
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default ForgotPassword;
