import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import TopNav from '../components/TopNav';

function AssemblerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchBuilds();
  }, [filterStatus]);

  const fetchBuilds = async () => {
    try {
      setLoading(true);
      const url = filterStatus ? `/builds?status=${filterStatus}` : '/builds';
      const res = await api.get(url);
      setBuilds(res.data.data);
    } catch (error) {
      console.error('Error fetching builds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (buildId, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) {
      return;
    }

    try {
      setUpdating(true);
      const res = await api.put(`/builds/${buildId}/status`, { status: newStatus });
      setBuilds(builds.map((b) => (b._id === buildId ? res.data.data : b)));
      if (selectedBuild?._id === buildId) {
        setSelectedBuild(res.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusButton = (build) => {
    const { assemblyStatus } = build;
    
    if (assemblyStatus === 'Pending') {
      return (
        <button
          onClick={() => handleStatusUpdate(build._id, 'Assembling')}
          disabled={updating}
          className="btn btn-sm btn-success"
          style={styles.actionButton}
        >
          Start Assembling
        </button>
      );
    } else if (assemblyStatus === 'Assembling') {
      return (
        <>
          <button
            onClick={() => handleStatusUpdate(build._id, 'Pending')}
            disabled={updating}
            className="btn btn-sm btn-secondary"
            style={styles.secondaryButton}
          >
            Mark Pending
          </button>
          <button
            onClick={() => handleStatusUpdate(build._id, 'Completed')}
            disabled={updating}
            className="btn btn-sm btn-success"
            style={styles.completeButton}
          >
            Mark Completed
          </button>
        </>
      );
    } else if (assemblyStatus === 'Completed') {
      return (
        <span className="badge bg-success" style={styles.completedBadge}>✓ Completed</span>
      );
    }
  };

  const pendingCount = builds.filter((b) => b.assemblyStatus === 'Pending').length;
  const assemblingCount = builds.filter((b) => b.assemblyStatus === 'Assembling').length;
  const completedCount = builds.filter((b) => b.assemblyStatus === 'Completed').length;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading assigned builds...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="app-container">
      <TopNav />
      <div style={styles.content} className="app-content">
        <h2>Assigned Builds</h2>

        {/* Statistics */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{pendingCount}</h3>
            <p style={styles.statLabel}>Pending</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{assemblingCount}</h3>
            <p style={styles.statLabel}>Assembling</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{completedCount}</h3>
            <p style={styles.statLabel}>Completed</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{builds.length}</h3>
            <p style={styles.statLabel}>Total</p>
          </div>
        </div>

        {/* Filter */}
        <div style={styles.filterGroup} className="d-flex gap-2 align-items-center">
          <label style={styles.label} className="mb-0">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select"
            style={{ maxWidth: '240px' }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assembling">Assembling</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Build Details Modal */}
        {selectedBuild && (
            <div style={styles.modalOverlay} onClick={() => setSelectedBuild(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedBuild(null)} className="btn btn-light" style={styles.closeBtn}>
                ×
              </button>
              <h3>Build Details</h3>
              
              <div style={styles.detailSection}>
                <p><strong>Customer:</strong> {selectedBuild.userID?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedBuild.userID?.email || 'N/A'}</p>
                <p><strong>Status:</strong> {selectedBuild.assemblyStatus}</p>
                <p><strong>Total Price:</strong> ${selectedBuild.totalPrice.toFixed(2)}</p>
                <p><strong>Created:</strong> {new Date(selectedBuild.createdAt).toLocaleString()}</p>
              </div>

              <div style={styles.detailSection}>
                <h4>Components List:</h4>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle" style={styles.componentTable}>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Component</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBuild.components.map((comp, i) => (
                        <tr key={i}>
                          <td>{comp.category}</td>
                          <td>{comp.componentName}</td>
                          <td>${comp.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2"><strong>Total</strong></td>
                        <td><strong>${selectedBuild.totalPrice.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedBuild.compatibilityCheck && (
                <div style={styles.compatibilitySection}>
                  <h4>Compatibility Check:</h4>
                  <p><strong>{selectedBuild.compatibilityCheck.summary}</strong></p>
                  {selectedBuild.compatibilityCheck.issues?.length > 0 && (
                    <div>
                      <strong>Issues:</strong>
                      <ul>
                        {selectedBuild.compatibilityCheck.issues.map((issue, i) => (
                          <li key={i} style={styles.issue}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedBuild.compatibilityCheck.warnings?.length > 0 && (
                    <div>
                      <strong>Warnings:</strong>
                      <ul>
                        {selectedBuild.compatibilityCheck.warnings.map((warning, i) => (
                          <li key={i} style={styles.warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={styles.modalActions}>
                {getStatusButton(selectedBuild)}
              </div>
            </div>
          </div>
        )}

        {/* Builds List */}
        {builds.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No builds assigned to you yet.</p>
            <p style={styles.smallText}>
              Builds will be assigned when users request assembly service.
            </p>
          </div>
        ) : (
          <div style={styles.buildsList}>
            {builds.map((build) => (
              <div key={build._id} style={styles.buildCard}>
                <div style={styles.buildCardHeader}>
                  <div>
                    <h3>Build #{builds.indexOf(build) + 1}</h3>
                    <p style={styles.customerName}>Customer: {build.userID?.name || 'N/A'}</p>
                    <p style={styles.smallText}>
                      {new Date(build.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(build.assemblyStatus === 'Completed'
                          ? styles.completed
                          : build.assemblyStatus === 'Assembling'
                          ? styles.assembling
                          : styles.pending),
                      }}
                    >
                      {build.assemblyStatus}
                    </span>
                  </div>
                </div>

                <div style={styles.buildCardBody}>
                  <div style={styles.buildInfo}>
                    <p><strong>Components:</strong> {build.components.length}</p>
                    <p><strong>Total Price:</strong> ${build.totalPrice.toFixed(2)}</p>
                  </div>

                  <div style={styles.buildActions}>
                    <button
                      onClick={() => setSelectedBuild(build)}
                      className="btn btn-sm btn-outline-primary"
                      style={styles.viewButton}
                    >
                      View Details
                    </button>
                    {getStatusButton(build)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logo: {
    margin: 0,
    color: '#333',
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  userInfo: {
    color: '#666',
  },
  content: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 2rem',
  },
  loading: {
    textAlign: 'center',
    padding: '4rem',
    fontSize: '1.25rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '2px solid #007bff',
  },
  statValue: {
    fontSize: '2.5rem',
    margin: '0 0 0.5rem 0',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '1rem',
    color: '#666',
    margin: 0,
  },
  filterGroup: {
    marginBottom: '1.5rem',
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  label: {
    marginRight: '1rem',
    fontWeight: '500',
  },
  select: {
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  buildsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  buildCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  buildCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #eee',
  },
  customerName: {
    color: '#666',
    margin: '0.5rem 0',
  },
  statusBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  pending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  assembling: {
    backgroundColor: '#cfe2ff',
    color: '#084298',
  },
  completed: {
    backgroundColor: '#d1e7dd',
    color: '#0f5132',
  },
  buildCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  buildInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#666',
  },
  buildActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  viewButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  actionButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  secondaryButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  completeButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  completedBadge: {
    padding: '0.5rem 1rem',
    backgroundColor: '#d1e7dd',
    color: '#0f5132',
    borderRadius: '4px',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  smallText: {
    fontSize: '0.875rem',
    color: '#888',
    margin: '0.25rem 0',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#666',
    width: '2rem',
    height: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSection: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  componentTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '0.5rem',
  },
  'componentTable th': {
    backgroundColor: '#e9ecef',
    padding: '0.75rem',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
  },
  'componentTable td': {
    padding: '0.75rem',
    borderBottom: '1px solid #ddd',
  },
  'componentTable tfoot': {
    fontWeight: 'bold',
    backgroundColor: '#f8f9fa',
  },
  compatibilitySection: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
  },
  issue: {
    color: '#dc3545',
    margin: '0.25rem 0',
  },
  warning: {
    color: '#856404',
    margin: '0.25rem 0',
  },
  modalActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1.5rem',
    justifyContent: 'flex-end',
  },
};

export default AssemblerDashboard;
