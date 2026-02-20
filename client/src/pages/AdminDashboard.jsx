import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/admin-dashboard.css';

/* ===== SVG Nav Icons (Feather-style stroke icons) ===== */
const IconDashboard = () => (
  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
);
const IconComponents = () => (
  <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconCategories = () => (
  <svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
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

/* ============================================================
   Navigation config
   ============================================================ */
const NAV_ITEMS = [
  { key: 'overview',   label: 'Dashboard',  icon: IconDashboard },
  { key: 'components', label: 'Components', icon: IconComponents },
  { key: 'users',      label: 'Users',      icon: IconUsers },
  { key: 'categories', label: 'Categories', icon: IconCategories },
  { key: 'builds',     label: 'All Builds', icon: IconBuilds },
];

const LINK_ITEMS = [
  { to: '/payments', label: 'Payments', icon: IconPayments },
  { to: '/profile',  label: 'Settings', icon: IconSettings },
];

/* ============================================================
   Main Admin Dashboard
   ============================================================ */
function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = (key) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const userInitials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const pageTitleMap = {
    overview: 'Dashboard',
    components: 'Components',
    users: 'Users',
    categories: 'Categories',
    builds: 'All Builds',
  };

  return (
    <div className="admin-page">
      {/* Mobile hamburger */}
      <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <IconMenu />
      </button>

      {/* Overlay (mobile) */}
      <div
        className={`admin-sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">PC Build</div>
          <div className="admin-sidebar-subtitle">Admin Panel</div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`admin-nav-item${activeTab === key ? ' active' : ''}`}
              onClick={() => handleNavClick(key)}
            >
              <span className="admin-nav-icon"><Icon /></span>
              <span className="admin-nav-label">{label}</span>
            </button>
          ))}

          {LINK_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="admin-nav-item" style={{ textDecoration: 'none' }}>
              <span className="admin-nav-icon"><Icon /></span>
              <span className="admin-nav-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={handleLogout}>
            <span className="admin-nav-icon"><IconLogout /></span>
            <span className="admin-nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="admin-main">
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title">{pageTitleMap[activeTab] || 'Dashboard'}</h1>
            <p className="admin-page-subtitle">Admin &rsaquo; {pageTitleMap[activeTab]}</p>
          </div>
          <div className="admin-profile-section">
            <div className="admin-profile-info">
              <span className="admin-profile-name">{user?.name || user?.email}</span>
              <span className="admin-profile-role">{user?.role}</span>
            </div>
            <div className="admin-profile-avatar">{userInitials}</div>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'components' && <ComponentsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'builds' && <BuildsTab />}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   Overview Tab
   ============================================================ */
function OverviewTab() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalComponents: 0,
    totalBuilds: 0,
    pendingBuilds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, componentsRes, buildsRes] = await Promise.all([
        api.get('/users'),
        api.get('/components'),
        api.get('/builds'),
      ]);

      const builds = buildsRes.data.data;
      const users = usersRes.data.data;
      setStats({
        totalUsers: usersRes.data.count,
        pendingUsers: users.filter((u) => u.approved === false).length,
        totalComponents: componentsRes.data.count,
        totalBuilds: builds.length,
        pendingBuilds: builds.filter((b) => b.assemblyStatus === 'Pending').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading statistics...</div>;
  }

  return (
    <div>
      <h2 className="admin-section-title">System Overview</h2>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <h3 className="admin-stat-value">{stats.totalUsers}</h3>
          <p className="admin-stat-label">Total Users</p>
        </div>
        <div className="admin-stat-card highlight">
          <h3 className="admin-stat-value warning">{stats.pendingUsers}</h3>
          <p className="admin-stat-label">Pending Approval</p>
        </div>
        <div className="admin-stat-card">
          <h3 className="admin-stat-value">{stats.totalComponents}</h3>
          <p className="admin-stat-label">Total Components</p>
        </div>
        <div className="admin-stat-card">
          <h3 className="admin-stat-value">{stats.totalBuilds}</h3>
          <p className="admin-stat-label">Total Builds</p>
        </div>
        <div className="admin-stat-card">
          <h3 className="admin-stat-value">{stats.pendingBuilds}</h3>
          <p className="admin-stat-label">Pending Builds</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Components Tab
   ============================================================ */
function ComponentsTab() {
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    specifications: '',
    compatibility: '',
    socket: '',
    chipset: '',
    formFactor: '',
    ramType: '',
    storageInterface: '',
    powerRequirement: 0,
    wattage: 0,
    priority: 1,
    stockStatus: true,
  });
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedComponentIds, setSelectedComponentIds] = useState([]);

  useEffect(() => {
    fetchComponents();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const activeCategories = res.data.data.filter(cat => cat.isActive);
      setCategories(activeCategories);
      if (activeCategories.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: activeCategories[0].name }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchComponents = async () => {
    try {
      const res = await api.get('/components');
      setComponents(res.data.data);
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/components', formData);
      setComponents([res.data.data, ...components]);
      setShowAddForm(false);
      setFormData({
        name: '',
        category: categories.length > 0 ? categories[0].name : '',
        price: '',
        specifications: '',
        compatibility: '',
        socket: '',
        chipset: '',
        formFactor: '',
        ramType: '',
        storageInterface: '',
        powerRequirement: 0,
        wattage: 0,
        priority: 1,
        stockStatus: true,
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding component');
    }
  };

  const handleEdit = (component) => {
    setEditing(component._id);
    setFormData({
      name: component.name,
      category: component.category,
      price: component.price,
      specifications: component.specifications,
      compatibility: component.compatibility || '',
      socket: component.socket || '',
      chipset: component.chipset || '',
      formFactor: component.formFactor || '',
      ramType: component.ramType || '',
      storageInterface: component.storageInterface || '',
      powerRequirement: component.powerRequirement || 0,
      wattage: component.wattage || 0,
      priority: component.priority ?? 1,
      stockStatus: component.stockStatus,
      url: component.url || '',
    });
  };

  const handleUpdate = async (id) => {
    try {
      const res = await api.put(`/components/${id}`, formData);
      setComponents(components.map((c) => (c._id === id ? res.data.data : c)));
      setEditing(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating component');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this component?')) return;
    try {
      await api.delete(`/components/${id}`);
      setComponents(components.filter((c) => c._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting component');
    }
  };

  const handleQuickUpdate = async (id, field, value) => {
    try {
      const res = await api.put(`/components/${id}`, { [field]: value });
      setComponents(components.map((c) => (c._id === id ? res.data.data : c)));
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating component');
    }
  };

  const toggleSelectComponent = (id) => {
    setSelectedComponentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllComponents = (checked) => {
    setSelectedComponentIds(checked ? components.map((c) => c._id) : []);
  };

  const handleDeleteSelected = async () => {
    if (selectedComponentIds.length === 0) { alert('No components selected to delete.'); return; }
    if (!window.confirm(`Delete ${selectedComponentIds.length} selected component(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedComponentIds.map((id) => api.delete(`/components/${id}`)));
      setComponents((prev) => prev.filter((c) => !selectedComponentIds.includes(c._id)));
      setSelectedComponentIds([]);
      setDeleteMode(false);
      alert('Selected components deleted.');
    } catch (error) {
      console.error('Error deleting selected components:', error);
      alert(error.response?.data?.message || 'Error deleting selected components');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading components...</div>;
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Component Management</h2>
        <div className="admin-toolbar">
          {!deleteMode ? (
            <button onClick={() => setDeleteMode(true)} className="admin-btn admin-btn-danger">Delete</button>
          ) : (
            <>
              <button onClick={handleDeleteSelected} className="admin-btn admin-btn-danger" disabled={selectedComponentIds.length === 0}>Confirm Delete</button>
              <button onClick={() => { setDeleteMode(false); setSelectedComponentIds([]); }} className="admin-btn admin-btn-secondary">Cancel</button>
              <span className="admin-toolbar-count">{selectedComponentIds.length} selected</span>
            </>
          )}
          <button onClick={() => setShowAddForm(!showAddForm)} className="admin-btn admin-btn-primary">
            {showAddForm ? 'Cancel' : 'Add Component'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="admin-form">
          <h3>Add New Component</h3>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required className="admin-select">
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                  ))
                )}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Price</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label>Priority</label>
              <input type="number" name="priority" value={formData.priority} onChange={handleInputChange} min="1" step="1" className="admin-input" placeholder="1" />
            </div>
            <div className="admin-form-group">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="stockStatus" checked={formData.stockStatus} onChange={handleInputChange} />
                Stock Status
              </label>
            </div>
          </div>
          <div className="admin-form-group">
            <label>Specifications</label>
            <textarea name="specifications" value={formData.specifications} onChange={handleInputChange} required rows="3" className="admin-textarea" />
          </div>
          <div className="admin-form-group">
            <label>Compatibility (Legacy)</label>
            <input type="text" name="compatibility" value={formData.compatibility} onChange={handleInputChange} className="admin-input" placeholder="Legacy compatibility string" />
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Socket (CPU/Motherboard)</label>
              <input type="text" name="socket" value={formData.socket || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., LGA1700, AM4, AM5" />
            </div>
            <div className="admin-form-group">
              <label>Chipset (Motherboard)</label>
              <input type="text" name="chipset" value={formData.chipset || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., Z690, B550, X670" />
            </div>
            <div className="admin-form-group">
              <label>Form Factor (Motherboard/Case)</label>
              <input type="text" name="formFactor" value={formData.formFactor || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., ATX, mATX, ITX" />
            </div>
            <div className="admin-form-group">
              <label>RAM Type (Motherboard/RAM)</label>
              <input type="text" name="ramType" value={formData.ramType || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., DDR4, DDR5" />
            </div>
            <div className="admin-form-group">
              <label>Storage Interface (Storage)</label>
              <input type="text" name="storageInterface" value={formData.storageInterface || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., SATA, NVMe M.2" />
            </div>
            <div className="admin-form-group">
              <label>Power Requirement (W)</label>
              <input type="number" name="powerRequirement" value={formData.powerRequirement || ''} onChange={handleInputChange} min="0" className="admin-input" placeholder="e.g., 150, 200" />
            </div>
            <div className="admin-form-group">
              <label>Wattage (W) (PSU)</label>
              <input type="number" name="wattage" value={formData.wattage || ''} onChange={handleInputChange} min="0" className="admin-input" placeholder="e.g., 650, 750" />
            </div>
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">Add Component</button>
        </form>
      )}

      {editing && (
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editing); }} className="admin-form">
          <h3>Edit Component</h3>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required className="admin-select">
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                  ))
                )}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Price</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label>Priority</label>
              <input type="number" name="priority" value={formData.priority} onChange={handleInputChange} min="1" step="1" className="admin-input" placeholder="1" />
            </div>
            <div className="admin-form-group">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="stockStatus" checked={formData.stockStatus} onChange={handleInputChange} />
                Stock Status
              </label>
            </div>
          </div>
          <div className="admin-form-group">
            <label>Specifications</label>
            <textarea name="specifications" value={formData.specifications} onChange={handleInputChange} required rows="3" className="admin-textarea" />
          </div>
          <div className="admin-form-group">
            <label>Compatibility (Legacy)</label>
            <input type="text" name="compatibility" value={formData.compatibility} onChange={handleInputChange} className="admin-input" placeholder="Legacy compatibility string" />
          </div>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Socket (CPU/Motherboard)</label>
              <input type="text" name="socket" value={formData.socket || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., LGA1700, AM4, AM5" />
            </div>
            <div className="admin-form-group">
              <label>Chipset (Motherboard)</label>
              <input type="text" name="chipset" value={formData.chipset || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., Z690, B550, X670" />
            </div>
            <div className="admin-form-group">
              <label>Form Factor (Motherboard/Case)</label>
              <input type="text" name="formFactor" value={formData.formFactor || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., ATX, mATX, ITX" />
            </div>
            <div className="admin-form-group">
              <label>RAM Type (Motherboard/RAM)</label>
              <input type="text" name="ramType" value={formData.ramType || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., DDR4, DDR5" />
            </div>
            <div className="admin-form-group">
              <label>Storage Interface (Storage)</label>
              <input type="text" name="storageInterface" value={formData.storageInterface || ''} onChange={handleInputChange} className="admin-input" placeholder="e.g., SATA, NVMe M.2" />
            </div>
            <div className="admin-form-group">
              <label>Power Requirement (W)</label>
              <input type="number" name="powerRequirement" value={formData.powerRequirement || ''} onChange={handleInputChange} min="0" className="admin-input" placeholder="e.g., 150, 200" />
            </div>
            <div className="admin-form-group">
              <label>Wattage (W) (PSU)</label>
              <input type="number" name="wattage" value={formData.wattage || ''} onChange={handleInputChange} min="0" className="admin-input" placeholder="e.g., 650, 750" />
            </div>
            <div className="admin-form-group">
              <label>Image URL</label>
              <input type="text" name="url" value={formData.url || ''} onChange={handleInputChange} className="admin-input" placeholder="Image URL" />
            </div>
          </div>
          <div className="admin-toolbar" style={{ marginTop: '0.75rem' }}>
            <button type="submit" className="admin-btn admin-btn-primary">Save Changes</button>
            <button type="button" onClick={() => setEditing(null)} className="admin-btn admin-btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              {deleteMode && (
                <th style={{ width: '40px' }}>
                  <input type="checkbox" checked={selectedComponentIds.length === components.length && components.length > 0} onChange={(e) => selectAllComponents(e.target.checked)} />
                </th>
              )}
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Priority</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.map((component) => (
              <tr key={component._id}>
                {deleteMode && (
                  <td>
                    <input type="checkbox" checked={selectedComponentIds.includes(component._id)} onChange={() => toggleSelectComponent(component._id)} />
                  </td>
                )}
                <td>
                  {component.url ? (
                    <img src={component.url} alt={component.name} className="admin-component-image" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="admin-no-image">No Image</div>
                  )}
                </td>
                <td>{component.name}</td>
                <td>{component.category}</td>
                <td>
                  <input
                    type="number"
                    value={component.price}
                    onChange={(e) => handleQuickUpdate(component._id, 'price', parseFloat(e.target.value))}
                    onBlur={(e) => handleQuickUpdate(component._id, 'price', parseFloat(e.target.value))}
                    className="admin-price-input"
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={component.priority ?? 1}
                    onChange={(e) => handleQuickUpdate(component._id, 'priority', parseInt(e.target.value || '1', 10))}
                    onBlur={(e) => handleQuickUpdate(component._id, 'priority', parseInt(e.target.value || '1', 10))}
                    className="admin-price-input"
                    style={{ width: '80px' }}
                    step="1"
                    min="1"
                  />
                </td>
                <td>
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={component.stockStatus} onChange={(e) => handleQuickUpdate(component._id, 'stockStatus', e.target.checked)} />
                    {component.stockStatus ? (
                      <span className="admin-in-stock">In Stock</span>
                    ) : (
                      <span className="admin-out-of-stock">Out of Stock</span>
                    )}
                  </label>
                </td>
                <td>
                  <div className="admin-action-stack">
                    <button onClick={() => handleEdit(component)} className="admin-btn admin-btn-warning admin-btn-sm">Edit</button>
                    <button onClick={() => handleDelete(component._id)} className="admin-btn admin-btn-danger admin-btn-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   Users Tab
   ============================================================ */
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [formError, setFormError] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await api.post('/users', formData);
      setUsers([res.data.data, ...users]);
      setShowAddForm(false);
      setFormData({ name: '', email: '', password: '', role: 'user' });
      setFormError('');
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error creating user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === userId ? res.data.data : u)));
      setEditingRole(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating role');
    }
  };

  const handleApprove = async (userId) => {
    try {
      const res = await api.put(`/users/${userId}/approve`);
      setUsers(users.map((u) => (u._id === userId ? res.data.data : u)));
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving user');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject and delete this user account? This action cannot be undone.')) return;
    try {
      await api.put(`/users/${userId}/reject`);
      setUsers(users.filter((u) => u._id !== userId));
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  const pendingUsers = users.filter((u) => u.approved === false);
  const roles = ['user', 'admin', 'assembler', 'supplier'];

  if (loading) {
    return <div className="admin-loading">Loading users...</div>;
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">User Management ({users.length})</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="admin-btn admin-btn-primary">
          {showAddForm ? 'Cancel' : 'Register New User'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddUser} className="admin-form">
          <h3>Register New User</h3>
          {formError && <div className="admin-alert-error">{formError}</div>}
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="admin-input" placeholder="User's full name" />
            </div>
            <div className="admin-form-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="admin-input" placeholder="user@example.com" />
            </div>
            <div className="admin-form-group">
              <label>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} required minLength="6" className="admin-input" placeholder="Minimum 6 characters" />
            </div>
            <div className="admin-form-group">
              <label>Role *</label>
              <select name="role" value={formData.role} onChange={handleInputChange} required className="admin-select">
                {roles.map((role) => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">Create User</button>
        </form>
      )}

      {pendingUsers.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="admin-section-title">Pending Approval ({pendingUsers.length})</h3>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td><span className="admin-badge admin-badge-role">{user.role}</span></td>
                    <td><span className="admin-badge admin-badge-pending">Pending</span></td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-action-stack">
                        <button onClick={() => handleApprove(user._id)} className="admin-btn admin-btn-success admin-btn-sm">Approve</button>
                        <button onClick={() => handleReject(user._id)} className="admin-btn admin-btn-warning admin-btn-sm">Reject</button>
                        <button onClick={() => handleDelete(user._id)} className="admin-btn admin-btn-danger admin-btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="admin-section-title">All Users ({users.length})</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {editingRole === user._id ? (
                      <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)} className="admin-inline-input">
                        {roles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="admin-badge admin-badge-role">{user.role}</span>
                    )}
                  </td>
                  <td>
                    {user.approved === false ? (
                      <span className="admin-badge admin-badge-pending">Pending</span>
                    ) : (
                      <span className="admin-badge admin-badge-approved">Approved</span>
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-action-stack">
                      {user.approved === false && (
                        <button onClick={() => handleApprove(user._id)} className="admin-btn admin-btn-success admin-btn-sm">Approve</button>
                      )}
                      {(user.approved === true || user.approved === undefined) && user._id !== currentUser._id && (
                        <button onClick={() => handleReject(user._id)} className="admin-btn admin-btn-warning admin-btn-sm">Reject</button>
                      )}
                      {user._id !== currentUser._id && (
                        <>
                          <button onClick={() => setEditingRole(editingRole === user._id ? null : user._id)} className="admin-btn admin-btn-secondary admin-btn-sm">
                            {editingRole === user._id ? 'Cancel' : 'Change Role'}
                          </button>
                          <button onClick={() => handleDelete(user._id)} className="admin-btn admin-btn-danger admin-btn-sm">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Categories Tab
   ============================================================ */
function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 1,
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?includeInactive=true');
      setCategories(res.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/categories', formData);
      setCategories([res.data.data, ...categories]);
      setShowAddForm(false);
      setFormData({ name: '', description: '', priority: 1, isActive: true });
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding category');
    }
  };

  const handleEdit = (category) => {
    setEditing(category._id);
    setFormData({
      name: category.name,
      description: category.description || '',
      priority: category.priority ?? 1,
      isActive: category.isActive,
    });
  };

  const handleUpdate = async (id) => {
    try {
      const res = await api.put(`/categories/${id}`, formData);
      setCategories(categories.map((c) => (c._id === id ? res.data.data : c)));
      setEditing(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This will fail if any components are using it.')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter((c) => c._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting category');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const res = await api.put(`/categories/${id}`, { isActive: !currentStatus });
      setCategories(categories.map((c) => (c._id === id ? res.data.data : c)));
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating category status');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading categories...</div>;
  }

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Category Management</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="admin-btn admin-btn-primary">
          {showAddForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="admin-form">
          <h3>Add New Category</h3>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label>Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="admin-input" placeholder="e.g., CPU, GPU, RAM" />
            </div>
            <div className="admin-form-group">
              <label>Description</label>
              <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="admin-input" placeholder="Optional description" />
            </div>
            <div className="admin-form-group">
              <label>Priority (for budget allocation) *</label>
              <input type="number" name="priority" value={formData.priority} onChange={handleInputChange} required min="1" className="admin-input" placeholder="1" />
              <small className="admin-help-text">Higher priority = larger budget share</small>
            </div>
            <div className="admin-form-group">
              <label className="admin-checkbox-label">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                Active
              </label>
            </div>
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">Add Category</button>
        </form>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                {editing === category._id ? (
                  <>
                    <td><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="admin-inline-input" required /></td>
                    <td><input type="text" name="description" value={formData.description} onChange={handleInputChange} className="admin-inline-input" /></td>
                    <td><input type="number" name="priority" value={formData.priority} onChange={handleInputChange} min="1" className="admin-inline-input" required /></td>
                    <td>
                      <label className="admin-checkbox-label">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </label>
                    </td>
                    <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-action-stack">
                        <button onClick={() => handleUpdate(category._id)} className="admin-btn admin-btn-primary admin-btn-sm">Save</button>
                        <button onClick={() => setEditing(null)} className="admin-btn admin-btn-secondary admin-btn-sm">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>{category.priority ?? 1}</td>
                    <td>
                      <button onClick={() => handleToggleActive(category._id, category.isActive)} className={`admin-toggle-active ${category.isActive ? 'on' : 'off'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-action-stack">
                        <button onClick={() => handleEdit(category)} className="admin-btn admin-btn-warning admin-btn-sm">Edit</button>
                        <button onClick={() => handleDelete(category._id)} className="admin-btn admin-btn-danger admin-btn-sm">Delete</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p className="admin-empty-message">No categories found. Add your first category!</p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Builds Tab
   ============================================================ */
function BuildsTab() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [assemblers, setAssemblers] = useState([]);
  const [assignMap, setAssignMap] = useState({});
  const [selectedBuildIds, setSelectedBuildIds] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);

  useEffect(() => {
    fetchBuilds();
  }, []);

  useEffect(() => {
    fetchAssemblers();
  }, []);

  const fetchAssemblers = async () => {
    try {
      const res = await api.get('/users');
      const users = res.data.data || [];
      setAssemblers(users.filter(u => u.role === 'assembler' && (u.approved === undefined || u.approved === true)));
    } catch (error) {
      console.error('Error fetching assemblers:', error);
    }
  };

  const fetchBuilds = async () => {
    try {
      const res = await api.get('/builds');
      setBuilds(res.data.data);
    } catch (error) {
      console.error('Error fetching builds:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectBuild = (buildId) => {
    setSelectedBuildIds((prev) =>
      prev.includes(buildId) ? prev.filter((id) => id !== buildId) : [...prev, buildId]
    );
  };

  const selectAllBuilds = (checked) => {
    setSelectedBuildIds(checked ? builds.map((b) => b._id) : []);
  };

  const handleDeleteSelected = async () => {
    if (selectedBuildIds.length === 0) { alert('No builds selected to delete.'); return; }
    if (!window.confirm(`Delete ${selectedBuildIds.length} selected build(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedBuildIds.map((id) => api.delete(`/builds/${id}`)));
      setBuilds((prev) => prev.filter((b) => !selectedBuildIds.includes(b._id)));
      if (selectedBuild && selectedBuildIds.includes(selectedBuild._id)) setSelectedBuild(null);
      setSelectedBuildIds([]);
      alert('Selected builds deleted.');
    } catch (error) {
      console.error('Error deleting selected builds:', error);
      alert(error.response?.data?.message || 'Error deleting selected builds');
    }
  };

  const handleAssignChange = (buildId, assemblerId) => {
    setAssignMap(prev => ({ ...prev, [buildId]: assemblerId }));
  };

  const handleAssign = async (buildId) => {
    try {
      const assemblerID = assignMap[buildId];
      if (!assemblerID) { alert('Please select an assembler to assign.'); return; }
      const res = await api.put(`/builds/${buildId}/assign`, { assemblerID });
      const updated = res.data.data;
      setBuilds(prev => prev.map(b => (b._id === buildId ? updated : b)));
      if (selectedBuild && selectedBuild._id === buildId) setSelectedBuild(updated);
      alert('Assembler assigned successfully.');
    } catch (error) {
      console.error('Error assigning assembler:', error);
      alert(error.response?.data?.message || 'Error assigning assembler');
    }
  };

  const handleRefund = async (buildId) => {
    try {
      const build = builds.find(b => b._id === buildId) || selectedBuild;
      if (!build) return;
      if (build.assemblyStatus === 'Completed') {
        alert('Refunds are not allowed for completed builds.');
        return;
      }
      const pendingRequest = (build.refundRequests || []).find(
        (req) => req.status === 'requested' || req.status === 'approved'
      );
      const refundAmount = build.payment?.escrowAmount || 0;
      const requestReason = pendingRequest?.reason || '';
      const confirmed = window.confirm(
        pendingRequest
          ? `Process refund request for this build?\n\nUser requested refund: ${requestReason}\nThis will refund 90% of the payment ($${refundAmount.toFixed(2)}) to the user.\n3% admin commission and 7% assembler commission are non-refundable.`
          : `Issue refund for this build?\n\nThis will refund 90% of the payment ($${refundAmount.toFixed(2)}) to the user.\n3% admin commission and 7% assembler commission are non-refundable.`
      );
      if (!confirmed) return;
      const reason = window.prompt('Admin note (optional):', '') || '';
      const res = await api.post(`/builds/${buildId}/refund`, { reason });
      const updated = res.data.data;
      setBuilds(prev => prev.map(b => (b._id === buildId ? updated : b)));
      if (selectedBuild && selectedBuild._id === buildId) setSelectedBuild(updated);
      alert(res.data.message || 'Refund processed');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert(error.response?.data?.message || 'Error processing refund');
    }
  };

  const handleDistributeSuppliers = async (buildId) => {
    try {
      const confirmed = window.confirm(
        'Distribute escrow to suppliers?\n\nThis will calculate and pay suppliers proportionally based on component prices.\nThis usually happens automatically when build status changes to Completed.'
      );
      if (!confirmed) return;
      const res = await api.post(`/builds/${buildId}/distribute-suppliers`);
      const updated = res.data.data;
      setBuilds(prev => prev.map(b => (b._id === buildId ? updated : b)));
      if (selectedBuild && selectedBuild._id === buildId) setSelectedBuild(updated);
      alert(res.data.message || 'Supplier payouts distributed');
    } catch (error) {
      console.error('Error distributing to suppliers:', error);
      alert(error.response?.data?.message || 'Error distributing to suppliers');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading builds...</div>;
  }

  const statusBadgeClass = (status) => {
    if (status === 'Completed') return 'admin-badge admin-badge-completed';
    if (status === 'Assembling') return 'admin-badge admin-badge-assembling';
    return 'admin-badge admin-badge-pending';
  };

  return (
    <div>
      <h2 className="admin-section-title">All Builds ({builds.length})</h2>

      {selectedBuild && (
        <div className="admin-build-details">
          <button onClick={() => setSelectedBuild(null)} className="admin-close-btn">Close</button>
          <h3>Build Details</h3>
          <p><strong>User:</strong> {selectedBuild.userID?.name || 'N/A'}</p>
          <p><strong>Status:</strong> {selectedBuild.assemblyStatus}</p>
          <p><strong>Assembler:</strong> {selectedBuild.assemblerID?.name || 'Not assigned'}</p>
          <p><strong>Total Price:</strong> ${selectedBuild.totalPrice.toFixed(2)}</p>
          <h4>Components:</h4>
          <ul>
            {selectedBuild.components.map((comp, i) => (
              <li key={i}>{comp.componentName} ({comp.category}) - ${comp.price.toFixed(2)}</li>
            ))}
          </ul>

          <div style={{ marginTop: '0.75rem' }}>
            <strong>Payment Distribution:</strong>
            <div className="admin-payment-info">
              <div><strong>Total Paid:</strong> ${selectedBuild.payment?.totalAmount?.toFixed(2) || 0}</div>
              <div><strong>Status:</strong> {selectedBuild.payment?.status || 'pending'}</div>
              {selectedBuild.payment?.status === 'paid' && (
                <>
                  <div className="admin-payment-info" style={{ marginTop: '0.5rem' }}>
                    <div><strong>Admin Commission (3%):</strong> ${selectedBuild.payment?.adminCommission?.toFixed(2) || 0}</div>
                    <div>
                      <strong>Assembler Commission (7%):</strong> ${selectedBuild.payment?.assemblerCommission?.toFixed(2) || 0}
                      {selectedBuild.payment?.assemblerCommissionPaid && (
                        <span style={{ color: '#16a34a', marginLeft: '0.5rem' }}>✓ Paid</span>
                      )}
                    </div>
                    <div>
                      <strong>Escrow (90%):</strong> ${selectedBuild.payment?.escrowAmount?.toFixed(2) || 0}
                      {selectedBuild.payment?.escrowDistributed ? (
                        <span style={{ color: '#16a34a', marginLeft: '0.5rem' }}>✓ Distributed to Suppliers</span>
                      ) : (
                        <span style={{ color: '#888', marginLeft: '0.5rem' }}>Held until completion</span>
                      )}
                    </div>
                  </div>
                  {selectedBuild.supplierPayouts && selectedBuild.supplierPayouts.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Supplier Payouts:</strong>
                      <ul style={{ marginTop: '0.25rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                        {selectedBuild.supplierPayouts.map((payout, idx) => (
                          <li key={idx} style={{ fontSize: '0.85rem' }}>
                            ${payout.amount.toFixed(2)} - {payout.componentName}
                            {payout.paid && <span style={{ color: '#16a34a', marginLeft: '0.5rem' }}>✓</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              {selectedBuild.refundRequests && selectedBuild.refundRequests.length > 0 && (
                <div className="admin-refund-banner">
                  <strong>Refund Requests:</strong>
                  {selectedBuild.refundRequests.map((req, idx) => (
                    <div key={idx} className="admin-refund-item">
                      <div><strong>Status:</strong>{' '}
                        <span style={{
                          color: req.status === 'processed' ? '#16a34a' : req.status === 'rejected' ? '#dc2626' : '#e96511',
                          fontWeight: 'bold'
                        }}>{req.status.toUpperCase()}</span>
                      </div>
                      <div><strong>Amount:</strong> ${req.amount?.toFixed(2) || '0.00'}</div>
                      {req.reason && <div><strong>Reason:</strong> {req.reason}</div>}
                      {req.createdAt && <div><strong>Requested:</strong> {new Date(req.createdAt).toLocaleString()}</div>}
                      {req.processedBy && <div><strong>Processed By:</strong> Admin</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-toolbar" style={{ marginTop: '1rem' }}>
            {selectedBuild.payment?.status === 'paid' && (
              <>
                {selectedBuild.assemblyStatus !== 'Completed' && (() => {
                  const pendingRequest = (selectedBuild.refundRequests || []).find(
                    (req) => req.status === 'requested' || req.status === 'approved'
                  );
                  return (
                    <button
                      className="admin-btn admin-btn-warning"
                      onClick={() => handleRefund(selectedBuild._id)}
                      title={pendingRequest ? `Pending refund request: ${pendingRequest.reason}` : 'Issue refund'}
                    >
                      {pendingRequest ? 'Process Refund Request (90% Escrow)' : 'Issue Refund (90% Escrow)'}
                    </button>
                  );
                })()}
                {selectedBuild.assemblyStatus === 'Completed' && (
                  <button className="admin-btn admin-btn-secondary" disabled title="Refunds not allowed for completed builds">
                    Refund Not Available (Build Completed)
                  </button>
                )}
                {selectedBuild.assemblyStatus === 'Completed' && !selectedBuild.payment?.escrowDistributed && (
                  <button className="admin-btn admin-btn-success" onClick={() => handleDistributeSuppliers(selectedBuild._id)}>
                    Distribute to Suppliers
                  </button>
                )}
                {selectedBuild.assemblyStatus === 'Completed' && selectedBuild.payment?.escrowDistributed && (
                  <button className="admin-btn admin-btn-secondary" disabled>Suppliers Paid</button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="admin-toolbar">
        {!deleteMode ? (
          <button onClick={() => setDeleteMode(true)} className="admin-btn admin-btn-danger">Delete</button>
        ) : (
          <>
            <button onClick={handleDeleteSelected} className="admin-btn admin-btn-danger" disabled={selectedBuildIds.length === 0}>Confirm Delete</button>
            <button onClick={() => { setDeleteMode(false); setSelectedBuildIds([]); }} className="admin-btn admin-btn-secondary">Cancel</button>
            <span className="admin-toolbar-count">{selectedBuildIds.length} selected</span>
          </>
        )}
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              {deleteMode && (
                <th style={{ width: '40px' }}>
                  <input type="checkbox" checked={selectedBuildIds.length === builds.length && builds.length > 0} onChange={(e) => selectAllBuilds(e.target.checked)} />
                </th>
              )}
              <th>User</th>
              <th>Components</th>
              <th>Price</th>
              <th>Status</th>
              <th>Assembler</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((build) => (
              <tr key={build._id}>
                {deleteMode && (
                  <td>
                    <input type="checkbox" checked={selectedBuildIds.includes(build._id)} onChange={() => toggleSelectBuild(build._id)} />
                  </td>
                )}
                <td>{build.userID?.name || 'N/A'}</td>
                <td>{build.components.length}</td>
                <td>${build.totalPrice.toFixed(2)}</td>
                <td><span className={statusBadgeClass(build.assemblyStatus)}>{build.assemblyStatus}</span></td>
                <td>
                  <div className="admin-assign-row">
                    <select
                      value={assignMap[build._id] ?? (build.assemblerID?._id ?? '')}
                      onChange={(e) => handleAssignChange(build._id, e.target.value)}
                      className="admin-select"
                    >
                      <option value="">Not assigned</option>
                      {assemblers.map(a => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                      ))}
                    </select>
                    <button onClick={() => handleAssign(build._id)} className="admin-btn admin-btn-primary admin-btn-sm">Assign</button>
                  </div>
                </td>
                <td>{new Date(build.createdAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => setSelectedBuild(build)} className="admin-btn admin-btn-primary admin-btn-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
