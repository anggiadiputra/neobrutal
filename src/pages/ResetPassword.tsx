import React, { useState, useEffect } from 'react';
import Layout from '../layouts/Layout';
import { apiFetch } from '../utils/api';

export const ResetPassword: React.FC = () => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || '';
    setToken(tokenParam);
    if (!tokenParam) {
      setAlert({
        message: 'Token tidak valid atau tidak ditemukan pada link Anda.',
        type: 'error'
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setAlert({ message: 'Token tidak valid atau tidak ditemukan pada link Anda.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setAlert({ message: 'Konfirmasi kata sandi tidak cocok.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setAlert(null);

    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({ token, password })
      });

      setAlert({
        message: response.message || 'Kata sandi berhasil diperbarui. Mengarahkan Anda ke halaman login...',
        type: 'success'
      });

      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: unknown) {
      console.error('Reset password failed:', err);
      const apiErr = err as { message?: string };
      setAlert({
        message: apiErr.message || 'Gagal mengatur ulang kata sandi. Silakan coba lagi.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Atur Ulang Kata Sandi">
      <section className="flex items-center justify-center py-20 min-h-[70vh] bg-zinc-100">
        <div className="container max-w-md px-4 text-center">
          <div className="card p-8 sm:p-10 bg-white border-3 border-black shadow-[6px_6px_0_#000] rounded-sm text-left">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black">Atur Ulang Kata Sandi</h2>
              <p className="text-xs text-zinc-500 font-bold mt-1">
                Masukkan kata sandi baru Anda di bawah ini.
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
                <label className="form-label" htmlFor="password">Kata Sandi Baru</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control font-bold border-black border-3"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-password-btn"
                    aria-label="Lihat kata sandi"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label" htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</label>
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-control font-bold border-black border-3"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="toggle-password-btn"
                    aria-label="Lihat kata sandi"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="btn btn-primary w-full mt-4 h-12 font-black shadow-[3px_3px_0_#000]"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
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
export default ResetPassword;
