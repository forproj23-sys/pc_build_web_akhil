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
    <div className="app-container" style={{ background: (role === 'supplier' || role === 'assembler' || role === 'user') ? 'linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)' : undefined }}>
      <TopNav />

      <div className="container app-content" style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1.5rem' }}>
        <div className="card-like" style={{ background: (role === 'supplier' || role === 'assembler' || role === 'user') ? '#ffffff' : undefined, padding: '1.5rem', borderRadius: 8, border: (role === 'supplier' || role === 'assembler' || role === 'user') ? '1px solid #e6e6e6' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>{role === 'supplier' ? 'Supplier Payments & Transactions' : role === 'assembler' ? 'Assembler Payments & Transactions' : role === 'user' ? 'User Payments & Transactions' : 'Payments & Transactions'}</h3>
            <div style={{ color: '#6c757d', fontSize: '0.95rem' }}>{transactions.length} transactions</div>
          </div>

          {/* supplier-like stats row when on supplier role */}
          {(role === 'supplier' || role === 'assembler' || role === 'user') && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #e6e6e6', minWidth: 160, boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>${transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0).toFixed(2)}</div>
                <div style={{ color: '#666' }}>Total Transactions Amount</div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #e6e6e6', minWidth: 160, boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>{transactions.filter(t => t.status === 'paid').length}</div>
                <div style={{ color: '#666' }}>Paid</div>
              </div>
              <div style={{ padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #e6e6e6', minWidth: 160, boxShadow: '0 6px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111' }}>{transactions.filter(t => t.status !== 'paid').length}</div>
                <div style={{ color: '#666' }}>Pending</div>
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: '1.5rem', color: '#6c757d' }}>
              {role === 'supplier' ? 'No supplier transactions found.' : role === 'assembler' ? 'No assembler transactions found.' : role === 'user' ? 'No user transactions found.' : 'No transactions found.'}
            </div>
          ) : (
            <div className="table-responsive" style={{ marginTop: '0.5rem' }}>
              <table className="table table-striped table-bordered align-middle" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ffffff' }}>
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
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#ffffff' }}>{new Date(t.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#ffffff' }}>{t.type}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', color: '#111', backgroundColor: '#ffffff' }}>${Number(t.amount || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#ffffff' }}>{t.from}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#ffffff' }}>{t.to}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#ffffff' }}>{t.buildId || '-'}</td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', backgroundColor: '#ffffff' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: '#ffffff', color: '#111' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem', border: '1px solid #e6e6e6', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', backgroundColor: '#ffffff' }}>
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

