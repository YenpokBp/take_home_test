import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TransactionHistory() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.get(`/wallet/transactions?page=${page}&limit=10`);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat transaksi.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) return <p className="text-muted">Memuat riwayat transaksi...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  const { items, pagination } = data;

  return (
    <div>
      <h3>Riwayat Transaksi</h3>
      {items.length === 0 ? (
        <p className="text-muted">Belum ada transaksi.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Pihak Lain</th>
                <th>Nominal</th>
                <th>Saldo Akhir</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.reference_code}>
                  <td>{formatDate(tx.created_at)}</td>
                  <td>
                    <span
                      className={
                        tx.direction === 'IN' ? 'badge-in' : 'badge-out'
                      }
                    >
                      {tx.direction === 'IN' ? '▲ Masuk' : '▼ Keluar'}
                    </span>
                  </td>
                  <td>{tx.counterparty || '-'}</td>
                  <td>{IDR.format(tx.amount)}</td>
                  <td>{IDR.format(tx.balance_after)}</td>
                  <td>{tx.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button
          className="btn-secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Prev
        </button>
        <span className="text-muted">
          Halaman {pagination.page} / {Math.max(pagination.total_pages, 1)}
        </span>
        <button
          className="btn-secondary"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= pagination.total_pages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
