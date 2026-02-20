import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import '../styles/payments.css';

/* Back arrow icon */
const IconBack = () => (
  <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'guest';

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions');
      setTransactions(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const roleLabel = {
    supplier: 'Supplier', assembler: 'Assembler', user: 'User', admin: 'Admin',
  };
  const pageTitle = `${roleLabel[role] || ''} Payments & Transactions`;

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'success') return 'payments-badge payments-badge-completed';
    if (s === 'pending') return 'payments-badge payments-badge-pending';
    if (s === 'failed' || s === 'rejected') return 'payments-badge payments-badge-failed';
    return 'payments-badge payments-badge-default';
  };

  return (
    <div className="payments-page">
      <div className="payments-container">
        {/* Header */}
        <div className="payments-header">
          <div className="payments-header-left">
            <button className="payments-back-btn" onClick={() => navigate(-1)} title="Go back">
              <IconBack />
            </button>
            <h1 className="payments-title">{pageTitle}</h1>
          </div>
          <span className="payments-count">{transactions.length} transactions</span>
        </div>

        {/* Stats */}
        <div className="payments-stats">
          <div className="payments-stat-card">
            <div className="payments-stat-value">${totalAmount.toFixed(2)}</div>
            <p className="payments-stat-label">Total Transactions Amount</p>
          </div>
          <div className="payments-stat-card">
            <div className="payments-stat-value">{transactions.length}</div>
            <p className="payments-stat-label">Total Transactions</p>
          </div>
        </div>

        {/* Content */}
        <div className="payments-content">
          {error && <div className="payments-alert payments-alert-error">{error}</div>}

          {loading ? (
            <div className="payments-loading">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="payments-empty">No transactions found.</div>
          ) : (
            <div className="payments-table-container">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Build ID</th>
                    <th>Status</th>
                    <th>Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id}>
                      <td>{new Date(t.createdAt).toLocaleString()}</td>
                      <td><span className="payments-type-badge">{t.type}</span></td>
                      <td><span className="payments-amount">${Number(t.amount || 0).toFixed(2)}</span></td>
                      <td>{t.from}</td>
                      <td>{t.to}</td>
                      <td>{t.buildId || '-'}</td>
                      <td><span className={getStatusBadge(t.status)}>{t.status}</span></td>
                      <td><span className="payments-meta">{JSON.stringify(t.meta || {})}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

