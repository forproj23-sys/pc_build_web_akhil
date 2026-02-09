import { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
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

  return (
    <div className="app-container" style={{ background: role === 'supplier' ? 'linear-gradient(180deg, #e8fff2 0%, #f5f5f5 100%)' : undefined }}>
      <TopNav />

      <div className="container app-content" style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div className="card-like" style={{ background: role === 'supplier' ? 'linear-gradient(180deg,#f6fff7 0%, #ffffff 100%)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>{role === 'supplier' ? 'Supplier Payments & Transactions' : 'Payments & Transactions'}</h3>
            <div style={{ color: '#6c757d', fontSize: '0.95rem' }}>{transactions.length} transactions</div>
          </div>

          {/* supplier-like stats row when on supplier role */}
          {role === 'supplier' && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'white', borderRadius: 8, border: '1px solid #e6f4ea', minWidth: 160 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>${transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0).toFixed(2)}</div>
                <div style={{ color: '#666' }}>Total Transactions Amount</div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'white', borderRadius: 8, border: '1px solid #e6f4ea', minWidth: 160 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{transactions.filter(t => t.status === 'paid').length}</div>
                <div style={{ color: '#666' }}>Paid</div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'white', borderRadius: 8, border: '1px solid #e6f4ea', minWidth: 160 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{transactions.filter(t => t.status !== 'paid').length}</div>
                <div style={{ color: '#666' }}>Pending</div>
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '1.5rem', color: '#6c757d' }}>{role === 'supplier' ? 'No supplier transactions found.' : 'No transactions found.'}</div>
          ) : (
            <div className="table-responsive" style={{ marginTop: '0.5rem' }}>
              <table className="table table-striped table-bordered align-middle" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: role === 'supplier' ? '#eaf7ee' : '#e7f3ff' }}>
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
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: role === 'supplier' ? '#f6fff7' : '#f6fbff' }}>{new Date(t.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: role === 'supplier' ? '#f6fff7' : '#f6fbff' }}>{t.type}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', color: role === 'supplier' ? '#28a745' : '#28a745', backgroundColor: role === 'supplier' ? '#f6fff7' : '#f6fbff' }}>${Number(t.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: role === 'supplier' ? '#f6fff7' : '#f6fbff' }}>{t.from}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: role === 'supplier' ? '#f6fff7' : '#f6fbff' }}>{t.to}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: role === 'supplier' ? '#f6fff7' : '#f6fbff' }}>{t.buildId || '-'}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: role === 'supplier' ? '#f6fff7' : '#f6fbff' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: t.status === 'paid' ? (role === 'supplier' ? '#e6f7ec' : '#e6f7ec') : (role === 'supplier' ? '#fffef0' : '#fff4e6'), color: t.status === 'paid' ? '#28a745' : '#c47d00' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', backgroundColor: role === 'supplier' ? '#f6fff7' : '#f6fbff' }}>
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

