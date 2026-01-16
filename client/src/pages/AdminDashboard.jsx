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
      setStats({
        totalUsers: usersRes.data.count,
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
        category: 'CPU',
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

  const categories = ['CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Motherboard', 'Case'];

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
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
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
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
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

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === userId ? res.data.data : u)));
      setEditingRole(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating role');
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

  if (loading) {
    return <div style={styles.loading}>Loading users...</div>;
  }

  const roles = ['user', 'admin', 'assembler', 'supplier'];

  return (
    <div>
      <h2>User Management ({users.length})</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
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
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
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
  );
}

// Builds Tab Component
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
};

export default AdminDashboard;
