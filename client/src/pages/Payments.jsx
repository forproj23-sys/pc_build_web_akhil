import { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import api from '../utils/api';

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="app-container">
      <TopNav />

      <div className="container app-content" style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div className="card-like">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Payments & Transactions</h3>
            <div style={{ color: '#6c757d', fontSize: '0.95rem' }}>{transactions.length} transactions</div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '1.5rem', color: '#6c757d' }}>No transactions found.</div>
          ) : (
            <div className="table-responsive" style={{ marginTop: '0.5rem' }}>
              <table className="table table-striped table-bordered align-middle" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e7f3ff' }}>
                    <th style={{ padding: '0.6rem', border: '1px solid #e6e6e6' }}>Date</th>
                    <th style={{ padding: '0.6rem', border: '1px solid #e6e6e6' }}>Type</th>
                    <th style={{ padding: '0.6rem', border: '1px solid #e6e6e6' }}>Amount</th>
                    <th style={{ padding: '0.6rem', border: '1px solid #e6e6e6' }}>From</th>
                    <th style={{ padding: '0.6rem', border: '1px solid #e6e6e6' }}>To</th>
                    <th style={{ padding: '0.6rem', border: '1px solid #e6e6e6' }}>Build ID</th>
                    <th style={{ padding: '0.6rem', border: '1px solid #e6e6e6' }}>Status</th>
                    <th style={{ padding: '0.6rem', border: '1px solid #e6e6e6' }}>Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id}>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#f6fbff' }}>{new Date(t.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#f6fbff' }}>{t.type}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', color: '#28a745', backgroundColor: '#f6fbff' }}>${Number(t.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#f6fbff' }}>{t.from}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#f6fbff' }}>{t.to}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#f6fbff' }}>{t.buildId || '-'}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#f6fbff' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: t.status === 'paid' ? '#e6f7ec' : '#fff4e6', color: t.status === 'paid' ? '#28a745' : '#c47d00' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', backgroundColor: '#f6fbff' }}>
                        <pre style={{ margin: 0 }}>{JSON.stringify(t.meta || {})}</pre>
                      </td>
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

