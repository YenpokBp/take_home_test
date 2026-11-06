import { useState } from 'react';
import client from '../api/client';

const IDR = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

export default function TransferForm({ onSuccess }) {
  const [form, setForm] = useState({ recipient: '', amount: '', note: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        recipient: form.recipient.trim(),
        amount: parseInt(form.amount, 10),
      };
      if (form.note.trim()) payload.note = form.note.trim();

      const res = await client.post('/wallet/transfer', payload);
      const { to, balance } = res.data.data;
      setSuccess(
        `Transfer ke ${to} berhasil! Saldo sekarang: ${IDR.format(balance)}`
      );
      setForm({ recipient: '', amount: '', note: '' });
      onSuccess();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const fe = {};
        data.errors.forEach((e) => { fe[e.field] = e.message; });
        setFieldErrors(fe);
      } else {
        setError(data?.message || 'Transfer gagal, coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Transfer ke Pengguna Lain</h3>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="tf-recipient">Email / Nomor Telepon Penerima</label>
          <input
            id="tf-recipient"
            type="text"
            value={form.recipient}
            onChange={(e) =>
              setForm((f) => ({ ...f, recipient: e.target.value }))
            }
            placeholder="email@contoh.com atau 08xxxxxxxxx"
            required
          />
          {fieldErrors.recipient && (
            <span className="field-error">{fieldErrors.recipient}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="tf-amount">Nominal (Rupiah)</label>
          <input
            id="tf-amount"
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, amount: e.target.value }))
            }
            placeholder="Contoh: 50000"
            min="1"
            step="1"
            required
          />
          {fieldErrors.amount && (
            <span className="field-error">{fieldErrors.amount}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="tf-note">
            Catatan <span className="text-muted">(opsional)</span>
          </label>
          <input
            id="tf-note"
            type="text"
            value={form.note}
            onChange={(e) =>
              setForm((f) => ({ ...f, note: e.target.value }))
            }
            placeholder="Contoh: Bayar makan siang"
            maxLength={255}
          />
          {fieldErrors.note && (
            <span className="field-error">{fieldErrors.note}</span>
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Memproses...' : 'Transfer'}
        </button>
      </form>
    </div>
  );
}
