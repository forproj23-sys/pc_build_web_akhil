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
      <div className="container app-content py-4">
        <h3>Payments & Transactions</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="text-muted">No transactions found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
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
                    <td>{t.type}</td>
                    <td>${Number(t.amount || 0).toFixed(2)}</td>
                    <td>{t.from}</td>
                    <td>{t.to}</td>
                    <td>{t.buildId || '-'}</td>
                    <td>{t.status}</td>
                    <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <pre style={{ whiteSpace: 'nowrap', margin: 0 }}>{JSON.stringify(t.meta || {})}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

