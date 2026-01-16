import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('components');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h1 style={styles.logo}>PC Build Configurator</h1>
        <div style={styles.navLinks}>
          <span style={styles.userInfo}>Welcome, {user?.name} ({user?.role})</span>
          <Link to="/" style={styles.link}>Home</Link>
          <button onClick={handleLogout} style={styles.button}>
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('components')}
            style={{ ...styles.tab, ...(activeTab === 'components' ? styles.activeTab : {}) }}
          >
            Browse Components
          </button>
          <button
            onClick={() => setActiveTab('create')}
            style={{ ...styles.tab, ...(activeTab === 'create' ? styles.activeTab : {}) }}
          >
            Create Build
          </button>
          <button
            onClick={() => setActiveTab('builds')}
            style={{ ...styles.tab, ...(activeTab === 'builds' ? styles.activeTab : {}) }}
          >
            My Builds
          </button>
        </div>

        <div style={styles.tabContent}>
          {activeTab === 'components' && <ComponentsList />}
          {activeTab === 'create' && <BuildCreator />}
          {activeTab === 'builds' && <MyBuilds />}
        </div>
      </div>
    </div>
  );
}

// Components List Component
function ComponentsList() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchComponents();
  }, [filter]);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const url = filter ? `/components?category=${filter}` : '/components';
      const res = await api.get(url);
      setComponents(res.data.data);
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Motherboard', 'Case'];

  if (loading) {
    return <div style={styles.loading}>Loading components...</div>;
  }

  return (
    <div>
      <h2>Browse Components</h2>
      <div style={styles.filterGroup}>
        <label style={styles.label}>Filter by Category:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={styles.select}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat || 'All Categories'}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.componentsGrid}>
        {components.length === 0 ? (
          <p>No components found.</p>
        ) : (
          components.map((component) => (
            <div key={component._id} style={styles.componentCard}>
              <h3 style={styles.componentName}>{component.name}</h3>
              <p style={styles.componentCategory}>{component.category}</p>
              <p style={styles.componentPrice}>${component.price.toFixed(2)}</p>
              <p style={styles.componentSpecs}>{component.specifications}</p>
              {component.compatibility && (
                <p style={styles.compatibility}>Compatibility: {component.compatibility}</p>
              )}
              <p style={styles.stockStatus}>
                {component.stockStatus ? (
                  <span style={styles.inStock}>In Stock</span>
                ) : (
                  <span style={styles.outOfStock}>Out of Stock</span>
                )}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Build Creator Component
function BuildCreator() {
  const [components, setComponents] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [buildResult, setBuildResult] = useState(null);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/components?stockStatus=true');
      setComponents(res.data.data);
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComponent = (component) => {
    setSelectedComponents((prev) => {
      const exists = prev.find((c) => c._id === component._id);
      if (exists) {
        return prev.filter((c) => c._id !== component._id);
      } else {
        // Check if category already selected
        const categoryExists = prev.find((c) => c.category === component.category);
        if (categoryExists) {
          setMessage(`You already selected a ${component.category}. Replacing...`);
          return prev.filter((c) => c.category !== component.category).concat(component);
        }
        return [...prev, component];
      }
    });
    setMessage('');
  };

  const createBuild = async () => {
    if (selectedComponents.length === 0) {
      setMessage('Please select at least one component');
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      const componentIDs = selectedComponents.map((c) => c._id);
      const res = await api.post('/builds', { componentIDs });
      setBuildResult(res.data);
      setSelectedComponents([]);
      setMessage('Build created successfully! Check compatibility details below.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating build');
    } finally {
      setSaving(false);
    }
  };

  const totalPrice = selectedComponents.reduce((sum, c) => sum + c.price, 0);

  if (loading) {
    return <div style={styles.loading}>Loading components...</div>;
  }

  const categories = ['CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Motherboard', 'Case'];

  return (
    <div>
      <h2>Create PC Build</h2>
      
      {message && (
        <div style={message.includes('Error') ? styles.error : styles.success}>
          {message}
        </div>
      )}

      {buildResult && buildResult.compatibility && (
        <div style={styles.compatibilityResult}>
          <h3>Compatibility Check</h3>
          <p><strong>{buildResult.compatibility.summary}</strong></p>
          {buildResult.compatibility.issues.length > 0 && (
            <div>
              <h4>Issues:</h4>
              <ul>
                {buildResult.compatibility.issues.map((issue, i) => (
                  <li key={i} style={styles.issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {buildResult.compatibility.warnings.length > 0 && (
            <div>
              <h4>Warnings:</h4>
              <ul>
                {buildResult.compatibility.warnings.map((warning, i) => (
                  <li key={i} style={styles.warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={styles.buildCreator}>
        <div style={styles.selectedSection}>
          <h3>Selected Components ({selectedComponents.length})</h3>
          {selectedComponents.length === 0 ? (
            <p>No components selected</p>
          ) : (
            <div>
              {categories.map((cat) => {
                const comp = selectedComponents.find((c) => c.category === cat);
                return comp ? (
                  <div key={cat} style={styles.selectedItem}>
                    <strong>{cat}:</strong> {comp.name} - ${comp.price.toFixed(2)}
                    <button onClick={() => toggleComponent(comp)} style={styles.removeBtn}>
                      Remove
                    </button>
                  </div>
                ) : null;
              })}
              <div style={styles.totalPrice}>
                <strong>Total Price: ${totalPrice.toFixed(2)}</strong>
              </div>
              <button
                onClick={createBuild}
                disabled={saving}
                style={styles.createButton}
              >
                {saving ? 'Saving...' : 'Save Build'}
              </button>
            </div>
          )}
        </div>

        <div style={styles.componentsSection}>
          <h3>Available Components</h3>
          {['CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Motherboard', 'Case'].map((category) => {
            const categoryComponents = components.filter((c) => c.category === category);
            const selected = selectedComponents.find((c) => c.category === category);

            return (
              <div key={category} style={styles.categoryGroup}>
                <h4>{category}</h4>
                {categoryComponents.length === 0 ? (
                  <p>No {category} components available</p>
                ) : (
                  categoryComponents.map((component) => (
                    <div
                      key={component._id}
                      style={{
                        ...styles.componentOption,
                        ...(selected?._id === component._id ? styles.selectedOption : {}),
                      }}
                    >
                      <input
                        type="radio"
                        name={category}
                        checked={selected?._id === component._id}
                        onChange={() => toggleComponent(component)}
                      />
                      <div style={styles.optionDetails}>
                        <strong>{component.name}</strong> - ${component.price.toFixed(2)}
                        <p style={styles.smallText}>{component.specifications}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// My Builds Component
function MyBuilds() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuild, setSelectedBuild] = useState(null);

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
    try {
      setLoading(true);
      const res = await api.get('/builds');
      setBuilds(res.data.data);
    } catch (error) {
      console.error('Error fetching builds:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBuild = async (id) => {
    if (!window.confirm('Are you sure you want to delete this build?')) {
      return;
    }

    try {
      await api.delete(`/builds/${id}`);
      setBuilds(builds.filter((b) => b._id !== id));
      if (selectedBuild?._id === id) {
        setSelectedBuild(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting build');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading builds...</div>;
  }

  return (
    <div>
      <h2>My Builds ({builds.length})</h2>
      
      {selectedBuild && (
        <div style={styles.buildDetails}>
          <button onClick={() => setSelectedBuild(null)} style={styles.closeBtn}>
            Close Details
          </button>
          <h3>Build Details</h3>
          <p><strong>Status:</strong> {selectedBuild.assemblyStatus}</p>
          <p><strong>Total Price:</strong> ${selectedBuild.totalPrice.toFixed(2)}</p>
          <p><strong>Compatible:</strong> {selectedBuild.isCompatible ? 'Yes' : 'No'}</p>
          
          {selectedBuild.compatibilityCheck && (
            <div style={styles.compatibilityResult}>
              <h4>Compatibility Check</h4>
              <p>{selectedBuild.compatibilityCheck.summary}</p>
              {selectedBuild.compatibilityCheck.issues?.length > 0 && (
                <ul>
                  {selectedBuild.compatibilityCheck.issues.map((issue, i) => (
                    <li key={i} style={styles.issue}>{issue}</li>
                  ))}
                </ul>
              )}
              {selectedBuild.compatibilityCheck.warnings?.length > 0 && (
                <ul>
                  {selectedBuild.compatibilityCheck.warnings.map((warning, i) => (
                    <li key={i} style={styles.warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <h4>Components:</h4>
          <ul>
            {selectedBuild.components.map((comp, i) => (
              <li key={i}>
                {comp.componentName} ({comp.category}) - ${comp.price.toFixed(2)}
              </li>
            ))}
          </ul>

          <p style={styles.smallText}>
            Created: {new Date(selectedBuild.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      {builds.length === 0 ? (
        <p>No builds yet. Create your first build!</p>
      ) : (
        <div style={styles.buildsList}>
          {builds.map((build) => (
            <div key={build._id} style={styles.buildCard}>
              <div>
                <h3>Build #{builds.indexOf(build) + 1}</h3>
                <p><strong>Price:</strong> ${build.totalPrice.toFixed(2)}</p>
                <p><strong>Status:</strong> {build.assemblyStatus}</p>
                <p><strong>Components:</strong> {build.components.length}</p>
                <p style={styles.smallText}>
                  {new Date(build.createdAt).toLocaleString()}
                </p>
              </div>
              <div style={styles.buildActions}>
                <button
                  onClick={() => setSelectedBuild(build)}
                  style={styles.viewButton}
                >
                  View Details
                </button>
                <button
                  onClick={() => deleteBuild(build._id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
  filterGroup: {
    marginBottom: '1.5rem',
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
  componentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  componentCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#fafafa',
  },
  componentName: {
    margin: '0 0 0.5rem 0',
    color: '#333',
  },
  componentCategory: {
    color: '#007bff',
    fontWeight: '500',
    margin: '0 0 0.5rem 0',
  },
  componentPrice: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#28a745',
    margin: '0.5rem 0',
  },
  componentSpecs: {
    fontSize: '0.9rem',
    color: '#666',
    margin: '0.5rem 0',
  },
  compatibility: {
    fontSize: '0.85rem',
    color: '#888',
    margin: '0.5rem 0',
  },
  stockStatus: {
    margin: '0.5rem 0 0 0',
  },
  inStock: {
    color: '#28a745',
    fontWeight: '500',
  },
  outOfStock: {
    color: '#dc3545',
    fontWeight: '500',
  },
  buildCreator: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '2rem',
  },
  selectedSection: {
    border: '2px solid #007bff',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
  },
  selectedItem: {
    padding: '0.75rem',
    marginBottom: '0.5rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeBtn: {
    padding: '0.25rem 0.75rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  totalPrice: {
    padding: '1rem',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '4px',
    marginTop: '1rem',
    textAlign: 'center',
    fontSize: '1.25rem',
  },
  createButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  componentsSection: {
    maxHeight: '600px',
    overflowY: 'auto',
  },
  categoryGroup: {
    marginBottom: '2rem',
  },
  componentOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  selectedOption: {
    border: '2px solid #007bff',
    backgroundColor: '#e7f3ff',
  },
  optionDetails: {
    flex: 1,
  },
  smallText: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0.25rem 0 0 0',
  },
  buildsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  buildCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  buildActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  viewButton: {
    flex: 1,
    padding: '0.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteButton: {
    flex: 1,
    padding: '0.5rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
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
  compatibilityResult: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
  issue: {
    color: '#dc3545',
    margin: '0.25rem 0',
  },
  warning: {
    color: '#ffc107',
    margin: '0.25rem 0',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  success: {
    backgroundColor: '#efe',
    color: '#3c3',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
};

export default UserDashboard;
