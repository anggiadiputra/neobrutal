import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { apiFetch } from '../../utils/api';
import { useToast } from '../../components/ui/Toast';
import { getUser } from '../../utils/auth';

interface TransactionItem {
  id: number;
  domain_name: string;
  action: 'register' | 'renew' | 'transfer' | string;
  period: number;
  cost_price: string | number;
  markup_price: string | number;
  margin: string | number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REGISTRATION_FAILED' | string;
  payment_method: string;
  payment_reference?: string | null;
  merchant_order_id: string;
  tax: string | number;
  admin_fee: string | number;
  grand_total: string | number;
  ns: string;
  created_at: string;
  updated_at: string;
}

export const Billing: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>({ tax_enabled: true, tax_rate: 11 });
  const [appName, setAppName] = useState('Ruangtunggu');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const loadTransactions = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/payment/transactions');
      if (res && res.success && Array.isArray(res.data)) {
        setTransactions(res.data);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Error loading customer transactions:', err);
      setErrorMsg(err.message || 'Gagal memuat riwayat transaksi billing.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();

    // Load active customer user
    const u = getUser();
    if (u) setUser(u);

    // Fetch branding and system settings
    const loadSettings = async () => {
      try {
        const res = await apiFetch('/api/settings', { requireAuth: false });
        if (res?.success && res.data) {
          setSettings(res.data);
          if (res.data.app_name) setAppName(res.data.app_name);
        }
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }

      // Fetch active payment methods for name mapping
      try {
        const pmRes = await apiFetch(`/api/settings/payment-methods?_=${Date.now()}`, { requireAuth: false });
        if (pmRes?.success && Array.isArray(pmRes.data?.paymentFee)) {
          setPaymentMethods(pmRes.data.paymentFee);
        }
      } catch (e) {
        console.warn('Failed to load payment methods:', e);
      }
    };
    loadSettings();
  }, []);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS') {
      return (
        <span className="px-2 py-0.5 bg-green-200 border-2 border-black text-[9px] font-black uppercase shadow-[1px_1px_0px_#000]">
          Lunas
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span className="px-2 py-0.5 bg-yellow-300 border-2 border-black text-[9px] font-black uppercase shadow-[1px_1px_0px_#000]">
          Pending
        </span>
      );
    }
    if (s === 'REGISTRATION_FAILED') {
      return (
        <span className="px-2 py-0.5 bg-orange-300 border-2 border-black text-[9px] font-black uppercase shadow-[1px_1px_0px_#000]">
          Gagal Registrasi
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-red-200 border-2 border-black text-[9px] font-black uppercase shadow-[1px_1px_0px_#000]">
        Gagal / Expired
      </span>
    );
  };

  const getActionLabel = (action: string) => {
    const a = action.toLowerCase();
    if (a === 'register') return 'Registrasi';
    if (a === 'renew') return 'Perpanjangan';
    if (a === 'transfer') return 'Transfer';
    return action;
  };

  const getPaymentMethodName = (code: string) => {
    if (!code) return '-';
    const method = paymentMethods.find(m => m.paymentMethod.toUpperCase() === code.toUpperCase());
    if (method) return method.paymentName;
    
    const fallbacks: Record<string, string> = {
      'VC': 'Credit Card',
      'BC': 'BCA VA',
      'M2': 'Mandiri VA',
      'VA': 'Maybank VA',
      'I1': 'BNI VA',
      'B1': 'CIMB Niaga VA',
      'BT': 'Permata VA',
      'BR': 'BRI VA (BRIVA)',
      'BV': 'BSI VA',
      'DM': 'Danamon VA',
      'S1': 'Bank Sampoerna VA',
      'NC': 'BNC VA',
      'AG': 'Artha Graha VA',
      'IR': 'Indomaret',
      'FT': 'Pegadaian / ALFA / POS',
      'OV': 'OVO',
      'DA': 'DANA',
      'SA': 'ShopeePay',
      'LF': 'LinkAja',
      'LA': 'LinkAja',
      'OL': 'OVO Account Link',
      'SL': 'ShopeePay Link',
      'SP': 'ShopeePay QRIS',
      'NQ': 'Nobu QRIS',
      'GQ': 'Gudang Voucher QRIS',
      'SQ': 'Nusapay QRIS',
      'DN': 'Indodana Paylater',
      'AT': 'ATOME',
      'JP': 'Jenius Pay'
    };
    return fallbacks[code.toUpperCase()] || code.toUpperCase();
  };

  const handlePayNow = (tx: TransactionItem) => {
    const fullDomain = tx.domain_name.toLowerCase();
    const firstDot = fullDomain.indexOf('.');
    const domainName = firstDot !== -1 ? fullDomain.substring(0, firstDot) : fullDomain;
    const domainExtension = firstDot !== -1 ? fullDomain.substring(firstDot).replace(/^\./, '') : '';

    const pendingCheckout = {
      domainName,
      domainExtension,
      years: tx.period,
      price: Number(tx.markup_price), // retail price
      ns: tx.ns ? tx.ns.split(',') : [],
      merchantOrderId: tx.merchant_order_id,
      action: tx.action
    };

    sessionStorage.setItem('pending_domain_checkout', JSON.stringify(pendingCheckout));
    toast.success('Melanjutkan ke halaman pembayaran...');
    navigate(`/dashboard/domains/payment?orderId=${tx.merchant_order_id}`);
  };

  const handlePrintInvoice = (tx: TransactionItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Gagal membuka halaman cetak. Pastikan pop-up browser diaktifkan.');
      return;
    }

    const brandName = appName;
    const formattedDate = new Date(tx.created_at).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemPrice = Number(tx.markup_price);
    const itemTax = Number(tx.tax);
    const itemAdmin = Number(tx.admin_fee);
    const itemTotal = Number(tx.grand_total);

    // Dynamic badge settings based on status
    const statusUpper = tx.status ? tx.status.toUpperCase() : 'PENDING';
    let badgeText = 'PENDING';
    let badgeBg = '#fef08a';
    let badgeColor = '#854d0e';

    if (statusUpper === 'SUCCESS') {
      badgeText = 'LUNAS';
      badgeBg = '#d1fae5';
      badgeColor = '#065f46';
    } else if (['FAILED', 'REGISTRATION_FAILED', 'RENEWAL_FAILED'].includes(statusUpper)) {
      badgeText = 'GAGAL / EXP';
      badgeBg = '#fee2e2';
      badgeColor = '#991b1b';
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${tx.merchant_order_id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1c1917;
      padding: 40px;
      line-height: 1.5;
      background-color: #fff;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 3px solid #000;
      padding: 40px;
      box-shadow: 6px 6px 0px #000;
      background-color: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-container {
      display: flex;
      flex-direction: column;
    }
    .logo {
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .logo-sub {
      font-size: 11px;
      font-weight: 700;
      color: #78716c;
      margin-top: 2px;
    }
    .invoice-title {
      font-size: 22px;
      font-weight: 900;
      text-align: right;
      text-transform: uppercase;
    }
    .invoice-num {
      font-family: monospace;
      font-size: 12px;
      color: #78716c;
      font-weight: bold;
      margin-top: 4px;
    }
    .invoice-info {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 20px;
      margin-bottom: 35px;
    }
    .info-block h4 {
      margin: 0 0 6px 0;
      text-transform: uppercase;
      font-size: 10px;
      color: #78716c;
      letter-spacing: 0.5px;
      font-weight: 800;
    }
    .info-block p {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    th, td {
      padding: 12px;
      border-bottom: 2px solid #000;
      text-align: left;
      font-size: 12px;
    }
    th {
      background-color: #f5f5f4;
      font-weight: 900;
      text-transform: uppercase;
    }
    td {
      font-weight: 700;
    }
    .totals {
      width: 320px;
      margin-left: auto;
      margin-top: 15px;
      border: 2px solid #000;
      padding: 15px;
      background-color: #fdfdfd;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      font-weight: 700;
    }
    .totals-row.grand-total {
      border-top: 2px dashed #000;
      font-size: 16px;
      font-weight: 900;
      padding-top: 10px;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      background-color: ${badgeBg};
      border: 2px solid #000;
      color: ${badgeColor};
      font-weight: 900;
      text-transform: uppercase;
      font-size: 11px;
      box-shadow: 2px 2px 0px #000;
    }
    .footer {
      margin-top: 60px;
      border-top: 2px dashed #000;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #78716c;
      font-weight: 700;
    }
    .print-btn-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: flex-end;
    }
    .print-btn {
      font-family: inherit;
      font-weight: 900;
      font-size: 12px;
      background-color: #fde047;
      color: #000;
      border: 3px solid #000;
      padding: 8px 20px;
      cursor: pointer;
      box-shadow: 3px 3px 0px #000;
      text-transform: uppercase;
    }
    .print-btn:active {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0px #000;
    }
    @media print {
      body {
        padding: 0;
      }
      .invoice-card {
        box-shadow: none;
        border: 2px solid #000;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar no-print">
    <button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div class="logo-container">
        <span class="logo">${brandName}</span>
        <span class="logo-sub">Portal Registrasi Domain</span>
      </div>
      <div>
        <div class="invoice-title">Bukti Pembayaran</div>
        <div class="invoice-num">No: ${tx.merchant_order_id}</div>
      </div>
    </div>

    <div class="invoice-info">
      <div class="info-block">
        <h4>Diterbitkan Kepada:</h4>
        <p>${user?.name || 'Pelanggan ' + brandName}</p>
        <p style="font-weight: 500; color: #78716c; font-size: 12px; margin-top: 2px;">${user?.email || '-'}</p>
      </div>
      <div class="info-block" style="text-align: right;">
        <h4>Tanggal Transaksi:</h4>
        <p>${formattedDate}</p>
        <div style="margin-top: 10px;">
          <span class="badge">${badgeText}</span>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Deskripsi Item</th>
          <th>Tipe</th>
          <th>Durasi</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pendaftaran Nama Domain <strong>${tx.domain_name}</strong></td>
          <td style="text-transform: capitalize;">${tx.action}</td>
          <td>${tx.period} Tahun</td>
          <td style="text-align: right;">${formatCurrency(itemPrice)}</td>
        </tr>
      </tbody>
    </table>

    <div class="invoice-info" style="margin-bottom: 0;">
      <div class="info-block">
        <h4>Metode Pembayaran:</h4>
        <p style="text-transform: uppercase;">${getPaymentMethodName(tx.payment_method)}</p>
        <p style="font-family: monospace; font-size: 11px; color: #78716c; font-weight: bold; margin-top: 2px;">
          Ref: ${tx.payment_reference || '-'}
        </p>
      </div>
      <div class="info-block">
        <div class="totals">
          <div class="totals-row">
            <span>Harga Domain:</span>
            <span>${formatCurrency(itemPrice)}</span>
          </div>
          ${itemTax > 0 ? `
          <div class="totals-row">
            <span>PPN (${settings.tax_rate || 11}%):</span>
            <span>${formatCurrency(itemTax)}</span>
          </div>
          ` : ''}
          <div class="totals-row">
            <span>Biaya Gerbang / Admin:</span>
            <span>${formatCurrency(itemAdmin)}</span>
          </div>
          <div class="totals-row grand-total">
            <span>Total Bayar:</span>
            <span>${formatCurrency(itemTotal)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      Terima kasih atas kepercayaan Anda menggunakan layanan ${brandName}.<br>
      Pendaftaran domain ini diproses secara otomatis dan sah secara hukum.
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <DashboardLayout title="Billing & Tagihan" activeMenu="billing">
      <div className="text-left">
        {/* Header */}
        <div className="border-b-3 border-black pb-4 mb-6">
          <h1 className="text-3xl font-black">Tagihan & Billing</h1>
          <p className="text-xs sm:text-sm font-bold text-zinc-500 mt-2">
            Riwayat tagihan, invoice pendaftaran domain, dan status pembayaran Anda.
          </p>
        </div>

        {/* Transactions Table Container */}
        <div className="card bg-white border-3 border-black shadow-[4px_4px_0_#000] p-0! overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 font-bold gap-3">
              <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-xs">Memuat riwayat transaksi...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-16 text-center text-rose-600 font-bold font-mono px-4">
              Error: {errorMsg}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 font-bold px-4">
              Belum ada riwayat transaksi billing. Semua invoice pendaftaran domain Anda akan muncul di sini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-bold text-black">
                <thead>
                  <tr className="bg-zinc-100 border-b-3 border-black">
                    <th className="p-4 border-r border-black">Order ID</th>
                    <th className="p-4 border-r border-black">Domain</th>
                    <th className="p-4 border-r border-black">Aktivitas</th>
                    <th className="p-4 border-r border-black">Durasi</th>
                    <th className="p-4 border-r border-black text-right">Total Tagihan</th>
                    <th className="p-4 border-r border-black">Metode</th>
                    <th className="p-4 border-r border-black">Tanggal</th>
                    <th className="p-4 border-r border-black text-center">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b-2 border-black hover:bg-zinc-50 transition-colors">
                      <td className="p-4 border-r border-black">
                        <code className="bg-zinc-100 border border-zinc-300 px-1.5 py-0.5 rounded-sm font-mono text-[10px]">
                          {t.merchant_order_id}
                        </code>
                      </td>
                      <td className="p-4 border-r border-black font-extrabold text-[var(--accent-primary)] truncate max-w-[150px]">
                        {t.domain_name}
                      </td>
                      <td className="p-4 border-r border-black">
                        {getActionLabel(t.action)}
                      </td>
                      <td className="p-4 border-r border-black">
                        {t.period} Tahun
                      </td>
                      <td className="p-4 border-r border-black text-right font-black">
                        {formatCurrency(t.grand_total)}
                      </td>
                      <td className="p-4 border-r border-black uppercase text-[10px]">
                        {getPaymentMethodName(t.payment_method)}
                      </td>
                      <td className="p-4 border-r border-black text-zinc-500 font-medium">
                        {new Date(t.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 border-r border-black text-center">
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex gap-1.5 justify-center">
                          {t.status.toUpperCase() === 'PENDING' && (
                            <button
                              onClick={() => handlePayNow(t)}
                              className="px-2.5 py-1 text-[10px] font-black border-2 border-black bg-yellow-300 hover:bg-yellow-400 cursor-pointer shadow-[1px_1px_0px_#000] active:translate-y-0.5 transition-all text-black uppercase"
                            >
                              Bayar
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintInvoice(t)}
                            className="px-2.5 py-1 text-[10px] font-black border-2 border-black bg-white hover:bg-zinc-100 cursor-pointer shadow-[1px_1px_0px_#000] active:translate-y-0.5 transition-all text-black uppercase"
                          >
                            Cetak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};


export default Billing;
