import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { allocateBudgetByCategory } from '../utils/budgetAllocation';
import { checkCompatibility } from '../utils/compatibilityChecker';
import '../styles/user-dashboard.css';

/* ===== SVG Nav Icons (Feather-style stroke icons) ===== */
const IconBrowse = () => (
  <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const IconCreateBuild = () => (
  <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const IconMyBuilds = () => (
  <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
);
const IconPayments = () => (
  <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
);
const IconProfile = () => (
  <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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
  { key: 'components', label: 'Browse Components', icon: IconBrowse },
  { key: 'create',     label: 'Create Build',     icon: IconCreateBuild },
  { key: 'builds',     label: 'My Builds',        icon: IconMyBuilds },
];

const LINK_ITEMS = [
  { to: '/payments', label: 'Payments', icon: IconPayments },
  { to: '/profile',  label: 'Profile',  icon: IconProfile },
];

/* ============================================================
   Main User Dashboard
   ============================================================ */
function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('components');
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
    components: 'Browse Components',
    create: 'Create Build',
    builds: 'My Builds',
  };

  return (
    <div className="user-page">
      {/* Mobile hamburger */}
      <button className="user-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <IconMenu />
      </button>

      {/* Overlay (mobile) */}
      <div
        className={`user-sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`user-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="user-sidebar-header">
          <div className="user-sidebar-logo">PC Build</div>
          <div className="user-sidebar-subtitle">User Dashboard</div>
        </div>

        <nav className="user-sidebar-nav">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`user-nav-item${activeTab === key ? ' active' : ''}`}
              onClick={() => handleNavClick(key)}
            >
              <span className="user-nav-icon"><Icon /></span>
              <span className="user-nav-label">{label}</span>
            </button>
          ))}

          {LINK_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="user-nav-item" style={{ textDecoration: 'none' }}>
              <span className="user-nav-icon"><Icon /></span>
              <span className="user-nav-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="user-sidebar-footer">
          <button className="user-nav-item" onClick={handleLogout}>
            <span className="user-nav-icon"><IconLogout /></span>
            <span className="user-nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="user-main">
        <header className="user-page-header">
          <div>
            <h1 className="user-page-title">{pageTitleMap[activeTab] || 'Dashboard'}</h1>
            <p className="user-page-subtitle">Dashboard &rsaquo; {pageTitleMap[activeTab]}</p>
          </div>
          <div className="user-profile-section">
            <div className="user-profile-info">
              <span className="user-profile-name">{user?.name || user?.email}</span>
              <span className="user-profile-role">{user?.role}</span>
            </div>
            <div className="user-profile-avatar">{userInitials}</div>
          </div>
        </header>

        <div className="user-content">
          {activeTab === 'components' && <ComponentsList />}
          {activeTab === 'create' && <BuildCreator />}
          {activeTab === 'builds' && <MyBuilds />}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   Components List
   ============================================================ */
function ComponentsList() {
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchComponents();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [componentsRes, categoriesRes] = await Promise.all([
        api.get('/components'),
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

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const url = selectedCategory ? `/components?category=${selectedCategory}` : '/components';
      const res = await api.get(url);
      setComponents(res.data.data);
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeCategories = categories
    .filter((cat) => cat.isActive !== false)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const filteredComponents = components.filter((component) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      component.name.toLowerCase().includes(search) ||
      component.category.toLowerCase().includes(search) ||
      component.specifications.toLowerCase().includes(search)
    );
  });

  const getCategoryCount = (categoryName) => {
    if (!categoryName) return components.length;
    return components.filter((c) => (c.category || '').toUpperCase() === categoryName.toUpperCase()).length;
  };

  if (loading && components.length === 0) {
    return <div className="user-loading">Loading components...</div>;
  }

  return (
    <div>
      <h2 className="user-section-title">Browse Components</h2>

      <div className="user-browse-layout">
        {/* Left Sidebar - Category Filter */}
        <div className="user-filter-sidebar">
          <h3 className="user-filter-sidebar-title">Categories</h3>

          <div className="user-search-box">
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search-input"
            />
          </div>

          <ul className="user-category-list">
            <li
              className={`user-category-item${selectedCategory === null ? ' active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <div className="user-category-item-content">
                <span className="user-category-name">All Categories</span>
                <span className="user-count-badge">{components.length}</span>
              </div>
            </li>
            {activeCategories.map((category) => {
              const count = getCategoryCount(category.name);
              return (
                <li
                  key={category._id}
                  className={`user-category-item${selectedCategory === category.name ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <div className="user-category-item-content">
                    <span className="user-category-name">{category.name}</span>
                    <span className="user-count-badge">{count}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="user-filter-info">
            <p className="user-filter-info-text">
              {selectedCategory ? `Showing ${filteredComponents.length} ${selectedCategory} components` : `Showing ${filteredComponents.length} components`}
            </p>
          </div>
        </div>

        {/* Right Side - Components Table */}
        <div className="user-components-container">
          {loading ? (
            <div className="user-loading">Loading components...</div>
          ) : filteredComponents.length === 0 ? (
            <div className="user-no-results">
              <p>No components found.</p>
              {searchTerm && (
                <p className="user-help-text">Try adjusting your search term or select a different category.</p>
              )}
            </div>
          ) : (
            <div className="user-table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Priority</th>
                    <th>Stock</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComponents.map((component) => (
                    <tr key={component._id}>
                      <td>
                        {component.url ? (
                          <img
                            src={component.url}
                            alt={component.name}
                            className="user-component-image"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="user-no-image">No Image</div>
                        )}
                      </td>
                      <td>{component.name}</td>
                      <td>{component.category}</td>
                      <td>${Number(component.price || 0).toFixed(2)}</td>
                      <td>{component.priority ?? 1}</td>
                      <td>
                        {component.stockStatus ? (
                          <span className="user-badge user-badge-in-stock">In Stock</span>
                        ) : (
                          <span className="user-badge user-badge-out-of-stock">Out of Stock</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => alert(`${component.name}\n\n${component.specifications || 'No specifications'}\n\nSocket: ${component.socket || 'N/A'}`)}
                          className="user-btn user-btn-outline user-btn-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Build Creator with Budget Allocation and Compatibility
   ============================================================ */
function BuildCreator() {
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [totalBudget, setTotalBudget] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [buildResult, setBuildResult] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
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

  const filterComponents = () => {};

  const getBudgetAllocation = () => {
    if (!totalBudget || categories.length === 0) return null;
    return allocateBudgetByCategory(Number(totalBudget), categories, selectedComponents);
  };

  const formatBudgetRange = (alloc) => {
    if (!alloc) return '';
    if (alloc.minBudget === 0) return `Up to $${alloc.maxBudget.toFixed(0)}`;
    return `$${alloc.minBudget.toFixed(0)} - $${alloc.maxBudget.toFixed(0)}`;
  };

  const formatBudgetRangeDecimal = (alloc) => {
    if (!alloc) return '';
    if (alloc.minBudget === 0) return `Up to $${alloc.maxBudget.toFixed(2)}`;
    return `$${alloc.minBudget.toFixed(2)} - $${alloc.maxBudget.toFixed(2)}`;
  };

  const getFilteredComponents = (categoryName) => {
    const categoryComponents = components.filter((comp) => {
      if (!comp.stockStatus) return false;
      return (comp.category || '').toUpperCase() === categoryName.toUpperCase();
    });

    if (categoryName.toUpperCase() === 'MOTHERBOARD') {
      console.log('🔍 Motherboard Debug:', {
        totalComponents: components.length,
        categoryComponents: categoryComponents.length,
        sampleCategories: components.slice(0, 5).map(c => c.category),
        categoryName,
      });
    }

    if (!totalBudget || categories.length === 0) return categoryComponents;

    const budgetAlloc = getBudgetAllocation();
    if (!budgetAlloc) return categoryComponents;

    const categoryAlloc = budgetAlloc.allocations.find(
      (a) => a.categoryName.toUpperCase() === categoryName.toUpperCase()
    );

    if (!categoryAlloc) {
      console.log('⚠️ No allocation found for category:', categoryName);
      return categoryComponents;
    }

    const maxBudget = categoryAlloc.maxBudget || 0;
    const fallbackMax = totalBudget && categories.length > 0
      ? (Number(totalBudget) / categories.length) * 1.5
      : Infinity;
    const effectiveMaxBudget = maxBudget > 0 ? maxBudget : fallbackMax;
    const maxPrice = effectiveMaxBudget * 1.1;

    const budgetFiltered = categoryComponents.filter((comp) => {
      const price = Number(comp.price) || 0;
      return price >= 0 && price <= maxPrice;
    });

    if (categoryName.toUpperCase() === 'MOTHERBOARD') {
      console.log('💰 Budget Filter Debug:', {
        categoryAlloc, maxBudget, effectiveMaxBudget, maxPrice,
        budgetFiltered: budgetFiltered.length,
        samplePrices: categoryComponents.slice(0, 3).map(c => c.price),
      });
    }

    const compatibilityFiltered = budgetFiltered.map((comp) => {
      if (selectedComponents.length === 0) {
        comp._compatibility = { isCompatible: true, issues: [], warnings: [] };
        return comp;
      }

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
      comp._compatibility = compatCheck;

      if (categoryName.toUpperCase() === 'MOTHERBOARD') {
        if (!compatCheck.isCompatible) {
          console.log('❌ Compatibility Issue:', {
            component: comp.name, price: comp.price, socket: comp.socket,
            issues: compatCheck.issues, warnings: compatCheck.warnings,
            isCompatible: compatCheck.isCompatible,
            selectedCPU: selectedComponents.find(c => (c.category || '').toUpperCase() === 'CPU'),
          });
        } else {
          console.log('✅ Compatible:', { component: comp.name, warnings: compatCheck.warnings.length });
        }
      }

      return comp;
    });

    if (categoryName.toUpperCase() === 'MOTHERBOARD') {
      console.log('✅ Final Motherboard Filter:', {
        afterCompatibility: compatibilityFiltered.length,
        selectedComponents: selectedComponents.length,
      });
    }

    return compatibilityFiltered;
  };

  const toggleComponent = (component) => {
    setSelectedComponents((prev) => {
      const exists = prev.find((c) => c._id === component._id);
      if (exists) {
        return prev.filter((c) => c._id !== component._id);
      }
      const categoryExists = prev.find((c) => (c.category || '').toUpperCase() === (component.category || '').toUpperCase());
      if (categoryExists) {
        setMessage(`Replacing ${component.category} selection...`);
        setTimeout(() => setMessage(''), 2000);
        return prev.filter((c) => (c.category || '').toUpperCase() !== (component.category || '').toUpperCase()).concat(component);
      }
      return [...prev, component];
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
      setBuildResult(res.data.data || res.data);
      setSelectedComponents([]);
      setTotalBudget('');
      setMessage('Build created successfully! Check compatibility details below.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating build');
    } finally {
      setSaving(false);
    }
  };

  const payForBuild = async (buildId) => {
    try {
      setPaymentLoading(true);
      setPaymentMessage('');
      const res = await api.post(`/builds/${buildId}/pay`, { method: 'card-sim' });
      setPaymentMessage(res.data.message || 'Payment completed');
      setPaymentSuccess(true);
      if (res.data.data) setBuildResult(res.data.data);
    } catch (error) {
      setPaymentMessage(error.response?.data?.message || 'Payment failed');
      setPaymentSuccess(false);
    } finally {
      setPaymentLoading(false);
    }
  };

  const totalPrice = selectedComponents.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
  const budgetAlloc = getBudgetAllocation();
  const compatibilityCheck = selectedComponents.length > 0 ? checkCompatibility(selectedComponents) : null;

  if (loading) {
    return <div className="user-loading">Loading components...</div>;
  }

  const activeCategories = categories
    .filter((cat) => cat.isActive !== false)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const renderComponentTable = (categoryName) => {
    const filteredComps = getFilteredComponents(categoryName);
    const selected = selectedComponents.find(
      (c) => (c.category || '').toUpperCase() === (categoryName || '').toUpperCase()
    );
    const alloc = budgetAlloc?.allocations.find((a) => a.categoryName === categoryName);

    return (
      <div key={categoryName} className="user-category-group">
        <h4>
          {categoryName}
          {alloc && <span className="user-budget-badge">{formatBudgetRange(alloc)}</span>}
        </h4>
        {filteredComps.length === 0 ? (
          <p className="user-no-components">
            {totalBudget ? 'No compatible components within budget range' : 'No components available'}
          </p>
        ) : (
          <div className="user-table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Specs</th>
                  <th>Compatibility</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredComps.map((component) => {
                  const compatCheck = component._compatibility || (() => {
                    const testBuild = [...selectedComponents];
                    const idx = testBuild.findIndex(
                      (s) => (s.category || '').toUpperCase() === (categoryName || '').toUpperCase()
                    );
                    if (idx >= 0) testBuild[idx] = component;
                    else testBuild.push(component);
                    return checkCompatibility(testBuild);
                  })();
                  const isSelected = selected?._id === component._id;

                  return (
                    <tr key={component._id} className={isSelected ? 'selected-row' : ''}>
                      <td>
                        <input
                          type="radio"
                          name={categoryName}
                          checked={isSelected}
                          onChange={() => toggleComponent(component)}
                          disabled={!compatCheck.isCompatible && !isSelected}
                        />
                      </td>
                      <td>
                        {component.url ? (
                          <img src={component.url} alt={component.name} className="user-component-image" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div className="user-no-image">No Image</div>
                        )}
                      </td>
                      <td>{component.name}</td>
                      <td>${Number(component.price || 0).toFixed(2)}</td>
                      <td className="user-small-text">{component.specifications}</td>
                      <td>
                        {!compatCheck.isCompatible && !isSelected ? (
                          <span className="user-badge user-badge-incompatible">Incompatible</span>
                        ) : (
                          <span className="user-badge user-badge-compatible">
                            {compatCheck.isCompatible ? 'Compatible' : 'Selected'}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleComponent(component)}
                          className={`user-btn user-btn-sm ${isSelected ? 'user-btn-danger' : 'user-btn-outline'}`}
                        >
                          {isSelected ? 'Remove' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="user-section-title">Build Your PC</h2>

      <div className="user-budget-section">
        <label className="user-budget-label">
          <strong>Total Budget ($):</strong>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            min="0"
            step="100"
            className="user-budget-input"
            placeholder="Enter your budget"
          />
        </label>
        {budgetAlloc && (
          <div className="user-budget-info">
            <span>Spent: ${budgetAlloc.spent.toFixed(2)}</span>
            <span>Remaining: ${budgetAlloc.remaining.toFixed(2)}</span>
          </div>
        )}
      </div>

      {message && (
        <div className={message.includes('Error') ? 'user-alert-error' : 'user-alert-success'}>
          {message}
        </div>
      )}

      {compatibilityCheck && (
        <div className="user-compatibility-result">
          <h3>Compatibility Check</h3>
          <p><strong>{compatibilityCheck.summary}</strong></p>
          {compatibilityCheck.issues.length > 0 && (
            <div>
              <h4>Issues:</h4>
              <ul>
                {compatibilityCheck.issues.map((issue, i) => (
                  <li key={i} className="user-issue">{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {compatibilityCheck.warnings.length > 0 && (
            <div>
              <h4>Warnings:</h4>
              <ul>
                {compatibilityCheck.warnings.map((warning, i) => (
                  <li key={i} className="user-warning">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="user-build-creator">
        {/* Left Sidebar */}
        <div className="user-filter-sidebar">
          <h3 className="user-filter-sidebar-title">Categories</h3>
          <ul className="user-category-list">
            <li
              className={`user-category-item${selectedCategory === null ? ' active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <span>All Categories</span>
            </li>
            {activeCategories.map((category) => {
              const sel = selectedComponents.find(
                (c) => (c.category || '').toUpperCase() === (category.name || '').toUpperCase()
              );
              const alloc = budgetAlloc?.allocations.find((a) => a.categoryName === category.name);
              const filteredComps = getFilteredComponents(category.name);

              return (
                <li
                  key={category._id}
                  className={`user-category-item${selectedCategory === category.name ? ' active' : ''}${sel ? ' has-selection' : ''}`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <div className="user-category-item-content">
                    <span className="user-category-name">{category.name}</span>
                    {sel && <span className="user-selected-check">✓</span>}
                    {alloc && <span className="user-budget-badge-small">{formatBudgetRange(alloc)}</span>}
                    <span className="user-count-badge">{filteredComps.length}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="user-selected-summary">
            <h4>Selected ({selectedComponents.length})</h4>
            {selectedComponents.length > 0 ? (
              <div className="user-selected-summary-list">
                {selectedComponents.map((comp) => (
                  <div key={comp._id} className="user-selected-summary-item">
                    <span className="user-selected-summary-name">{comp.name}</span>
                    <span className="user-selected-summary-price">${comp.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="user-selected-summary-total">
                  <strong>Total: ${totalPrice.toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              <p className="user-no-selection-text">No components selected</p>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="user-main-content">
          {buildResult && (
            <div className="user-build-result">
              <div className="user-build-result-header">
                <div>
                  <h5>Build Created</h5>
                  <div className="user-muted">Build ID: {buildResult._id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1a1a2e' }}>
                    ${Number(buildResult.totalPrice || 0).toFixed(2)}
                  </div>
                  <div className="user-muted">Payment: {buildResult.payment?.status || 'pending'}</div>
                </div>
              </div>
              <div className="user-toolbar" style={{ marginTop: '1rem' }}>
                {buildResult.payment?.status !== 'paid' ? (
                  <button className="user-btn user-btn-success" onClick={() => payForBuild(buildResult._id)} disabled={paymentLoading}>
                    {paymentLoading ? 'Processing...' : 'Pay Now'}
                  </button>
                ) : (
                  <button className="user-btn user-btn-secondary" disabled>Paid</button>
                )}
                {paymentMessage && <span className="user-small-text">{paymentMessage}</span>}
              </div>
            </div>
          )}

          <div className="user-selected-section">
            <h3>Selected Components ({selectedComponents.length})</h3>
            {selectedComponents.length === 0 ? (
              <p className="user-help-text">
                {totalBudget ? 'Select components from the list below.' : 'Enter a budget to start.'}
              </p>
            ) : (
              <div>
                {activeCategories.map((cat) => {
                  const comp = selectedComponents.find((c) => (c.category || '').toUpperCase() === (cat.name || '').toUpperCase());
                  const alloc = budgetAlloc?.allocations.find((a) => a.categoryName === cat.name);
                  return comp ? (
                    <div key={cat._id} className="user-selected-item">
                      <div>
                        <strong>{cat.name}:</strong> {comp.name}
                        <br />
                        <span className="user-price">${comp.price.toFixed(2)}</span>
                        {alloc && <span className="user-budget-range">(Budget: {formatBudgetRangeDecimal(alloc)})</span>}
                      </div>
                      <button onClick={() => toggleComponent(comp)} className="user-btn user-btn-danger user-btn-sm">Remove</button>
                    </div>
                  ) : (
                    <div key={cat._id} className="user-unselected-item">
                      <strong>{cat.name}:</strong> Not selected
                      {alloc && <div className="user-budget-range">Budget: {formatBudgetRangeDecimal(alloc)}</div>}
                    </div>
                  );
                })}
                <div className="user-total-price">
                  <strong>Total Price: ${totalPrice.toFixed(2)}</strong>
                  {totalBudget && (
                    <div>
                      <span className={totalPrice > Number(totalBudget) ? 'user-over-budget' : 'user-under-budget'}>
                        {totalPrice > Number(totalBudget) ? 'Over budget' : 'Under budget'}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={createBuild}
                  disabled={saving || (totalBudget && totalPrice > Number(totalBudget))}
                  className="user-btn user-btn-primary"
                  style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
                >
                  {saving ? 'Saving...' : 'Save Build'}
                </button>
              </div>
            )}
          </div>

          <div className="user-components-section">
            <h3 className="user-section-title">
              {selectedCategory ? `${selectedCategory} Components` : 'Available Components'}
            </h3>
            {!totalBudget && (
              <p className="user-help-text">Enter a budget above to see filtered components based on category priorities.</p>
            )}
            {selectedCategory
              ? renderComponentTable(selectedCategory)
              : activeCategories.map((category) => renderComponentTable(category.name))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   My Builds
   ============================================================ */
function MyBuilds() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [payLoadingMap, setPayLoadingMap] = useState({});
  const [refundLoadingMap, setRefundLoadingMap] = useState({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

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
    if (!window.confirm('Are you sure you want to delete this build?')) return;
    try {
      await api.delete(`/builds/${id}`);
      setBuilds(builds.filter((b) => b._id !== id));
      if (selectedBuild?._id === id) setSelectedBuild(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting build');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return alert('No builds selected for deletion.');
    if (!window.confirm(`Delete ${selectedIds.length} selected build(s)? This action cannot be undone.`)) return;
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/builds/${id}`)));
      setBuilds((prev) => prev.filter((b) => !selectedIds.includes(b._id)));
      if (selectedBuild && selectedIds.includes(selectedBuild._id)) setSelectedBuild(null);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting selected builds');
    }
  };

  const payForBuildLocal = async (buildId) => {
    try {
      setPayLoadingMap((m) => ({ ...m, [buildId]: true }));
      const res = await api.post(`/builds/${buildId}/pay`, { method: 'card-sim' });
      const updated = res.data.data || res.data;
      setBuilds((prev) => prev.map((b) => (b._id === buildId ? updated : b)));
      if (selectedBuild && selectedBuild._id === buildId) setSelectedBuild(updated);
      alert(res.data.message || 'Payment successful (simulated)');
    } catch (error) {
      alert(error.response?.data?.message || 'Payment failed');
    } finally {
      setPayLoadingMap((m) => ({ ...m, [buildId]: false }));
    }
  };

  const requestRefund = async (buildId) => {
    const build = builds.find((b) => b._id === buildId);
    if (!build) return;

    if (build.assemblyStatus === 'Completed') {
      alert('Refunds are not allowed for completed builds.');
      return;
    }
    if (build.payment?.status === 'refunded') {
      alert('This build has already been refunded.');
      return;
    }

    const pendingRequest = (build.refundRequests || []).find(
      (req) => req.status === 'requested' || req.status === 'approved'
    );
    if (pendingRequest) {
      alert('A refund request is already pending for this build.');
      return;
    }

    const confirmed = window.confirm(
      `Request refund for this build?\n\n` +
      `You will receive 90% of your payment ($${(build.payment?.escrowAmount || 0).toFixed(2)}) if approved.\n` +
      `3% admin commission and 7% assembler commission are non-refundable.`
    );
    if (!confirmed) return;

    const reason = window.prompt('Reason for refund (optional):', '') || '';

    try {
      setRefundLoadingMap((m) => ({ ...m, [buildId]: true }));
      const res = await api.post(`/builds/${buildId}/request-refund`, { reason });
      const updated = res.data.data;
      setBuilds((prev) => prev.map((b) => (b._id === buildId ? updated : b)));
      if (selectedBuild && selectedBuild._id === buildId) setSelectedBuild(updated);
      alert(res.data.message || 'Refund request submitted');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting refund request');
    } finally {
      setRefundLoadingMap((m) => ({ ...m, [buildId]: false }));
    }
  };

  const statusBadgeClass = (status) => {
    if (status === 'Completed') return 'user-badge user-badge-completed';
    if (status === 'Assembling') return 'user-badge user-badge-assembling';
    return 'user-badge user-badge-pending';
  };

  if (loading) {
    return <div className="user-loading">Loading builds...</div>;
  }

  return (
    <div>
      <div className="user-section-header">
        <h2 className="user-section-title">My Builds ({builds.length})</h2>
        <div className="user-toolbar">
          {!selectionMode ? (
            <button onClick={() => { setSelectionMode(true); setSelectedIds([]); }} className="user-btn user-btn-danger">
              Delete
            </button>
          ) : (
            <>
              <button onClick={deleteSelected} className="user-btn user-btn-danger" disabled={selectedIds.length === 0}>
                Confirm Delete ({selectedIds.length})
              </button>
              <button onClick={() => { setSelectionMode(false); setSelectedIds([]); }} className="user-btn user-btn-secondary">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {selectedBuild && (
        <div className="user-build-details">
          <button onClick={() => setSelectedBuild(null)} className="user-close-btn">Close</button>
          <h3>Build Details</h3>
          <p><strong>Status:</strong> <span className={statusBadgeClass(selectedBuild.assemblyStatus)}>{selectedBuild.assemblyStatus}</span></p>
          <p><strong>Total Price:</strong> ${selectedBuild.totalPrice.toFixed(2)}</p>
          <p><strong>Payment Status:</strong> {selectedBuild.payment?.status || 'pending'}</p>
          <p><strong>Compatible:</strong> {selectedBuild.isCompatible ? 'Yes' : 'No'}</p>

          {selectedBuild.payment?.status === 'paid' && selectedBuild.assemblyStatus !== 'Completed' && (
            <div className="user-refund-info">
              <p><strong>Refund Information:</strong></p>
              <p>You can request a refund. You will receive 90% of your payment (${(selectedBuild.payment?.escrowAmount || 0).toFixed(2)}).</p>
              <p className="user-small-text">Note: 3% admin commission and 7% assembler commission are non-refundable.</p>
              {selectedBuild.refundRequests && selectedBuild.refundRequests.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p><strong>Refund Requests:</strong></p>
                  {selectedBuild.refundRequests.map((req, i) => (
                    <div key={i} style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
                      <p>Status: <strong>{req.status}</strong> | Amount: ${req.amount?.toFixed(2) || '0.00'}</p>
                      {req.reason && <p>Reason: {req.reason}</p>}
                      {req.createdAt && <p>Requested: {new Date(req.createdAt).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedBuild.assemblyStatus === 'Completed' && (
            <div className="user-completed-info">
              <p>This build is completed. Refunds are no longer available.</p>
            </div>
          )}

          {selectedBuild.compatibilityCheck && (
            <div className="user-compatibility-result">
              <h4>Compatibility Check</h4>
              <p>{selectedBuild.compatibilityCheck.summary}</p>
              {selectedBuild.compatibilityCheck.issues?.length > 0 && (
                <ul>
                  {selectedBuild.compatibilityCheck.issues.map((issue, i) => (
                    <li key={i} className="user-issue">{issue}</li>
                  ))}
                </ul>
              )}
              {selectedBuild.compatibilityCheck.warnings?.length > 0 && (
                <ul>
                  {selectedBuild.compatibilityCheck.warnings.map((warning, i) => (
                    <li key={i} className="user-warning">{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <h4>Components:</h4>
          <ul>
            {selectedBuild.components.map((comp, i) => (
              <li key={i}>{comp.componentName} ({comp.category}) - ${comp.price.toFixed(2)}</li>
            ))}
          </ul>

          <p className="user-small-text">Created: {new Date(selectedBuild.createdAt).toLocaleString()}</p>
        </div>
      )}

      {builds.length === 0 ? (
        <p className="user-help-text">No builds yet. Create your first build!</p>
      ) : (
        <div className="user-builds-grid">
          {builds.map((build) => (
            <div
              key={build._id}
              className={`user-build-card${selectedIds.includes(build._id) ? ' selected-for-delete' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {selectionMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(build._id)}
                    onChange={() => toggleSelect(build._id)}
                    style={{ marginTop: 6 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3>Build #{builds.indexOf(build) + 1}</h3>
                  <p><strong>Price:</strong> ${build.totalPrice.toFixed(2)}</p>
                  <p><strong>Status:</strong> <span className={statusBadgeClass(build.assemblyStatus)}>{build.assemblyStatus}</span></p>
                  <p><strong>Components:</strong> {build.components.length}</p>
                  <p className="user-small-text">{new Date(build.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="user-build-actions">
                <button onClick={() => setSelectedBuild(build)} className="user-btn user-btn-outline user-btn-sm">
                  View Details
                </button>
                {build.payment?.status !== 'paid' ? (
                  <button
                    onClick={() => payForBuildLocal(build._id)}
                    className="user-btn user-btn-success user-btn-sm"
                    disabled={!!payLoadingMap[build._id]}
                  >
                    {payLoadingMap[build._id] ? 'Processing...' : 'Pay'}
                  </button>
                ) : build.payment?.status === 'refunded' ? (
                  <button className="user-btn user-btn-secondary user-btn-sm" disabled>Refunded</button>
                ) : (() => {
                  const pendingRequest = (build.refundRequests || []).find(
                    (req) => req.status === 'requested' || req.status === 'approved'
                  );
                  const isCompleted = build.assemblyStatus === 'Completed';

                  if (pendingRequest) {
                    return (
                      <button className="user-btn user-btn-warning user-btn-sm" disabled title={`Refund request ${pendingRequest.status}`}>
                        Refund {pendingRequest.status === 'requested' ? 'Pending' : 'Approved'}
                      </button>
                    );
                  } else if (isCompleted) {
                    return (
                      <button className="user-btn user-btn-secondary user-btn-sm" disabled title="Refunds not allowed for completed builds">
                        Paid
                      </button>
                    );
                  } else {
                    return (
                      <button
                        onClick={() => requestRefund(build._id)}
                        className="user-btn user-btn-warning user-btn-sm"
                        disabled={!!refundLoadingMap[build._id]}
                      >
                        {refundLoadingMap[build._id] ? 'Processing...' : 'Request Refund'}
                      </button>
                    );
                  }
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
