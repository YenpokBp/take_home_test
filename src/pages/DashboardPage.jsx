import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import client from '../api/client';
import TopUpForm from '../components/TopUpForm';
import TransferForm from '../components/TransferForm';
import TransactionHistory from '../components/TransactionHistory';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

const TABS = [
  { key: 'topup', label: 'Top Up' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'history', label: 'Riwayat' },
];

async function getBalance() {
  const res = await client.get('/wallet/balance');
  return res.data.data.balance;
}

function BalanceCard({ balance, loading }) {
  return (
    <div className="card">
      <p className="balance-label">Saldo Dompet Anda</p>
      <p className="balance-amount">
        {loading ? '— memuat...' : IDR.format(balance ?? 0)}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topup');

  const fetchBalance = useCallback(async () => {
    try {
      setBalance(await getBalance());
    } catch (err) {
      console.error('Gagal memuat saldo:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getBalance()
      .then((nextBalance) => {
        if (!cancelled) setBalance(nextBalance);
      })
      .catch((err) => {
        if (!cancelled) console.error('Gagal memuat saldo:', err);
      })
      .finally(() => {
        if (!cancelled) setBalanceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <strong>💰 Mini Wallet</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="text-muted" style={{ color: '#ccc' }}>
            Halo, <strong style={{ color: '#fff' }}>{user?.username}</strong>
          </span>
          <button className="btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Kartu saldo */}
        <BalanceCard balance={balance} loading={balanceLoading} />

        {/* Panel aksi */}
        <div className="card">
          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'topup' && (
            <TopUpForm onSuccess={fetchBalance} />
          )}
          {activeTab === 'transfer' && (
            <TransferForm onSuccess={fetchBalance} />
          )}
          {activeTab === 'history' && <TransactionHistory />}
        </div>
      </div>
    </div>
  );
}
