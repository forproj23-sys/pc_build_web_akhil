import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { allocateBudgetByCategory } from '../utils/budgetAllocation';
import { checkCompatibility } from '../utils/compatibilityChecker';

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

// Build Creator Component with Budget Allocation and Compatibility Filtering
function BuildCreator() {
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [totalBudget, setTotalBudget] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [buildResult, setBuildResult] = useState(null);


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Re-filter components when budget or selections change
    if (totalBudget && categories.length > 0) {
      filterComponents();
    }
  }, [totalBudget, selectedComponents, categories]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [componentsRes, categoriesRes] = await Promise.all([
        api.get('/components?stockStatus=true'),
        api.get('/categories'),
      ]);
      setComponents(componentsRes.data.data);
      setCategories(categoriesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterComponents = () => {
    // This will be handled in render - components are filtered dynamically
  };

  const getBudgetAllocation = () => {
    if (!totalBudget || categories.length === 0) return null;
    return allocateBudgetByCategory(Number(totalBudget), categories, selectedComponents);
  };

  const getFilteredComponents = (categoryName) => {
    if (!totalBudget || categories.length === 0) {
      return components.filter((c) => (c.category || '').toUpperCase() === categoryName.toUpperCase());
    }

    const budgetAlloc = getBudgetAllocation();
    if (!budgetAlloc) return [];

    const categoryAlloc = budgetAlloc.allocations.find(
      (a) => a.categoryName.toUpperCase() === categoryName.toUpperCase()
    );

    if (!categoryAlloc) return [];

    // Filter by budget range (with 10% flexibility)
    const budgetFiltered = components.filter((comp) => {
      if (!comp.stockStatus) return false;
      const compCategory = (comp.category || '').toUpperCase();
      if (compCategory !== categoryName.toUpperCase()) return false;

      const price = Number(comp.price) || 0;
      const minPrice = categoryAlloc.minBudget * 0.9;
      const maxPrice = categoryAlloc.maxBudget * 1.1;
      return price >= minPrice && price <= maxPrice;
    });

    // Filter by compatibility
    return budgetFiltered.filter((comp) => {
      if (selectedComponents.length === 0) return true;

      const testBuild = [...selectedComponents];
      const existingInCategory = testBuild.findIndex(
        (s) => (s.category || '').toUpperCase() === categoryName.toUpperCase()
      );

      if (existingInCategory >= 0) {
        testBuild[existingInCategory] = comp;
      } else {
        testBuild.push(comp);
      }

      const compatCheck = checkCompatibility(testBuild);
      return compatCheck.isCompatible;
    });
  };

  const toggleComponent = (component) => {
    setSelectedComponents((prev) => {
      const exists = prev.find((c) => c._id === component._id);
      if (exists) {
        return prev.filter((c) => c._id !== component._id);
      } else {
        const categoryExists = prev.find((c) => (c.category || '').toUpperCase() === (component.category || '').toUpperCase());
        if (categoryExists) {
          setMessage(`Replacing ${component.category} selection...`);
          setTimeout(() => setMessage(''), 2000);
          return prev.filter((c) => (c.category || '').toUpperCase() !== (component.category || '').toUpperCase()).concat(component);
        }
        return [...prev, component];
      }
    });
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
      setTotalBudget('');
      setMessage('Build created successfully! Check compatibility details below.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating build');
    } finally {
      setSaving(false);
    }
  };

  const totalPrice = selectedComponents.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  const budgetAlloc = getBudgetAllocation();
  const compatibilityCheck = selectedComponents.length > 0 ? checkCompatibility(selectedComponents) : null;

  if (loading) {
    return <div style={styles.loading}>Loading components...</div>;
  }

  const activeCategories = categories.filter((cat) => cat.isActive !== false);

  return (
    <div>
      <h2>Build Your PC</h2>
      
      <div style={styles.budgetSection}>
        <label style={styles.budgetLabel}>
          <strong>Total Budget ($):</strong>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            min="0"
            step="100"
            style={styles.budgetInput}
            placeholder="Enter your budget"
          />
        </label>
        {budgetAlloc && (
          <div style={styles.budgetInfo}>
            <span>Spent: ${budgetAlloc.spent.toFixed(2)}</span>
            <span>Remaining: ${budgetAlloc.remaining.toFixed(2)}</span>
          </div>
        )}
      </div>

      {message && (
        <div style={message.includes('Error') ? styles.error : styles.success}>
          {message}
        </div>
      )}

      {compatibilityCheck && (
        <div style={styles.compatibilityResult}>
          <h3>Compatibility Check</h3>
          <p><strong>{compatibilityCheck.summary}</strong></p>
          {compatibilityCheck.issues.length > 0 && (
            <div>
              <h4>Issues:</h4>
              <ul>
                {compatibilityCheck.issues.map((issue, i) => (
                  <li key={i} style={styles.issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {compatibilityCheck.warnings.length > 0 && (
            <div>
              <h4>Warnings:</h4>
              <ul>
                {compatibilityCheck.warnings.map((warning, i) => (
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
            <p>No components selected. {totalBudget ? 'Select components from the list below.' : 'Enter a budget to start.'}</p>
          ) : (
            <div>
              {activeCategories.map((cat) => {
                const comp = selectedComponents.find((c) => (c.category || '').toUpperCase() === (cat.name || '').toUpperCase());
                const alloc = budgetAlloc?.allocations.find((a) => a.categoryName === cat.name);
                return comp ? (
                  <div key={cat._id} style={styles.selectedItem}>
                    <div>
                      <strong>{cat.name}:</strong> {comp.name}
                      <br />
                      <span style={styles.price}>${comp.price.toFixed(2)}</span>
                      {alloc && (
                        <span style={styles.budgetRange}>
                          (Budget: ${alloc.minBudget.toFixed(2)} - ${alloc.maxBudget.toFixed(2)})
                        </span>
                      )}
                    </div>
                    <button onClick={() => toggleComponent(comp)} style={styles.removeBtn}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div key={cat._id} style={styles.unselectedItem}>
                    <strong>{cat.name}:</strong> Not selected
                    {alloc && (
                      <div style={styles.budgetRange}>
                        Budget: ${alloc.minBudget.toFixed(2)} - ${alloc.maxBudget.toFixed(2)}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={styles.totalPrice}>
                <strong>Total Price: ${totalPrice.toFixed(2)}</strong>
                {totalBudget && (
                  <div>
                    <span style={totalPrice > Number(totalBudget) ? styles.overBudget : styles.underBudget}>
                      {totalPrice > Number(totalBudget) ? 'Over budget' : 'Under budget'}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={createBuild}
                disabled={saving || (totalBudget && totalPrice > Number(totalBudget))}
                style={styles.createButton}
              >
                {saving ? 'Saving...' : 'Save Build'}
              </button>
            </div>
          )}
        </div>

        <div style={styles.componentsSection}>
          <h3>Available Components</h3>
          {!totalBudget && (
            <p style={styles.helpText}>Enter a budget above to see filtered components based on category priorities.</p>
          )}
          {activeCategories.map((category) => {
            const filteredComps = getFilteredComponents(category.name);
            const selected = selectedComponents.find(
              (c) => (c.category || '').toUpperCase() === (category.name || '').toUpperCase()
            );
            const alloc = budgetAlloc?.allocations.find((a) => a.categoryName === category.name);

            return (
              <div key={category._id} style={styles.categoryGroup}>
                <h4>
                  {category.name}
                  {alloc && (
                    <span style={styles.budgetBadge}>
                      ${alloc.minBudget.toFixed(0)} - ${alloc.maxBudget.toFixed(0)}
                    </span>
                  )}
                </h4>
                {filteredComps.length === 0 ? (
                  <p style={styles.noComponents}>
                    {totalBudget ? 'No compatible components within budget range' : 'No components available'}
                  </p>
                ) : (
                  filteredComps.map((component) => {
                    const testBuild = [...selectedComponents];
                    const existingInCategory = testBuild.findIndex(
                      (s) => (s.category || '').toUpperCase() === (category.name || '').toUpperCase()
                    );
                    if (existingInCategory >= 0) {
                      testBuild[existingInCategory] = component;
                    } else {
                      testBuild.push(component);
                    }
                    const compatCheck = checkCompatibility(testBuild);
                    const isSelected = selected?._id === component._id;

                    return (
                      <div
                        key={component._id}
                        style={{
                          ...styles.componentOption,
                          ...(isSelected ? styles.selectedOption : {}),
                          ...(!compatCheck.isCompatible ? styles.incompatibleOption : {}),
                        }}
                      >
                        <input
                          type="radio"
                          name={category.name}
                          checked={isSelected}
                          onChange={() => toggleComponent(component)}
                          disabled={!compatCheck.isCompatible && !isSelected}
                        />
                        <div style={styles.optionDetails}>
                          <strong>{component.name}</strong> - ${component.price.toFixed(2)}
                          <p style={styles.smallText}>{component.specifications}</p>
                          {!compatCheck.isCompatible && !isSelected && (
                            <span style={styles.incompatibleBadge}>Incompatible</span>
                          )}
                        </div>
                      </div>
                    );
                  })
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
  budgetSection: {
    backgroundColor: '#e7f3ff',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '2px solid #007bff',
  },
  budgetLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '1.1rem',
    marginBottom: '0.5rem',
  },
  budgetInput: {
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #007bff',
    width: '200px',
  },
  budgetInfo: {
    display: 'flex',
    gap: '2rem',
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#666',
  },
  budgetRange: {
    fontSize: '0.85rem',
    color: '#666',
    marginLeft: '0.5rem',
  },
  budgetBadge: {
    fontSize: '0.85rem',
    color: '#007bff',
    marginLeft: '1rem',
    fontWeight: 'normal',
  },
  unselectedItem: {
    padding: '0.75rem',
    marginBottom: '0.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    color: '#999',
  },
  price: {
    color: '#28a745',
    fontWeight: 'bold',
    marginLeft: '0.5rem',
  },
  overBudget: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  underBudget: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  incompatibleOption: {
    opacity: 0.6,
    borderColor: '#dc3545',
  },
  incompatibleBadge: {
    fontSize: '0.75rem',
    color: '#dc3545',
    backgroundColor: '#fee',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    marginLeft: '0.5rem',
  },
  helpText: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: '1rem',
  },
  noComponents: {
    color: '#999',
    fontStyle: 'italic',
    padding: '1rem',
  },
};

export default UserDashboard;
