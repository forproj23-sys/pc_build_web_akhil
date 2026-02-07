import { useState, useEffect } from 'react';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={styles.container} className="app-container">
      <TopNav />
      <div style={styles.content} className="app-content">
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{ ...styles.tab, ...(activeTab === 'overview' ? styles.activeTab : {}) }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('components')}
            style={{ ...styles.tab, ...(activeTab === 'components' ? styles.activeTab : {}) }}
          >
            Components
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{ ...styles.tab, ...(activeTab === 'users' ? styles.activeTab : {}) }}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            style={{ ...styles.tab, ...(activeTab === 'categories' ? styles.activeTab : {}) }}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('builds')}
            style={{ ...styles.tab, ...(activeTab === 'builds' ? styles.activeTab : {}) }}
          >
            All Builds
          </button>
        </div>

        <div style={styles.tabContent}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'components' && <ComponentsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'builds' && <BuildsTab />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
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
    return <div style={styles.loading}>Loading statistics...</div>;
  }

  return (
    <div>
      <h2>System Overview</h2>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statValue}>{stats.totalUsers}</h3>
          <p style={styles.statLabel}>Total Users</p>
        </div>
        <div style={{ ...styles.statCard, border: '2px solid #ffc107' }}>
          <h3 style={{ ...styles.statValue, color: '#ffc107' }}>{stats.pendingUsers}</h3>
          <p style={styles.statLabel}>Pending Approval</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statValue}>{stats.totalComponents}</h3>
          <p style={styles.statLabel}>Total Components</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statValue}>{stats.totalBuilds}</h3>
          <p style={styles.statLabel}>Total Builds</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statValue}>{stats.pendingBuilds}</h3>
          <p style={styles.statLabel}>Pending Builds</p>
        </div>
      </div>
    </div>
  );
}

// Components Tab Component
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

  useEffect(() => {
    fetchComponents();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const activeCategories = res.data.data.filter(cat => cat.isActive);
      setCategories(activeCategories);
      // Set default category if available
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
    if (!window.confirm('Are you sure you want to delete this component?')) {
      return;
    }
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

  if (loading) {
    return <div style={styles.loading}>Loading components...</div>;
  }

  return (
    <div>
      <div style={styles.header} className="d-flex align-items-center justify-content-between mb-3">
        <h2>Component Management</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-success" style={styles.addButton}>
          {showAddForm ? 'Cancel' : 'Add Component'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} style={styles.form}>
          <h3>Add New Component</h3>
          <div style={styles.formGrid}>
              <div style={styles.formGroup}>
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-control"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="form-select"
                style={styles.input}
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
            <div style={styles.formGroup}>
              <label>Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="form-control"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Priority</label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                min="1"
                step="1"
                className="form-control"
                style={styles.input}
                placeholder="1"
              />
            </div>
            <div style={styles.formGroup} className="form-check">
              <input
                type="checkbox"
                name="stockStatus"
                checked={formData.stockStatus}
                onChange={handleInputChange}
                className="form-check-input"
                id="add_stock_status"
              />
              <label className="form-check-label" htmlFor="add_stock_status">Stock Status</label>
            </div>
          </div>
          <div style={styles.formGroup}>
            <label>Specifications</label>
            <textarea
              name="specifications"
              value={formData.specifications}
              onChange={handleInputChange}
              required
              rows="3"
              className="form-control"
              style={styles.textarea}
            />
          </div>
          <div style={styles.formGroup}>
            <label>Compatibility (Legacy)</label>
            <input
              type="text"
              name="compatibility"
              value={formData.compatibility}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Legacy compatibility string"
            />
          </div>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label>Socket (CPU/Motherboard)</label>
              <input
                type="text"
                name="socket"
                value={formData.socket || ''}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="e.g., LGA1700, AM4, AM5"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Chipset (Motherboard)</label>
              <input
                type="text"
                name="chipset"
                value={formData.chipset || ''}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="e.g., Z690, B550, X670"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Form Factor (Motherboard/Case)</label>
              <input
                type="text"
                name="formFactor"
                value={formData.formFactor || ''}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="e.g., ATX, mATX, ITX"
              />
            </div>
            <div style={styles.formGroup}>
              <label>RAM Type (Motherboard/RAM)</label>
              <input
                type="text"
                name="ramType"
                value={formData.ramType || ''}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="e.g., DDR4, DDR5"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Storage Interface (Storage)</label>
              <input
                type="text"
                name="storageInterface"
                value={formData.storageInterface || ''}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="e.g., SATA, NVMe M.2"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Power Requirement (W) (CPU/GPU)</label>
              <input
                type="number"
                name="powerRequirement"
                value={formData.powerRequirement || ''}
                onChange={handleInputChange}
                min="0"
                style={styles.input}
                placeholder="e.g., 150, 200"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Wattage (W) (PSU)</label>
              <input
                type="number"
                name="wattage"
                value={formData.wattage || ''}
                onChange={handleInputChange}
                min="0"
                style={styles.input}
                placeholder="e.g., 650, 750"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={styles.submitButton}>
            Add Component
          </button>
        </form>
      )}

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdate(editing);
          }}
          style={styles.form}
        >
          <h3>Edit Component</h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-control"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="form-select"
                style={styles.input}
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
            <div style={styles.formGroup}>
              <label>Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="form-control form-control-sm"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Priority</label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                min="1"
                step="1"
                className="form-control form-control-sm"
                style={styles.input}
                placeholder="1"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Stock Status</label>
              <input
                type="checkbox"
                name="stockStatus"
                checked={formData.stockStatus}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label>Specifications</label>
            <textarea
              name="specifications"
              value={formData.specifications}
              onChange={handleInputChange}
              required
              rows="3"
              style={styles.textarea}
            />
          </div>
          <div style={styles.formGroup}>
            <label>Compatibility (Legacy)</label>
              <input
                type="text"
                name="compatibility"
                value={formData.compatibility}
                onChange={handleInputChange}
                className="form-control"
                style={styles.input}
                placeholder="Legacy compatibility string"
              />
          </div>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label>Socket (CPU/Motherboard)</label>
              <input
                type="text"
                name="socket"
                value={formData.socket || ''}
                onChange={handleInputChange}
                className="form-control"
                style={styles.input}
                placeholder="e.g., LGA1700, AM4, AM5"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Chipset (Motherboard)</label>
              <input
                type="text"
                name="chipset"
                value={formData.chipset || ''}
                onChange={handleInputChange}
                className="form-control"
                style={styles.input}
                placeholder="e.g., Z690, B550, X670"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Form Factor (Motherboard/Case)</label>
              <input
                type="text"
                name="formFactor"
                value={formData.formFactor || ''}
                onChange={handleInputChange}
                className="form-control"
                style={styles.input}
                placeholder="e.g., ATX, mATX, ITX"
              />
            </div>
            <div style={styles.formGroup}>
              <label>RAM Type (Motherboard/RAM)</label>
              <input
                type="text"
                name="ramType"
                value={formData.ramType || ''}
                onChange={handleInputChange}
                className="form-control"
                style={styles.input}
                placeholder="e.g., DDR4, DDR5"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Storage Interface (Storage)</label>
              <input
                type="text"
                name="storageInterface"
                value={formData.storageInterface || ''}
                onChange={handleInputChange}
                className="form-control"
                style={styles.input}
                placeholder="e.g., SATA, NVMe M.2"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Power Requirement (W) (CPU/GPU)</label>
              <input
                type="number"
                name="powerRequirement"
                value={formData.powerRequirement || ''}
                onChange={handleInputChange}
                min="0"
                className="form-control form-control-sm"
                style={styles.input}
                placeholder="e.g., 150, 200"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Wattage (W) (PSU)</label>
              <input
                type="number"
                name="wattage"
                value={formData.wattage || ''}
                onChange={handleInputChange}
                min="0"
                className="form-control form-control-sm"
                style={styles.input}
                placeholder="e.g., 650, 750"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Image URL</label>
              <input
                type="text"
                name="url"
                value={formData.url || ''}
                onChange={handleInputChange}
                className="form-control"
                style={styles.input}
                placeholder="Image URL"
              />
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }} className="d-flex gap-2">
            <button type="submit" className="btn btn-primary" style={styles.submitButton}>
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
              }}
              className="btn btn-secondary"
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.tableContainer} className="table-responsive">
        <table className="table table-bordered table-hover align-middle" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeaderCell}>Image</th>
              <th style={styles.tableHeaderCell}>Name</th>
              <th style={styles.tableHeaderCell}>Category</th>
              <th style={styles.tableHeaderCell}>Price</th>
              <th style={styles.tableHeaderCell}>Priority</th>
              <th style={styles.tableHeaderCell}>Stock</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.map((component) => (
              <tr key={component._id}>
                <td style={styles.tableCell}>
                  {component.url ? (
                    <img
                      src={component.url}
                      alt={component.name}
                      style={styles.componentImage}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={styles.noImage}>No Image</div>
                  )}
                </td>
                <td style={styles.tableCell}>{component.name}</td>
                <td style={styles.tableCell}>{component.category}</td>
                <td style={styles.tableCell}>
                <input
                    type="number"
                    value={component.price}
                    onChange={(e) =>
                      handleQuickUpdate(component._id, 'price', parseFloat(e.target.value))
                    }
                    onBlur={(e) =>
                      handleQuickUpdate(component._id, 'price', parseFloat(e.target.value))
                    }
                    className="form-control form-control-sm"
                    style={{ ...styles.priceInput, width: '100px' }}
                    step="0.01"
                  />
                </td>
                <td style={styles.tableCell}>
                  <input
                    type="number"
                    value={component.priority ?? 1}
                    onChange={(e) =>
                      handleQuickUpdate(component._id, 'priority', parseInt(e.target.value || '1', 10))
                    }
                    onBlur={(e) =>
                      handleQuickUpdate(component._id, 'priority', parseInt(e.target.value || '1', 10))
                    }
                    className="form-control form-control-sm"
                    style={{ ...styles.priceInput, width: '80px' }}
                    step="1"
                    min="1"
                  />
                </td>
                <td style={styles.tableCell}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={component.stockStatus}
                      onChange={(e) =>
                        handleQuickUpdate(component._id, 'stockStatus', e.target.checked)
                      }
                    />
                    {component.stockStatus ? (
                      <span style={styles.inStock}>In Stock</span>
                    ) : (
                      <span style={styles.outOfStock}>Out of Stock</span>
                    )}
                  </label>
                </td>
                <td style={styles.tableCell}>
                  <div className="action-stack">
                    <button onClick={() => handleEdit(component)} className="btn btn-warning action-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(component._id)} className="btn btn-danger action-btn">
                      Delete
                    </button>
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

// Users Tab Component
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setFormError('');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
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
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
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
    if (!window.confirm('Are you sure you want to reject and delete this user account? This action cannot be undone.')) {
      return;
    }
    try {
      await api.put(`/users/${userId}/reject`);
      // Remove user from list after deletion
      setUsers(users.filter((u) => u._id !== userId));
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  // Handle existing users without approved field (treat as approved)
  const pendingUsers = users.filter((u) => u.approved === false);
  const approvedUsers = users.filter((u) => u.approved === true || u.approved === undefined);

  if (loading) {
    return <div style={styles.loading}>Loading users...</div>;
  }

  const roles = ['user', 'admin', 'assembler', 'supplier'];

  return (
    <div>
      <div style={styles.header} className="d-flex align-items-center justify-content-between mb-3">
        <h2>User Management ({users.length})</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-success"
          style={styles.addButton}
        >
          {showAddForm ? 'Cancel' : 'Register New User'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddUser} style={styles.form}>
          <h3>Register New User</h3>
          {formError && <div style={styles.error}>{formError}</div>}
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.input}
                placeholder="User's full name"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={styles.input}
                placeholder="user@example.com"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
                style={styles.input}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                style={styles.input}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={styles.submitButton}>
            Create User
          </button>
        </form>
      )}

      {pendingUsers.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            Pending Approval ({pendingUsers.length})
          </h3>
          <div style={styles.tableContainer}>
          <table className="table table-bordered table-hover align-middle" style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>Name</th>
                  <th style={styles.tableHeaderCell}>Email</th>
                  <th style={styles.tableHeaderCell}>Role</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Created</th>
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user._id}>
                    <td style={styles.tableCell}>{user.name}</td>
                    <td style={styles.tableCell}>{user.email}</td>
                    <td style={styles.tableCell}>
                      <span style={styles.roleBadge}>{user.role}</span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.pendingBadge}>Pending</span>
                    </td>
                    <td style={styles.tableCell}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style={styles.tableCell}>
                      <div className="action-stack">
                        <button
                          onClick={() => handleApprove(user._id)}
                          className="btn btn-success action-btn"
                          style={styles.approveButton}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(user._id)}
                          className="btn btn-warning action-btn"
                          style={styles.rejectButton}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="btn btn-danger action-btn"
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          All Users ({users.length})
        </h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeaderCell}>Name</th>
                <th style={styles.tableHeaderCell}>Email</th>
                <th style={styles.tableHeaderCell}>Role</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Created</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td style={styles.tableCell}>{user.name}</td>
                  <td style={styles.tableCell}>{user.email}</td>
                  <td style={styles.tableCell}>
                    {editingRole === user._id ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={styles.inlineInput}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={styles.roleBadge}>{user.role}</span>
                    )}
                  </td>
                  <td style={styles.tableCell}>
                    {user.approved === false ? (
                      <span style={styles.pendingBadge}>Pending</span>
                    ) : (
                      <span style={styles.approvedBadge}>Approved</span>
                    )}
                  </td>
                  <td style={styles.tableCell}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={styles.tableCell}>
                    {user.approved === false && (
                      <button
                        onClick={() => handleApprove(user._id)}
                        style={styles.approveButton}
                      >
                        Approve
                      </button>
                    )}
                    {(user.approved === true || user.approved === undefined) && user._id !== currentUser._id && (
                      <button
                        onClick={() => handleReject(user._id)}
                        style={styles.rejectButton}
                      >
                        Reject
                      </button>
                    )}
                    {user._id !== currentUser._id && (
                      <>
                        <button
                          onClick={() =>
                            setEditingRole(editingRole === user._id ? null : user._id)
                          }
                          style={styles.editButton}
                        >
                          {editingRole === user._id ? 'Cancel' : 'Change Role'}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </>
                    )}
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

// Builds Tab Component
// Categories Tab Component
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
      setFormData({
        name: '',
        description: '',
        priority: 1,
        isActive: true,
      });
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
    if (!window.confirm('Are you sure you want to delete this category? This will fail if any components are using it.')) {
      return;
    }
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
    return <div style={styles.loading}>Loading categories...</div>;
  }

  return (
    <div>
      <div style={styles.header} className="d-flex align-items-center justify-content-between mb-3">
        <h2>Category Management</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-success" style={styles.addButton}>
          {showAddForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} style={styles.form}>
          <h3>Add New Category</h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={styles.input}
                placeholder="e.g., CPU, GPU, RAM"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Optional description"
              />
            </div>
            <div style={styles.formGroup}>
              <label>Priority (for budget allocation) *</label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                min="1"
                style={styles.input}
                placeholder="1"
              />
              <small style={styles.helpText}>Higher priority = larger budget share</small>
            </div>
            <div style={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={styles.submitButton}>
            Add Category
          </button>
        </form>
      )}

      <div style={styles.tableContainer} className="table-responsive">
        <table className="table table-bordered table-hover align-middle" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeaderCell}>Name</th>
              <th style={styles.tableHeaderCell}>Description</th>
              <th style={styles.tableHeaderCell}>Priority</th>
              <th style={styles.tableHeaderCell}>Status</th>
              <th style={styles.tableHeaderCell}>Created</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                {editing === category._id ? (
                  <>
                    <td style={styles.tableCell}>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={styles.inlineInput}
                        required
                      />
                    </td>
                    <td style={styles.tableCell}>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        style={styles.inlineInput}
                      />
                    </td>
                    <td style={styles.tableCell}>
                      <input
                        type="number"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        min="1"
                        style={styles.inlineInput}
                        required
                      />
                    </td>
                    <td style={styles.tableCell}>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                        />
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </label>
                    </td>
                    <td style={styles.tableCell}>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td style={styles.tableCell}>
                      <button
                        onClick={() => handleUpdate(category._id)}
                        style={styles.saveButton}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        style={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={styles.tableCell}>{category.name}</td>
                    <td style={styles.tableCell}>{category.description || '-'}</td>
                    <td style={styles.tableCell}>{category.priority ?? 1}</td>
                    <td style={styles.tableCell}>
                      <button
                        onClick={() => handleToggleActive(category._id, category.isActive)}
                        style={category.isActive ? styles.activeButton : styles.inactiveButton}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={styles.tableCell}>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td style={styles.tableCell}>
                      <div className="action-stack">
                        <button
                          onClick={() => handleEdit(category)}
                          className="btn btn-warning action-btn"
                          style={styles.editButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category._id)}
                          className="btn btn-danger action-btn"
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p style={styles.emptyMessage}>No categories found. Add your first category!</p>
        )}
      </div>
    </div>
  );
}

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
      const availableAssemblers = users.filter(u => u.role === 'assembler' && (u.approved === undefined || u.approved === true));
      setAssemblers(availableAssemblers);
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
    setSelectedBuildIds((prev) => {
      if (prev.includes(buildId)) return prev.filter((id) => id !== buildId);
      return [...prev, buildId];
    });
  };

  const selectAllBuilds = (checked) => {
    if (checked) {
      setSelectedBuildIds(builds.map((b) => b._id));
    } else {
      setSelectedBuildIds([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedBuildIds.length === 0) {
      alert('No builds selected to delete.');
      return;
    }
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
      if (!assemblerID) {
        alert('Please select an assembler to assign.');
        return;
      }
      const res = await api.put(`/builds/${buildId}/assign`, { assemblerID });
      const updated = res.data.data;
      setBuilds(prev => prev.map(b => (b._id === buildId ? updated : b)));
      if (selectedBuild && selectedBuild._id === buildId) {
        setSelectedBuild(updated);
      }
      alert('Assembler assigned successfully.');
    } catch (error) {
      console.error('Error assigning assembler:', error);
      alert(error.response?.data?.message || 'Error assigning assembler');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading builds...</div>;
  }

  return (
    <div>
      <h2>All Builds ({builds.length})</h2>

      {selectedBuild && (
        <div style={styles.buildDetails}>
          <button onClick={() => setSelectedBuild(null)} style={styles.closeBtn}>
            Close
          </button>
          <h3>Build Details</h3>
          <p><strong>User:</strong> {selectedBuild.userID?.name || 'N/A'}</p>
          <p><strong>Status:</strong> {selectedBuild.assemblyStatus}</p>
          <p><strong>Assembler:</strong> {selectedBuild.assemblerID?.name || 'Not assigned'}</p>
          <p><strong>Total Price:</strong> ${selectedBuild.totalPrice.toFixed(2)}</p>
          <h4>Components:</h4>
          <ul>
            {selectedBuild.components.map((comp, i) => (
              <li key={i}>
                {comp.componentName} ({comp.category}) - ${comp.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          {!deleteMode ? (
            <button
              onClick={() => setDeleteMode(true)}
              className="btn btn-danger"
              style={{ padding: '0.4rem 0.8rem', marginRight: '0.5rem' }}
            >
              Delete
            </button>
          ) : (
            <>
              <button
                onClick={handleDeleteSelected}
                className="btn btn-danger"
                style={{ padding: '0.4rem 0.8rem', marginRight: '0.5rem' }}
                disabled={selectedBuildIds.length === 0}
              >
                Confirm Delete
              </button>
              <button
                onClick={() => { setDeleteMode(false); setSelectedBuildIds([]); }}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem' }}
              >
                Cancel
              </button>
              <span style={{ color: '#666', marginLeft: '0.5rem' }}>{selectedBuildIds.length} selected</span>
            </>
          )}
        </div>
      </div>

      <div style={styles.tableContainer} className="table-responsive">
        <table className="table table-bordered table-hover align-middle" style={styles.table}>
          <thead>
            <tr>
              {deleteMode && (
                <th style={{ ...styles.tableHeaderCell, width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedBuildIds.length === builds.length && builds.length > 0}
                    onChange={(e) => selectAllBuilds(e.target.checked)}
                  />
                </th>
              )}
              <th style={styles.tableHeaderCell}>User</th>
              <th style={styles.tableHeaderCell}>Components</th>
              <th style={styles.tableHeaderCell}>Price</th>
              <th style={styles.tableHeaderCell}>Status</th>
              <th style={styles.tableHeaderCell}>Assembler</th>
              <th style={styles.tableHeaderCell}>Created</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((build) => (
              <tr key={build._id}>
                {deleteMode && (
                  <td style={styles.tableCell}>
                    <input
                      type="checkbox"
                      checked={selectedBuildIds.includes(build._id)}
                      onChange={() => toggleSelectBuild(build._id)}
                    />
                  </td>
                )}
                <td style={styles.tableCell}>{build.userID?.name || 'N/A'}</td>
                <td style={styles.tableCell}>{build.components.length}</td>
                <td style={styles.tableCell}>${build.totalPrice.toFixed(2)}</td>
                <td style={styles.tableCell}>
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
                </td>
                <td style={styles.tableCell}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={assignMap[build._id] ?? (build.assemblerID?._id ?? '')}
                      onChange={(e) => handleAssignChange(build._id, e.target.value)}
                      style={styles.input}
                      className="form-select form-select-sm"
                    >
                      <option value="">Not assigned</option>
                      {assemblers.map(a => (
                        <option key={a._id} value={a._id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => handleAssign(build._id)} className="btn btn-primary btn-sm" style={styles.submitButton}>
                      Assign
                    </button>
                  </div>
                </td>
                <td style={styles.tableCell}>{new Date(build.createdAt).toLocaleDateString()}</td>
                <td style={styles.tableCell}>
                  <button
                    onClick={() => setSelectedBuild(build)}
                    className="btn btn-primary btn-sm"
                    style={styles.viewButton}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    maxWidth: '1400px',
    margin: '2rem auto',
    padding: '0 2rem',
  },
  tabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '2px solid #ddd',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#666',
  },
  activeTab: {
    borderBottom: '2px solid #007bff',
    color: '#007bff',
    fontWeight: 'bold',
  },
  tabContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.25rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: '2rem',
    borderRadius: '8px',
    textAlign: 'center',
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  addButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  form: {
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  },
  tableHeaderCell: {
    border: '1px solid #e6e6e6',
    padding: '0.6rem',
    backgroundColor: '#fafafa',
    textAlign: 'left',
  },
  tableCell: {
    border: '1px solid #e6e6e6',
    padding: '0.6rem',
    verticalAlign: 'middle',
  },
  'table th': {
    backgroundColor: '#f8f9fa',
    padding: '0.75rem',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold',
  },
  'table td': {
    padding: '0.75rem',
    borderBottom: '1px solid #ddd',
  },
  inlineInput: {
    padding: '0.25rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  imageContainer: {
    position: 'relative',
    width: '60px',
    height: '60px',
  },
  componentImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid #ddd',
    display: 'block',
  },
  noImage: {
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.75rem',
    color: '#999',
    textAlign: 'center',
  },
  imageError: {
    fontSize: '0.75rem',
    color: '#dc3545',
  },
  priceInput: {
    padding: '0.25rem',
    border: '1px solid #28a745',
    borderRadius: '4px',
    fontSize: '0.9rem',
    width: '80px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  editButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
  },
  deleteButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  saveButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
  },
  cancelButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  viewButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  inStock: {
    color: '#28a745',
    fontWeight: '500',
  },
  outOfStock: {
    color: '#dc3545',
    fontWeight: '500',
  },
  roleBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    fontSize: '0.875rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
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
  buildDetails: {
    border: '2px solid #007bff',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    backgroundColor: '#f8f9fa',
  },
  closeBtn: {
    float: 'right',
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    marginBottom: '1rem',
    color: '#333',
    fontSize: '1.25rem',
  },
  pendingBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  approvedBadge: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#d1e7dd',
    color: '#0f5132',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  approveButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
  },
  rejectButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#ffc107',
    color: '#333',
  },
  activeButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  inactiveButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
  },
};

export default AdminDashboard;
