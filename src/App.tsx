import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import Loader from './components/ui/Loader';

// Lazy load Public Pages
const Home = lazy(() => import('./pages/Home'));
const Whois = lazy(() => import('./pages/Whois'));
const Prices = lazy(() => import('./pages/Prices'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Checkout = lazy(() => import('./pages/Checkout'));

// Lazy load Dashboard Customer Pages
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Domains = lazy(() => import('./pages/dashboard/Domains'));
const DashboardPrices = lazy(() => import('./pages/dashboard/Prices'));
const DashboardWhois = lazy(() => import('./pages/dashboard/Whois'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Payment = lazy(() => import('./pages/dashboard/Payment'));
const Transfer = lazy(() => import('./pages/dashboard/Transfer'));
const Detail = lazy(() => import('./pages/dashboard/Detail'));
const DashboardBilling = lazy(() => import('./pages/dashboard/Billing'));

// Lazy load Admin Pages
const AdminBilling = lazy(() => import('./pages/admin/Billing'));
const AdminPricing = lazy(() => import('./pages/admin/Pricing'));
const AdminTransactions = lazy(() => import('./pages/admin/Transactions'));
const AdminDomains = lazy(() => import('./pages/admin/Domains'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/whois" element={<Whois />} />
            <Route path="/prices" element={<Prices />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />

            {/* Customer Dashboard Routes */}
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/dashboard/domains" element={<Domains />} />
            <Route path="/dashboard/domains/transfer" element={<Transfer />} />
            <Route path="/dashboard/domains/payment" element={<Payment />} />
            <Route path="/dashboard/domains/:id" element={<Detail />} />
            <Route path="/dashboard/prices" element={<DashboardPrices />} />
            <Route path="/dashboard/whois" element={<DashboardWhois />} />
            <Route path="/dashboard/billing" element={<DashboardBilling />} />

            {/* Administrator Area Routes */}
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/admin/pricing" element={<AdminPricing />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/domains" element={<AdminDomains />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* Fallback / Catch-All Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}
