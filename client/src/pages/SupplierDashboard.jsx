import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/supplier-dashboard.css';

/* ===== SVG Nav Icons (Feather-style stroke icons) ===== */
const IconInventory = () => (
  <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>
);
const IconAdd = () => (
  <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
  { key: 'inventory', label: 'Inventory', icon: IconInventory },
  { key: 'add',       label: 'Add Component', icon: IconAdd },
];

const LINK_ITEMS = [
  { to: '/payments', label: 'Payments', icon: IconPayments },
  { to: '/profile',  label: 'Settings', icon: IconSettings },
];

function SupplierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'mine', or category
  const [selectedCategory, setSelectedCategory] = useState(null); // For sidebar filter
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    priority: 1,
    specifications: '',
    compatibility: '',
    socket: '',
    chipset: '',
    formFactor: '',
    ramType: '',
    storageInterface: '',
    powerRequirement: 0,
    wattage: 0,
    url: '',
    stockStatus: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Update filter when selectedCategory changes
    if (selectedCategory === 'all') {
      setFilter('all');
    } else if (selectedCategory === 'mine') {
      setFilter('mine');
    } else if (selectedCategory) {
      setFilter(selectedCategory);
    } else {
      setFilter('all');
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchComponents();
  }, [filter]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const activeCategories = res.data.data.filter(cat => cat.isActive);
      setCategories(activeCategories);
      // Set default category if available and not already set
      if (activeCategories.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: activeCategories[0].name }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchComponents = async () => {
    try {
      setLoading(true);
      let url = '/components';
      if (filter === 'mine' && user?.id) {
        url = `/components?supplierID=${user.id}`;
      } else if (filter !== 'all') {
        url = `/components?category=${filter}`;
      }
      const res = await api.get(url);
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
        priority: 1,
        specifications: '',
        compatibility: '',
        socket: '',
        chipset: '',
        formFactor: '',
        ramType: '',
        storageInterface: '',
        powerRequirement: 0,
        wattage: 0,
        url: '',
        stockStatus: true,
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding component');
    }
  };

  const handleEdit = (component) => {
    // Suppliers can edit any component in inventory
    setEditing(component._id);
    setFormData({
      name: component.name,
      category: component.category,
      price: component.price,
      priority: component.priority ?? 1,
      specifications: component.specifications,
      compatibility: component.compatibility || '',
      socket: component.socket || '',
      chipset: component.chipset || '',
      formFactor: component.formFactor || '',
      ramType: component.ramType || '',
      storageInterface: component.storageInterface || '',
      powerRequirement: component.powerRequirement || 0,
      wattage: component.wattage || 0,
      url: component.url || '',
      stockStatus: component.stockStatus,
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

  const handleQuickUpdate = async (id, field, value) => {
    try {
      const res = await api.put(`/components/${id}`, { [field]: value });
      setComponents(components.map((c) => (c._id === id ? res.data.data : c)));
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating component');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this component? This action cannot be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not logged in. Please login again.');
        logout();
        navigate('/login');
        return;
      }
      await api.delete(`/components/${id}`);
      setComponents(components.filter((c) => c._id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      if (error.response?.status === 401) {
        alert('Your session has expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        alert(error.response?.data?.message || 'Error deleting component');
      }
    }
  };

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
    inventory: 'Component Inventory',
    add: 'Add Component',
  };

  const myComponents = components.filter(
    (c) => c.supplierID && (c.supplierID._id === user?.id || c.supplierID._id?.toString() === user?.id)
  );
  const inStockCount = myComponents.filter((c) => c.stockStatus).length;
  const outOfStockCount = myComponents.filter((c) => !c.stockStatus).length;

  // Filter components by search term
  const filteredComponents = components.filter((component) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      component.name.toLowerCase().includes(search) ||
      component.category.toLowerCase().includes(search) ||
      (component.specifications && component.specifications.toLowerCase().includes(search))
    );
  });



  if (loading && components.length === 0) {
    return (
      <div className="supplier-page">
        <div className="supplier-loading">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="supplier-page">
      {/* Mobile hamburger */}
      <button className="supplier-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <IconMenu />
      </button>

      {/* Overlay (mobile) */}
      <div
        className={`supplier-sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`supplier-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="supplier-sidebar-header">
          <div className="supplier-sidebar-logo">PC Build</div>
          <div className="supplier-sidebar-subtitle">Supplier Panel</div>
        </div>

        <nav className="supplier-sidebar-nav">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`supplier-nav-item${activeTab === key ? ' active' : ''}`}
              onClick={() => handleNavClick(key)}
            >
              <span className="supplier-nav-icon"><Icon /></span>
              <span className="supplier-nav-label">{label}</span>
            </button>
          ))}

          {LINK_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="supplier-nav-item" style={{ textDecoration: 'none' }}>
              <span className="supplier-nav-icon"><Icon /></span>
              <span className="supplier-nav-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="supplier-sidebar-footer">
          <button className="supplier-nav-item" onClick={handleLogout}>
            <span className="supplier-nav-icon"><IconLogout /></span>
            <span className="supplier-nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="supplier-main">
        <header className="supplier-page-header">
          <div>
            <h1 className="supplier-page-title">{pageTitleMap[activeTab] || 'Dashboard'}</h1>
            <p className="supplier-page-subtitle">Supplier &rsaquo; {pageTitleMap[activeTab]}</p>
          </div>
          <div className="supplier-profile-section">
            <div className="supplier-profile-info">
              <span className="supplier-profile-name">{user?.name || user?.email}</span>
              <span className="supplier-profile-role">{user?.role}</span>
            </div>
            <div className="supplier-profile-avatar">{userInitials}</div>
          </div>
        </header>

        <div className="supplier-content">

          {/* Statistics */}
          <div className="supplier-stats-grid">
            <div className="supplier-stat-card">
              <h3 className="supplier-stat-value">{myComponents.length}</h3>
              <p className="supplier-stat-label">My Components</p>
            </div>
            <div className="supplier-stat-card">
              <h3 className="supplier-stat-value">{inStockCount}</h3>
              <p className="supplier-stat-label">In Stock</p>
            </div>
            <div className="supplier-stat-card">
              <h3 className="supplier-stat-value">{outOfStockCount}</h3>
              <p className="supplier-stat-label">Out of Stock</p>
            </div>
            <div className="supplier-stat-card">
              <h3 className="supplier-stat-value">${myComponents.reduce((sum, c) => sum + c.price, 0).toFixed(2)}</h3>
              <p className="supplier-stat-label">Total Inventory Value</p>
            </div>
          </div>
          {activeTab === 'inventory' && (
            <>
            {editing && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(editing);
                }}
                className="supplier-form"
              >
                <h3>Edit Component</h3>
                <div className="supplier-form-grid">
                  <div className="supplier-form-group">
                    <label>Component Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="supplier-input"
                      placeholder="e.g., Intel i7-13700K"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="supplier-select"
                    >
                      {categories.length === 0 ? (
                        <option value="">No categories available</option>
                      ) : (
                        categories.map((cat) => (
                          <option key={cat._id || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="supplier-form-group">
                    <label>Price ($) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="supplier-input"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Priority</label>
                    <input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      className="supplier-input"
                      placeholder="1"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Stock Status</label>
                    <label className="supplier-checkbox-label">
                      <input
                        type="checkbox"
                        name="stockStatus"
                        checked={formData.stockStatus}
                        onChange={handleInputChange}
                      />
                      In Stock
                    </label>
                  </div>
                </div>
                <div className="supplier-form-group">
                  <label>Specifications *</label>
                    <textarea
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="supplier-textarea"
                    placeholder="e.g., 13th Gen, 16 cores, 3.4GHz base clock"
                  />
                </div>
                <div className="supplier-form-group">
                  <label>Compatibility (Legacy - optional)</label>
                  <input
                    type="text"
                    name="compatibility"
                    value={formData.compatibility}
                    onChange={handleInputChange}
                    className="supplier-input"
                    placeholder="Legacy compatibility string"
                  />
                </div>
                <div className="supplier-form-grid">
                  <div className="supplier-form-group">
                    <label>Socket (CPU/Motherboard)</label>
                    <input
                      type="text"
                      name="socket"
                      value={formData.socket}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., LGA1700, AM4"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Chipset (Motherboard)</label>
                    <input
                      type="text"
                      name="chipset"
                      value={formData.chipset}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., Z690, B550"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Form Factor (Motherboard/Case)</label>
                    <input
                      type="text"
                      name="formFactor"
                      value={formData.formFactor}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., ATX, mATX"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>RAM Type (Motherboard/RAM)</label>
                    <input
                      type="text"
                      name="ramType"
                      value={formData.ramType}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., DDR4, DDR5"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Storage Interface (Storage)</label>
                    <input
                      type="text"
                      name="storageInterface"
                      value={formData.storageInterface}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., SATA, NVMe M.2"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Power Requirement (W) (CPU/GPU)</label>
                    <input
                      type="number"
                      name="powerRequirement"
                      value={formData.powerRequirement}
                      onChange={handleInputChange}
                      min="0"
                      className="supplier-input"
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Wattage (W) (PSU)</label>
                    <input
                      type="number"
                      name="wattage"
                      value={formData.wattage}
                      onChange={handleInputChange}
                      min="0"
                      className="supplier-input"
                      placeholder="e.g., 650"
                    />
                  </div>
                </div>
                <div className="supplier-form-group">
                  <label>Product's Image URL (optional)</label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="supplier-input"
                    placeholder="https://example.com/product"
                  />
                </div>
                <div className="supplier-toolbar">
                  <button type="submit" className="supplier-btn supplier-btn-primary">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="supplier-btn supplier-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <div className="supplier-inventory-layout">
              {/* Left Sidebar - Category Filter List */}
              <div className="supplier-filter-sidebar">
                <h3 className="supplier-filter-sidebar-title">Filters</h3>
                
                {/* Search Box */}
                <div className="supplier-search-box">
                  <input
                    type="text"
                    placeholder="Search components..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="supplier-search-input"
                  />
                </div>

                <ul className="supplier-category-list">
                  <li
                    className={`supplier-category-item${selectedCategory === 'all' || selectedCategory === null ? ' active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    <div className="supplier-category-item-content">
                      <span className="supplier-category-name">All Components</span>
                      <span className="supplier-count-badge">
                        {components.length}
                      </span>
                    </div>
                  </li>
                  <li
                    className={`supplier-category-item${selectedCategory === 'mine' ? ' active' : ''}`}
                    onClick={() => setSelectedCategory('mine')}
                  >
                    <div className="supplier-category-item-content">
                      <span className="supplier-category-name">My Components</span>
                      <span className="supplier-count-badge">
                        {components.filter((c) => c.supplierID && (c.supplierID._id === user?.id || c.supplierID._id?.toString() === user?.id)).length}
                      </span>
                    </div>
                  </li>
                  <li style={{ padding: '0.5rem 1rem', marginBottom: '0.5rem', borderTop: '1px solid #f0f0f5', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categories</span>
                  </li>
                  {categories.map((category) => {
                    const count = components.filter((c) => (c.category || '').toUpperCase() === (category.name || '').toUpperCase()).length;
                    return (
                      <li
                        key={category._id}
                        className={`supplier-category-item${selectedCategory === category.name ? ' active' : ''}`}
                        onClick={() => setSelectedCategory(category.name)}
                      >
                        <div className="supplier-category-item-content">
                          <span className="supplier-category-name">{category.name}</span>
                          <span className="supplier-count-badge">
                            {count}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Filter Info */}
                <div className="supplier-filter-info">
                  <p className="supplier-filter-info-text">
                    Showing {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => fetchComponents()}
                    className="supplier-btn supplier-btn-secondary supplier-btn-sm"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>

              {/* Right Side - Components Table */}
              <div className="supplier-table-wrapper">
                <div className="supplier-table-container">
                  <table className="supplier-table">
                    <thead>
                      <tr>
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
                      {filteredComponents.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="supplier-empty-message">
                            {searchTerm ? 'No components match your search.' : 'No components found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredComponents.map((component) => (
                          <tr key={component._id}>
                            <td>
                              {component.url ? (
                                <img
                                  src={component.url}
                                  alt={component.name}
                                  className="supplier-component-image"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="supplier-no-image">No Image</div>
                              )}
                            </td>
                            <td>{component.name}</td>
                            <td>{component.category}</td>
                            <td>
                              <input
                                type="number"
                                value={component.price}
                                onChange={(e) =>
                                  handleQuickUpdate(component._id, 'price', parseFloat(e.target.value))
                                }
                                onBlur={(e) =>
                                  handleQuickUpdate(component._id, 'price', parseFloat(e.target.value))
                                }
                                className="supplier-price-input"
                                step="0.01"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={component.priority ?? 1}
                                onChange={(e) =>
                                  handleQuickUpdate(component._id, 'priority', parseInt(e.target.value || '1', 10))
                                }
                                onBlur={(e) =>
                                  handleQuickUpdate(component._id, 'priority', parseInt(e.target.value || '1', 10))
                                }
                                className="supplier-price-input"
                                step="1"
                                min="1"
                              />
                            </td>
                            <td>
                              <label className="supplier-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={component.stockStatus}
                                  onChange={(e) =>
                                    handleQuickUpdate(component._id, 'stockStatus', e.target.checked)
                                  }
                                />
                                {component.stockStatus ? (
                                  <span className="supplier-in-stock">In Stock</span>
                                ) : (
                                  <span className="supplier-out-of-stock">Out</span>
                                )}
                              </label>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <button
                                  onClick={() => handleEdit(component)}
                                  className="supplier-btn supplier-btn-warning supplier-btn-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(component._id)}
                                  className="supplier-btn supplier-btn-danger supplier-btn-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            </>
          )}

          {activeTab === 'add' && (
            <div>
              <h2 className="supplier-section-title">Add New Component</h2>
              <form onSubmit={handleAdd} className="supplier-form">
                <div className="supplier-form-grid">
                  <div className="supplier-form-group">
                    <label>Component Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="supplier-input"
                      placeholder="e.g., Intel i7-13700K"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="supplier-select"
                    >
                      {categories.length === 0 ? (
                        <option value="">No categories available</option>
                      ) : (
                        categories.map((cat) => (
                          <option key={cat._id || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="supplier-form-group">
                    <label>Price ($) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="supplier-input"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Priority</label>
                    <input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      className="supplier-input"
                      placeholder="1"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Stock Status</label>
                    <label className="supplier-checkbox-label">
                      <input
                        type="checkbox"
                        name="stockStatus"
                        checked={formData.stockStatus}
                        onChange={handleInputChange}
                      />
                      In Stock
                    </label>
                  </div>
                </div>
                <div className="supplier-form-group">
                  <label>Specifications *</label>
                  <textarea
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="supplier-textarea"
                    placeholder="e.g., 13th Gen, 16 cores, 3.4GHz base clock"
                  />
                </div>
                <div className="supplier-form-group">
                  <label>Compatibility (Legacy - optional)</label>
                  <input
                    type="text"
                    name="compatibility"
                    value={formData.compatibility}
                    onChange={handleInputChange}
                    className="supplier-input"
                    placeholder="Legacy compatibility string"
                  />
                </div>
                <div className="supplier-form-grid">
                  <div className="supplier-form-group">
                    <label>Socket (CPU/Motherboard)</label>
                    <input
                      type="text"
                      name="socket"
                      value={formData.socket}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., LGA1700, AM4"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Chipset (Motherboard)</label>
                    <input
                      type="text"
                      name="chipset"
                      value={formData.chipset}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., Z690, B550"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Form Factor (Motherboard/Case)</label>
                    <input
                      type="text"
                      name="formFactor"
                      value={formData.formFactor}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., ATX, mATX"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>RAM Type (Motherboard/RAM)</label>
                    <input
                      type="text"
                      name="ramType"
                      value={formData.ramType}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., DDR4, DDR5"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Storage Interface (Storage)</label>
                    <input
                      type="text"
                      name="storageInterface"
                      value={formData.storageInterface}
                      onChange={handleInputChange}
                      className="supplier-input"
                      placeholder="e.g., SATA, NVMe M.2"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Power Requirement (W) (CPU/GPU)</label>
                    <input
                      type="number"
                      name="powerRequirement"
                      value={formData.powerRequirement}
                      onChange={handleInputChange}
                      min="0"
                      className="supplier-input"
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div className="supplier-form-group">
                    <label>Wattage (W) (PSU)</label>
                    <input
                      type="number"
                      name="wattage"
                      value={formData.wattage}
                      onChange={handleInputChange}
                      min="0"
                      className="supplier-input"
                      placeholder="e.g., 650"
                    />
                  </div>
                </div>
                <div className="supplier-form-group">
                  <label>Product's Image URL (optional)</label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="supplier-input"
                    placeholder="https://example.com/product"
                  />
                </div>
                <button type="submit" className="supplier-btn supplier-btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  Add Component
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SupplierDashboard;
