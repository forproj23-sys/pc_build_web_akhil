import { useState, useEffect } from 'react';
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
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo}>Admin Dashboard</h1>
        <div style={styles.navLinks}>
          <span style={styles.userInfo}>Welcome, {user?.name} (Admin)</span>
          <Link to="/" style={styles.link}>Home</Link>
          <button onClick={handleLogout} style={styles.button}>
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.content}>
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
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'CPU',
    price: '',
    specifications: '',
    compatibility: '',
    stockStatus: true,
  });

  useEffect(() => {
    fetchComponents();
  }, []);

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

  if (loading) {
    return <div style={styles.loading}>Loading components...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h2>Component Management</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={styles.addButton}>
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
                style={styles.input}
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
            <label>Compatibility</label>
            <input
              type="text"
              name="compatibility"
              value={formData.compatibility}
              onChange={handleInputChange}
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.submitButton}>
            Add Component
          </button>
        </form>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.map((component) => (
              <tr key={component._id}>
                {editing === component._id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={styles.inlineInput}
                      />
                    </td>
                    <td>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        style={styles.inlineInput}
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
                    </td>
                    <td>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        style={styles.inlineInput}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        name="stockStatus"
                        checked={formData.stockStatus}
                        onChange={handleInputChange}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleUpdate(component._id)}
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
                    <td>{component.name}</td>
                    <td>{component.category}</td>
                    <td>${component.price.toFixed(2)}</td>
                    <td>
                      {component.stockStatus ? (
                        <span style={styles.inStock}>In Stock</span>
                      ) : (
                        <span style={styles.outOfStock}>Out of Stock</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleEdit(component)}
                        style={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(component._id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
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
      <div style={styles.header}>
        <h2>User Management ({users.length})</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
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
          <button type="submit" style={styles.submitButton}>
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
            <table style={styles.table}>
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
                    <td>
                      <span style={styles.roleBadge}>{user.role}</span>
                    </td>
                    <td>
                      <span style={styles.pendingBadge}>Pending</span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleApprove(user._id)}
                        style={styles.approveButton}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(user._id)}
                        style={styles.rejectButton}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
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
                  <td>
                    {user.approved === false ? (
                      <span style={styles.pendingBadge}>Pending</span>
                    ) : (
                      <span style={styles.approvedBadge}>Approved</span>
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
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
      <div style={styles.header}>
        <h2>Category Management</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} style={styles.addButton}>
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
          <button type="submit" style={styles.submitButton}>
            Add Category
          </button>
        </form>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
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
                    <td>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={styles.inlineInput}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        style={styles.inlineInput}
                      />
                    </td>
                    <td>
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
                    <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td>
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
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(category._id, category.isActive)}
                        style={category.isActive ? styles.activeButton : styles.inactiveButton}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(category)}
                        style={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
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

  useEffect(() => {
    fetchBuilds();
  }, []);

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

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
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
                <td>{build.userID?.name || 'N/A'}</td>
                <td>{build.components.length}</td>
                <td>${build.totalPrice.toFixed(2)}</td>
                <td>
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
                <td>{build.assemblerID?.name || 'Not assigned'}</td>
                <td>{new Date(build.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => setSelectedBuild(build)}
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
