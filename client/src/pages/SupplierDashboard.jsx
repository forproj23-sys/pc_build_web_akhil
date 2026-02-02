import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function SupplierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'mine', or category
  const [editing, setEditing] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'CPU',
    price: '',
    specifications: '',
    compatibility: '',
    url: '',
    stockStatus: true,
  });

  useEffect(() => {
    fetchComponents();
  }, [filter]);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      let url = '/components';
      if (filter === 'mine') {
        url = `/components?supplierID=${user._id}`;
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
        category: 'CPU',
        price: '',
        specifications: '',
        compatibility: '',
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
      specifications: component.specifications,
      compatibility: component.compatibility || '',
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
      await api.delete(`/components/${id}`);
      setComponents(components.filter((c) => c._id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting component');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const myComponents = components.filter(
    (c) => c.supplierID && c.supplierID._id === user._id
  );
  const inStockCount = myComponents.filter((c) => c.stockStatus).length;
  const outOfStockCount = myComponents.filter((c) => !c.stockStatus).length;

  const categories = ['CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Motherboard', 'Case'];

  if (loading && components.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading inventory...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo}>Supplier Dashboard</h1>
        <div style={styles.navLinks}>
          <span style={styles.userInfo}>Welcome, {user?.name} (Supplier)</span>
          <Link to="/" style={styles.link}>Home</Link>
          <button onClick={handleLogout} style={styles.button}>
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.content}>
        <h2>Component Inventory Management</h2>

        {/* Statistics */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{myComponents.length}</h3>
            <p style={styles.statLabel}>My Components</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{inStockCount}</h3>
            <p style={styles.statLabel}>In Stock</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>{outOfStockCount}</h3>
            <p style={styles.statLabel}>Out of Stock</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statValue}>${myComponents.reduce((sum, c) => sum + c.price, 0).toFixed(2)}</h3>
            <p style={styles.statLabel}>Total Inventory Value</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{ ...styles.tab, ...(activeTab === 'inventory' ? styles.activeTab : {}) }}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('add')}
            style={{ ...styles.tab, ...(activeTab === 'add' ? styles.activeTab : {}) }}
          >
            Add Component
          </button>
        </div>

        <div style={styles.tabContent}>
          {activeTab === 'inventory' && (
            <div>
              <div style={styles.filterGroup}>
                <label style={styles.label}>Filter:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={styles.select}
                >
                  <option value="all">All Components</option>
                  <option value="mine">My Components Only</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} Only
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => fetchComponents()}
                  style={styles.refreshButton}
                >
                  Refresh
                </button>
              </div>

              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Supplier</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((component) => {
                      const isMine = component.supplierID && component.supplierID._id === user._id;

                      return editing === component._id ? (
                        <tr key={component._id}>
                          <td>
                            {component.url ? (
                              <div style={styles.imageContainer}>
                                <img
                                  key={component.url}
                                  src={component.url}
                                  alt={component.name}
                                  style={styles.componentImage}
                                  onError={(e) => {
                                    console.error('Image failed to load:', component.url);
                                    e.target.style.display = 'none';
                                    const errorDiv = e.target.nextSibling;
                                    if (errorDiv) {
                                      errorDiv.style.display = 'flex';
                                    }
                                  }}
                                  onLoad={() => {
                                    console.log('Image loaded successfully:', component.url);
                                  }}
                                />
                                <div style={{ ...styles.noImage, display: 'none' }}>
                                  Failed to load
                                </div>
                              </div>
                            ) : (
                              <div style={styles.noImage}>No Image</div>
                            )}
                          </td>
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
                              step="0.01"
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
                          <td>{component.supplierID?.name || 'Unassigned'}</td>
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
                        </tr>
                      ) : (
                        <tr key={component._id}>
                          <td>
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
                              style={styles.priceInput}
                              step="0.01"
                            />
                          </td>
                          <td>
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
                                <span style={styles.outOfStock}>Out</span>
                              )}
                            </label>
                          </td>
                          <td>{component.supplierID?.name || 'Unassigned'}</td>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {components.length === 0 && (
                  <p style={styles.emptyMessage}>No components found.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'add' && (
            <div>
              <h3>Add New Component</h3>
              <form onSubmit={handleAdd} style={styles.form}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label>Component Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={styles.input}
                      placeholder="e.g., Intel i7-13700K"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Category *</label>
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
                    <label>Price ($) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      style={styles.input}
                      placeholder="0.00"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Stock Status</label>
                    <label style={styles.checkboxLabel}>
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
                <div style={styles.formGroup}>
                  <label>Specifications *</label>
                  <textarea
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    style={styles.textarea}
                    placeholder="e.g., 13th Gen, 16 cores, 3.4GHz base clock"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>Compatibility (optional)</label>
                  <input
                    type="text"
                    name="compatibility"
                    value={formData.compatibility}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="e.g., LGA 1700, AM4"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>Product URL (optional)</label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="https://example.com/product"
                  />
                </div>
                <button type="submit" style={styles.submitButton}>
                  Add Component
                </button>
              </form>
            </div>
          )}
        </div>
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
    border: '2px solid #28a745',
  },
  statValue: {
    fontSize: '2.5rem',
    margin: '0 0 0.5rem 0',
    color: '#28a745',
  },
  statLabel: {
    fontSize: '1rem',
    color: '#666',
    margin: 0,
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
    borderBottom: '2px solid #28a745',
    color: '#28a745',
    fontWeight: 'bold',
  },
  tabContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  filterGroup: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  label: {
    fontWeight: '500',
  },
  select: {
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  refreshButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
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
    width: '100%',
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
  deleteButton: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    marginLeft: '0.5rem',
  },
  inStock: {
    color: '#28a745',
    fontWeight: '500',
  },
  outOfStock: {
    color: '#dc3545',
    fontWeight: '500',
  },
  readOnly: {
    color: '#888',
    fontSize: '0.875rem',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
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
  urlLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
  noUrl: {
    color: '#999',
    fontSize: '0.875rem',
  },
  form: {
    maxWidth: '800px',
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
    resize: 'vertical',
  },
  submitButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
  },
};

export default SupplierDashboard;
