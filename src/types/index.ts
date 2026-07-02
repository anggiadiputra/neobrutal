export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DomainItem {
  id?: string;
  domain_id?: string;
  name: string;
  domain_name?: string;
  status: string | string[];
  expiration_date?: string;
  expired_at?: string;
  created_at?: string;
  updated_at?: string;
  registrar?: string;
  nameserver?: string[];
  dnssec?: string;
  auto_renew?: boolean;
}

export interface TransactionItem {
  id: string;
  transaction_id?: string;
  invoice_id?: string;
  domain_name: string;
  type: string;
  amount: number;
  status: 'Unpaid' | 'Paid' | 'Canceled' | 'Pending';
  date?: string;
  created_at?: string;
  due_date?: string;
  payment_method?: string;
}

export interface Region {
  id: string;
  name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ExtensionPrice {
  extension: string;
  registerPrice: number;
  renewPrice: number;
  transferPrice: number;
}
