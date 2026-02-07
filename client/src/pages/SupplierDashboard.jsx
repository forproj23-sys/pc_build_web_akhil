import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import TopNav from '../components/TopNav';

function SupplierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
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
      <div style={styles.container}>
        <div style={styles.loading}>Loading inventory...</div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="app-container">
      <TopNav />
      <div style={styles.content} className="app-content">
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
            <>
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
                    <label>Priority</label>
                    <input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      style={styles.input}
                      placeholder="1"
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
                  <label>Compatibility (Legacy - optional)</label>
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
                      value={formData.socket}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="e.g., LGA1700, AM4"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Chipset (Motherboard)</label>
                    <input
                      type="text"
                      name="chipset"
                      value={formData.chipset}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="e.g., Z690, B550"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Form Factor (Motherboard/Case)</label>
                    <input
                      type="text"
                      name="formFactor"
                      value={formData.formFactor}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="e.g., ATX, mATX"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>RAM Type (Motherboard/RAM)</label>
                    <input
                      type="text"
                      name="ramType"
                      value={formData.ramType}
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
                      value={formData.storageInterface}
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
                      value={formData.powerRequirement}
                      onChange={handleInputChange}
                      min="0"
                      style={styles.input}
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Wattage (W) (PSU)</label>
                    <input
                      type="number"
                      name="wattage"
                      value={formData.wattage}
                      onChange={handleInputChange}
                      min="0"
                      style={styles.input}
                      placeholder="e.g., 650"
                    />
                  </div>
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
                <div style={{ marginTop: '0.75rem' }}>
                  <button type="submit" style={styles.submitButton}>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <div style={styles.inventoryLayout}>
              {/* Left Sidebar - Category Filter List */}
              <div style={styles.filterSidebar}>
                <h3 style={styles.sidebarTitle}>Filters</h3>
                
                {/* Search Box */}
                <div style={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Search components..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                <ul style={styles.categoryList}>
                  <li
                    style={{
                      ...styles.categoryListItem,
                      ...(selectedCategory === 'all' || selectedCategory === null ? styles.activeCategoryItem : {}),
                    }}
                    onClick={() => setSelectedCategory('all')}
                  >
                    <div style={styles.categoryListItemContent}>
                      <span style={styles.categoryName}>All Components</span>
                      <span style={(selectedCategory === 'all' || selectedCategory === null) ? styles.activeCategoryItemCountBadge : styles.countBadge}>
                        {components.length}
                      </span>
                    </div>
                  </li>
                  <li
                    style={{
                      ...styles.categoryListItem,
                      ...(selectedCategory === 'mine' ? styles.activeCategoryItem : {}),
                    }}
                    onClick={() => setSelectedCategory('mine')}
                  >
                    <div style={styles.categoryListItemContent}>
                      <span style={styles.categoryName}>My Components</span>
                      <span style={selectedCategory === 'mine' ? styles.activeCategoryItemCountBadge : styles.countBadge}>
                        {components.filter((c) => c.supplierID && (c.supplierID._id === user?.id || c.supplierID._id?.toString() === user?.id)).length}
                      </span>
                    </div>
                  </li>
                  <li style={styles.categoryListDivider}>
                    <span style={styles.dividerText}>Categories</span>
                  </li>
                  {categories.map((category) => {
                    const count = components.filter((c) => (c.category || '').toUpperCase() === (category.name || '').toUpperCase()).length;
                    return (
                      <li
                        key={category._id}
                        style={{
                          ...styles.categoryListItem,
                          ...(selectedCategory === category.name ? styles.activeCategoryItem : {}),
                        }}
                        onClick={() => setSelectedCategory(category.name)}
                      >
                        <div style={styles.categoryListItemContent}>
                          <span style={styles.categoryName}>{category.name}</span>
                          <span style={selectedCategory === category.name ? styles.activeCategoryItemCountBadge : styles.countBadge}>
                            {count}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Filter Info */}
                <div style={styles.filterInfo}>
                  <p style={styles.filterInfoText}>
                    Showing {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => fetchComponents()}
                    style={styles.refreshButtonSmall}
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>

              {/* Right Side - Components Table */}
              <div style={styles.tableWrapper} className="table-responsive">
                <table className="table table-bordered table-hover align-middle" style={styles.table}>
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
                        <td colSpan="7" style={styles.noResultsCell}>
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
                            <input
                              type="number"
                              value={component.priority ?? 1}
                              onChange={(e) =>
                                handleQuickUpdate(component._id, 'priority', parseInt(e.target.value || '1', 10))
                              }
                              onBlur={(e) =>
                                handleQuickUpdate(component._id, 'priority', parseInt(e.target.value || '1', 10))
                              }
                              style={styles.priceInput}
                              step="1"
                              min="1"
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
                          <td>
                            <div className="action-stack">
                              <button
                                onClick={() => handleEdit(component)}
                                className="btn btn-warning action-btn"
                                style={styles.editButton}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(component._id)}
                                className="btn btn-danger action-btn"
                                style={styles.deleteButton}
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
            </>
          )}

          {activeTab === 'add' && (
            <div>
              <h3>Add New Component</h3>
              <div className="card p-3">
              <form onSubmit={handleAdd}>
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
                    <label>Priority</label>
                    <input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      style={styles.input}
                      placeholder="1"
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
                  <label>Compatibility (Legacy - optional)</label>
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
                      value={formData.socket}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="e.g., LGA1700, AM4"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Chipset (Motherboard)</label>
                    <input
                      type="text"
                      name="chipset"
                      value={formData.chipset}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="e.g., Z690, B550"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Form Factor (Motherboard/Case)</label>
                    <input
                      type="text"
                      name="formFactor"
                      value={formData.formFactor}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="e.g., ATX, mATX"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>RAM Type (Motherboard/RAM)</label>
                    <input
                      type="text"
                      name="ramType"
                      value={formData.ramType}
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
                      value={formData.storageInterface}
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
                      value={formData.powerRequirement}
                      onChange={handleInputChange}
                      min="0"
                      style={styles.input}
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Wattage (W) (PSU)</label>
                    <input
                      type="number"
                      name="wattage"
                      value={formData.wattage}
                      onChange={handleInputChange}
                      min="0"
                      style={styles.input}
                      placeholder="e.g., 650"
                    />
                  </div>
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
                <button type="submit" className="btn btn-primary w-100" style={styles.submitButton}>
                  Add Component
                </button>
              </form>
              </div>
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
  inventoryLayout: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  filterSidebar: {
    width: '280px',
    minWidth: '280px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '1.5rem',
    border: '1px solid #dee2e6',
    position: 'sticky',
    top: '1rem',
    maxHeight: 'calc(100vh - 2rem)',
    overflowY: 'auto',
  },
  sidebarTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.1rem',
    color: '#333',
    borderBottom: '2px solid #007bff',
    paddingBottom: '0.5rem',
  },
  searchBox: {
    marginBottom: '1rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
    boxSizing: 'border-box',
  },
  categoryList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  categoryListItem: {
    padding: '0.75rem 1rem',
    marginBottom: '0.5rem',
    backgroundColor: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid #dee2e6',
    transition: 'all 0.2s',
  },
  activeCategoryItem: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
    fontWeight: 'bold',
  },
  categoryListItemContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  categoryName: {
    flex: 1,
    fontWeight: '500',
  },
  countBadge: {
    fontSize: '0.75rem',
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    padding: '0.2rem 0.5rem',
    borderRadius: '12px',
    fontWeight: 'bold',
  },
  // Override for active category items
  activeCategoryItemCountBadge: {
    fontSize: '0.75rem',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: '0.2rem 0.5rem',
    borderRadius: '12px',
    fontWeight: 'bold',
  },
  categoryListDivider: {
    padding: '0.5rem 1rem',
    marginBottom: '0.5rem',
    borderTop: '1px solid #dee2e6',
    marginTop: '0.5rem',
  },
  dividerText: {
    fontSize: '0.75rem',
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  filterInfo: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #dee2e6',
  },
  filterInfoText: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0 0 0.5rem 0',
  },
  refreshButtonSmall: {
    width: '100%',
    padding: '0.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  tableWrapper: {
    flex: 1,
    overflowX: 'auto',
  },
  noResultsCell: {
    textAlign: 'center',
    padding: '2rem',
    color: '#999',
    fontStyle: 'italic',
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
