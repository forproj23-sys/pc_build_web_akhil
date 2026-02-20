import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/assembler-dashboard.css';

/* ===== SVG Nav Icons (Feather-style stroke icons) ===== */
const IconDashboard = () => (
  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
);
const IconBuilds = () => (
  <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const IconPayments = () => (
  <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
);
const IconSettings = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const IconMenu = () => (
  <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);

/* ===== Navigation config ===== */
const NAV_ITEMS = [
  { key: 'overview', label: 'Dashboard',       icon: IconDashboard },
  { key: 'builds',   label: 'Assigned Builds', icon: IconBuilds },
];

const LINK_ITEMS = [
  { to: '/payments', label: 'Payments', icon: IconPayments },
  { to: '/profile',  label: 'Settings', icon: IconSettings },
];

/* ============================================================
   Main Assembler Dashboard
   ============================================================ */
function AssemblerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    try {
      setUpdating(true);
      const res = await api.put(`/builds/${buildId}/status`, { status: newStatus });
      setBuilds(builds.map((b) => (b._id === buildId ? res.data.data : b)));
      if (selectedBuild?._id === buildId) setSelectedBuild(res.data.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleNavClick = (key) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const getStatusButton = (build) => {
    const { assemblyStatus } = build;
    if (assemblyStatus === 'Pending') {
      return (
        <button onClick={() => handleStatusUpdate(build._id, 'Assembling')} disabled={updating} className="asm-btn asm-btn-success asm-btn-sm">
          Start Assembling
        </button>
      );
    } else if (assemblyStatus === 'Assembling') {
      return (
        <>
          <button onClick={() => handleStatusUpdate(build._id, 'Pending')} disabled={updating} className="asm-btn asm-btn-secondary asm-btn-sm">
            Mark Pending
          </button>
          <button onClick={() => handleStatusUpdate(build._id, 'Completed')} disabled={updating} className="asm-btn asm-btn-success asm-btn-sm">
            Mark Completed
          </button>
        </>
      );
    } else if (assemblyStatus === 'Completed') {
      return <span className="asm-completed-badge">✓ Completed</span>;
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Completed') return 'asm-badge asm-badge-completed';
    if (status === 'Assembling') return 'asm-badge asm-badge-assembling';
    return 'asm-badge asm-badge-pending';
  };

  const pendingCount = builds.filter((b) => b.assemblyStatus === 'Pending').length;
  const assemblingCount = builds.filter((b) => b.assemblyStatus === 'Assembling').length;
  const completedCount = builds.filter((b) => b.assemblyStatus === 'Completed').length;

  const userInitials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const pageTitleMap = {
    overview: 'Dashboard',
    builds: 'Assigned Builds',
  };

  return (
    <div className="asm-page">
      {/* Mobile hamburger */}
      <button className="asm-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <IconMenu />
      </button>

      {/* Overlay (mobile) */}
      <div className={`asm-sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`asm-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="asm-sidebar-header">
          <div className="asm-sidebar-logo">PC Build</div>
          <div className="asm-sidebar-subtitle">Assembler Panel</div>
        </div>

        <nav className="asm-sidebar-nav">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`asm-nav-item${activeTab === key ? ' active' : ''}`} onClick={() => handleNavClick(key)}>
              <span className="asm-nav-icon"><Icon /></span>
              <span className="asm-nav-label">{label}</span>
            </button>
          ))}

          {LINK_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="asm-nav-item" style={{ textDecoration: 'none' }}>
              <span className="asm-nav-icon"><Icon /></span>
              <span className="asm-nav-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="asm-sidebar-footer">
          <button className="asm-nav-item" onClick={handleLogout}>
            <span className="asm-nav-icon"><IconLogout /></span>
            <span className="asm-nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="asm-main">
        <header className="asm-page-header">
          <div>
            <h1 className="asm-page-title">{pageTitleMap[activeTab] || 'Dashboard'}</h1>
            <p className="asm-page-subtitle">Assembler &rsaquo; {pageTitleMap[activeTab]}</p>
          </div>
          <div className="asm-profile-section">
            <div className="asm-profile-info">
              <span className="asm-profile-name">{user?.name || user?.email}</span>
              <span className="asm-profile-role">{user?.role}</span>
            </div>
            <div className="asm-profile-avatar">{userInitials}</div>
          </div>
        </header>

        <div className="asm-content">
          {activeTab === 'overview' && (
            <OverviewTab
              builds={builds}
              loading={loading}
              pendingCount={pendingCount}
              assemblingCount={assemblingCount}
              completedCount={completedCount}
            />
          )}
          {activeTab === 'builds' && (
            <BuildsTab
              builds={builds}
              loading={loading}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              selectedBuild={selectedBuild}
              setSelectedBuild={setSelectedBuild}
              getStatusButton={getStatusButton}
              getStatusBadgeClass={getStatusBadgeClass}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   Overview Tab — Stats summary
   ============================================================ */
function OverviewTab({ builds, loading, pendingCount, assemblingCount, completedCount }) {
  if (loading) return <div className="asm-loading">Loading statistics...</div>;

  return (
    <div>
      <h2 className="asm-section-title">Assembly Overview</h2>
      <div className="asm-stats-grid">
        <div className="asm-stat-card highlight">
          <h3 className="asm-stat-value warning">{pendingCount}</h3>
          <p className="asm-stat-label">Pending</p>
        </div>
        <div className="asm-stat-card">
          <h3 className="asm-stat-value">{assemblingCount}</h3>
          <p className="asm-stat-label">Assembling</p>
        </div>
        <div className="asm-stat-card">
          <h3 className="asm-stat-value">{completedCount}</h3>
          <p className="asm-stat-label">Completed</p>
        </div>
        <div className="asm-stat-card">
          <h3 className="asm-stat-value">{builds.length}</h3>
          <p className="asm-stat-label">Total Builds</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Builds Tab — Filter, Cards, Detail Modal
   ============================================================ */
function BuildsTab({ builds, loading, filterStatus, setFilterStatus, selectedBuild, setSelectedBuild, getStatusButton, getStatusBadgeClass }) {
  if (loading) return <div className="asm-loading">Loading builds...</div>;

  return (
    <div>
      <h2 className="asm-section-title">Assigned Builds ({builds.length})</h2>

      {/* Filter */}
      <div className="asm-filter-group">
        <label className="asm-filter-label">Filter by Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="asm-select">
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Assembling">Assembling</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Build Details Modal */}
      {selectedBuild && (
        <div className="asm-modal-overlay" onClick={() => setSelectedBuild(null)}>
          <div className="asm-modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedBuild(null)} className="asm-modal-close">Close</button>
            <h3>Build Details</h3>

            <div className="asm-detail-section">
              <p><strong>Customer:</strong> {selectedBuild.userID?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedBuild.userID?.email || 'N/A'}</p>
              <p><strong>Status:</strong> <span className={getStatusBadgeClass(selectedBuild.assemblyStatus)}>{selectedBuild.assemblyStatus}</span></p>
              <p><strong>Total Price:</strong> ${selectedBuild.totalPrice.toFixed(2)}</p>
              <p><strong>Created:</strong> {new Date(selectedBuild.createdAt).toLocaleString()}</p>
            </div>

            <div className="asm-detail-section">
              <h4>Components List:</h4>
              <div className="asm-table-container">
                <table className="asm-table">
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
              <div className="asm-compatibility">
                <h4>Compatibility Check:</h4>
                <p><strong>{selectedBuild.compatibilityCheck.summary}</strong></p>
                {selectedBuild.compatibilityCheck.issues?.length > 0 && (
                  <div>
                    <strong>Issues:</strong>
                    <ul>
                      {selectedBuild.compatibilityCheck.issues.map((issue, i) => (
                        <li key={i} className="asm-issue">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedBuild.compatibilityCheck.warnings?.length > 0 && (
                  <div>
                    <strong>Warnings:</strong>
                    <ul>
                      {selectedBuild.compatibilityCheck.warnings.map((warning, i) => (
                        <li key={i} className="asm-warning">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="asm-modal-actions">
              {getStatusButton(selectedBuild)}
            </div>
          </div>
        </div>
      )}

      {/* Builds Grid */}
      {builds.length === 0 ? (
        <div className="asm-empty-state">
          <p>No builds assigned to you yet.</p>
          <p className="asm-small-text">Builds will be assigned when users request assembly service.</p>
        </div>
      ) : (
        <div className="asm-builds-grid">
          {builds.map((build, idx) => (
            <div key={build._id} className="asm-build-card">
              <div className="asm-build-card-header">
                <div>
                  <h3>Build #{idx + 1}</h3>
                  <p className="asm-customer-name">Customer: {build.userID?.name || 'N/A'}</p>
                  <p className="asm-small-text">{new Date(build.createdAt).toLocaleString()}</p>
                </div>
                <span className={getStatusBadgeClass(build.assemblyStatus)}>{build.assemblyStatus}</span>
              </div>

              <div className="asm-build-card-body">
                <div className="asm-build-info">
                  <p><strong>Components:</strong> {build.components.length}</p>
                  <p><strong>Total Price:</strong> ${build.totalPrice.toFixed(2)}</p>
                </div>

                <div className="asm-build-actions">
                  <button onClick={() => setSelectedBuild(build)} className="asm-btn asm-btn-primary asm-btn-sm">
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
  );
}

export default AssemblerDashboard;
