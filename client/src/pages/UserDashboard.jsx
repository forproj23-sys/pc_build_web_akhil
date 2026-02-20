import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { allocateBudgetByCategory } from '../utils/budgetAllocation';
import { checkCompatibility } from '../utils/compatibilityChecker';
import TopNav from '../components/TopNav';

function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('components');

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
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Sort by priority (descending - higher priority first)

  // Filter components by search term
  const filteredComponents = components.filter((component) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      component.name.toLowerCase().includes(search) ||
      component.category.toLowerCase().includes(search) ||
      component.specifications.toLowerCase().includes(search)
    );
  });

  // Count components per category
  const getCategoryCount = (categoryName) => {
    if (!categoryName) return components.length;
    return components.filter((c) => (c.category || '').toUpperCase() === categoryName.toUpperCase()).length;
  };

  if (loading && components.length === 0) {
    return <div style={styles.loading}>Loading components...</div>;
  }

  return (
    <div>
      <h2>Browse Components</h2>
      
      <div style={styles.browseLayout}>
        {/* Left Sidebar - Category Filter List */}
        <div style={styles.filterSidebar}>
          <h3 style={styles.sidebarTitle}>Categories</h3>
          
          {/* Search Box */}
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={styles.searchInput}
            />
          </div>

          <ul style={styles.categoryList}>
            <li
              style={{
                ...styles.categoryListItem,
                ...(selectedCategory === null ? styles.activeCategoryItem : {}),
              }}
              onClick={() => setSelectedCategory(null)}
            >
              <div style={styles.categoryListItemContent}>
                <span style={styles.categoryName}>All Categories</span>
                <span style={styles.countBadge}>{components.length}</span>
              </div>
            </li>
            {activeCategories.map((category) => {
              const count = getCategoryCount(category.name);
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
                    <span style={styles.countBadge}>{count}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Filter Info */}
          <div style={styles.filterInfo}>
            <p style={styles.filterInfoText}>
              {selectedCategory ? `Showing ${filteredComponents.length} ${selectedCategory} components` : `Showing ${filteredComponents.length} components`}
            </p>
          </div>
        </div>

        {/* Right Side - Components Grid */}
        <div style={styles.componentsContainer}>
          {loading ? (
            <div style={styles.loading}>Loading components...</div>
          ) : filteredComponents.length === 0 ? (
            <div style={styles.noResults}>
              <p>No components found.</p>
              {searchTerm && (
                <p style={styles.helpText}>Try adjusting your search term or select a different category.</p>
              )}
            </div>
          ) : (
            <div className="table-responsive" style={styles.componentsTableWrapper}>
              <table className="table table-striped table-bordered table-hover align-middle" style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeaderCell}>Image</th>
                    <th style={styles.tableHeaderCell}>Name</th>
                    <th style={styles.tableHeaderCell}>Category</th>
                    <th style={styles.tableHeaderCell}>Price</th>
                    <th style={styles.tableHeaderCell}>Priority</th>
                    <th style={styles.tableHeaderCell}>Stock</th>
                    <th style={styles.tableHeaderCell}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComponents.map((component) => (
                    <tr key={component._id}>
                      <td style={styles.tableCell}>
                        {component.url ? (
                          <img
                            src={component.url}
                            alt={component.name}
                            style={styles.componentImage}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={styles.noImage}>No Image</div>
                        )}
                      </td>
                      <td style={styles.tableCell}>{component.name}</td>
                      <td style={styles.tableCell}>{component.category}</td>
                      <td style={styles.tableCell}>${Number(component.price || 0).toFixed(2)}</td>
                      <td style={styles.tableCell}>{component.priority ?? 1}</td>
                      <td style={styles.tableCell}>{component.stockStatus ? <span style={styles.inStock}>In Stock</span> : <span style={styles.outOfStock}>Out of Stock</span>}</td>
                      <td style={styles.tableCell}>
                        <button
                          onClick={() => alert(`${component.name}\n\n${component.specifications || 'No specifications'}\n\nSocket: ${component.socket || 'N/A'}`)}
                        className="btn btn-sm btn-outline-primary action-btn"
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
          )}
        </div>
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
  const [selectedCategory, setSelectedCategory] = useState(null); // For filtering
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

  // Helper to format budget range display
  const formatBudgetRange = (alloc) => {
    if (!alloc) return '';
    if (alloc.minBudget === 0) {
      return `Up to $${alloc.maxBudget.toFixed(0)}`;
    }
    return `$${alloc.minBudget.toFixed(0)} - $${alloc.maxBudget.toFixed(0)}`;
  };

  // Helper to format budget range with decimals
  const formatBudgetRangeDecimal = (alloc) => {
    if (!alloc) return '';
    if (alloc.minBudget === 0) {
      return `Up to $${alloc.maxBudget.toFixed(2)}`;
    }
    return `$${alloc.minBudget.toFixed(2)} - $${alloc.maxBudget.toFixed(2)}`;
  };

  const getFilteredComponents = (categoryName) => {
    // First filter by category and stock status
    const categoryComponents = components.filter((comp) => {
      if (!comp.stockStatus) return false;
      const compCategory = (comp.category || '').toUpperCase();
      return compCategory === categoryName.toUpperCase();
    });

    // Debug: Log category matching
    if (categoryName.toUpperCase() === 'MOTHERBOARD') {
      console.log('🔍 Motherboard Debug:', {
        totalComponents: components.length,
        categoryComponents: categoryComponents.length,
        sampleCategories: components.slice(0, 5).map(c => c.category),
        categoryName: categoryName,
      });
    }

    // If no budget is set, return all components in this category
    if (!totalBudget || categories.length === 0) {
      return categoryComponents;
    }

    const budgetAlloc = getBudgetAllocation();
    if (!budgetAlloc) {
      // If budget allocation fails, still show components (no budget filtering)
      return categoryComponents;
    }

    const categoryAlloc = budgetAlloc.allocations.find(
      (a) => a.categoryName.toUpperCase() === categoryName.toUpperCase()
    );

    // If no allocation found for this category, show all components (no budget filtering)
    if (!categoryAlloc) {
      console.log('⚠️ No allocation found for category:', categoryName);
      return categoryComponents;
    }

    // Filter by budget range
    // minPrice is always 0 to allow cheaper options (savings get reallocated)
    // maxPrice uses the allocated maxBudget with 10% flexibility
    // If maxBudget is 0 or very small, use a reasonable fallback (total budget / number of categories)
    const maxBudget = categoryAlloc.maxBudget || 0;
    const fallbackMax = totalBudget && categories.length > 0 
      ? (Number(totalBudget) / categories.length) * 1.5 
      : Infinity;
    const effectiveMaxBudget = maxBudget > 0 ? maxBudget : fallbackMax;
    const maxPrice = effectiveMaxBudget * 1.1; // Allow 10% over maxBudget

    const budgetFiltered = categoryComponents.filter((comp) => {
      const price = Number(comp.price) || 0;
      const minPrice = 0; // Always allow cheaper options
      return price >= minPrice && price <= maxPrice;
    });

    // Debug: Log budget filtering
    if (categoryName.toUpperCase() === 'MOTHERBOARD') {
      console.log('💰 Budget Filter Debug:', {
        categoryAlloc,
        maxBudget,
        effectiveMaxBudget,
        maxPrice,
        budgetFiltered: budgetFiltered.length,
        samplePrices: categoryComponents.slice(0, 3).map(c => c.price),
      });
    }

    // Filter by compatibility
    // IMPORTANT: Show ALL components, even if incompatible, so users can make informed choices
    // The UI will mark incompatible components visually, but we don't hide them
    // This allows users to see all options and understand compatibility issues
    const compatibilityFiltered = budgetFiltered.map((comp) => {
      // Attach compatibility info to component for UI display
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
      
      // Attach compatibility info to component
      comp._compatibility = compatCheck;
      
      // Debug: Log compatibility issues for motherboards
      if (categoryName.toUpperCase() === 'MOTHERBOARD') {
        if (!compatCheck.isCompatible) {
          console.log('❌ Compatibility Issue:', {
            component: comp.name,
            price: comp.price,
            socket: comp.socket,
            issues: compatCheck.issues,
            warnings: compatCheck.warnings,
            isCompatible: compatCheck.isCompatible,
            selectedCPU: selectedComponents.find(c => (c.category || '').toUpperCase() === 'CPU'),
          });
        } else {
          console.log('✅ Compatible:', {
            component: comp.name,
            warnings: compatCheck.warnings.length,
          });
        }
      }
      
      // Return component regardless of compatibility - we'll show it but mark it
      return comp;
    });

    // Debug: Final result
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
      // server returns { success, data: populatedBuild, compatibility }
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
      // Update local buildResult
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
    return <div style={styles.loading}>Loading components...</div>;
  }

  const activeCategories = categories
    .filter((cat) => cat.isActive !== false)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Sort by priority (descending - higher priority first)

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
        {/* Left Sidebar - Category Filter List */}
        <div style={styles.filterSidebar}>
          <h3 style={styles.sidebarTitle}>Categories</h3>
          <ul style={styles.categoryList}>
            <li
              style={{
                ...styles.categoryListItem,
                ...(selectedCategory === null ? styles.activeCategoryItem : {}),
              }}
              onClick={() => setSelectedCategory(null)}
            >
              <span>All Categories</span>
            </li>
            {activeCategories.map((category) => {
              const selected = selectedComponents.find(
                (c) => (c.category || '').toUpperCase() === (category.name || '').toUpperCase()
              );
              const alloc = budgetAlloc?.allocations.find((a) => a.categoryName === category.name);
              const filteredComps = getFilteredComponents(category.name);
              
              return (
                <li
                  key={category._id}
                  style={{
                    ...styles.categoryListItem,
                    ...(selectedCategory === category.name ? styles.activeCategoryItem : {}),
                    ...(selected ? styles.hasSelection : {}),
                  }}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <div style={styles.categoryListItemContent}>
                    <span style={styles.categoryName}>{category.name}</span>
                    {selected && (
                      <span style={selectedCategory === category.name ? styles.activeCategoryItemSelectedBadge : styles.selectedBadge}>
                        ✓
                      </span>
                    )}
                    {alloc && (
                      <span style={styles.budgetBadgeSmall}>
                        {formatBudgetRange(alloc)}
                      </span>
                    )}
                    <span style={styles.countBadge}>{filteredComps.length}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Selected Components Summary */}
          <div style={styles.selectedSummary}>
            <h4>Selected ({selectedComponents.length})</h4>
            {selectedComponents.length > 0 ? (
              <div style={styles.selectedSummaryList}>
                {selectedComponents.map((comp) => (
                  <div key={comp._id} style={styles.selectedSummaryItem}>
                    <span style={styles.selectedSummaryName}>{comp.name}</span>
                    <span style={styles.selectedSummaryPrice}>${comp.price.toFixed(2)}</span>
                  </div>
                ))}
                <div style={styles.selectedSummaryTotal}>
                  <strong>Total: ${totalPrice.toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              <p style={styles.noSelectionText}>No components selected</p>
            )}
          </div>
        </div>

        {/* Right Side - Main Content */}
        <div style={styles.mainContent}>
          {buildResult && (
            <div className="card mb-3" style={{ padding: '1rem' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Build Created</h5>
                  <div className="text-muted">Build ID: {buildResult._id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="h5 mb-1">${Number(buildResult.totalPrice || 0).toFixed(2)}</div>
                  <div className="text-muted">
                    Payment status: {buildResult.payment?.status || 'pending'}
                  </div>
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                {buildResult.payment?.status !== 'paid' ? (
                  <button
                    className="btn btn-success"
                    onClick={() => payForBuild(buildResult._id)}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? 'Processing...' : 'Pay Now'}
                  </button>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    Paid
                  </button>
                )}
                {paymentMessage && <div className="align-self-center text-muted">{paymentMessage}</div>}
              </div>
            </div>
          )}
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
                            (Budget: {formatBudgetRangeDecimal(alloc)})
                          </span>
                        )}
                      </div>
                      <button onClick={() => toggleComponent(comp)} className="btn btn-sm btn-danger action-btn" style={styles.removeBtn}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div key={cat._id} style={styles.unselectedItem}>
                      <strong>{cat.name}:</strong> Not selected
                      {alloc && (
                        <div style={styles.budgetRange}>
                          Budget: {formatBudgetRangeDecimal(alloc)}
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
                  className="btn btn-primary w-100"
                  style={styles.createButton}
                >
                  {saving ? 'Saving...' : 'Save Build'}
                </button>
              </div>
            )}
          </div>

          <div style={styles.componentsSection}>
            <h3>
              {selectedCategory ? `${selectedCategory} Components` : 'Available Components'}
            </h3>
            {!totalBudget && (
              <p style={styles.helpText}>Enter a budget above to see filtered components based on category priorities.</p>
            )}
            {selectedCategory ? (
              // Show components for selected category
              (() => {
                const filteredComps = getFilteredComponents(selectedCategory);
                const selected = selectedComponents.find(
                  (c) => (c.category || '').toUpperCase() === (selectedCategory || '').toUpperCase()
                );
                const alloc = budgetAlloc?.allocations.find((a) => a.categoryName === selectedCategory);

                return (
                  <div style={styles.categoryGroup}>
                    <h4>
                      {selectedCategory}
                      {alloc && (
                        <span style={styles.budgetBadge}>
                          {formatBudgetRange(alloc)}
                        </span>
                      )}
                    </h4>
                    {filteredComps.length === 0 ? (
                      <p style={styles.noComponents}>
                        {totalBudget ? 'No compatible components within budget range' : 'No components available'}
                      </p>
                    ) : (
                      <div className="table-responsive" style={styles.componentsTableWrapper}>
                        <table className="table table-striped table-bordered table-hover align-middle" style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.tableHeaderCell}></th>
                              <th style={styles.tableHeaderCell}>Image</th>
                              <th style={styles.tableHeaderCell}>Name</th>
                              <th style={styles.tableHeaderCell}>Price</th>
                              <th style={styles.tableHeaderCell}>Specs</th>
                              <th style={styles.tableHeaderCell}>Compatibility</th>
                              <th style={styles.tableHeaderCell}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredComps.map((component) => {
                              // Use compatibility info attached to component, or calculate it
                              const compatCheck = component._compatibility || (() => {
                                const testBuild = [...selectedComponents];
                                const existingInCategory = testBuild.findIndex(
                                  (s) => (s.category || '').toUpperCase() === (selectedCategory || '').toUpperCase()
                                );
                                if (existingInCategory >= 0) {
                                  testBuild[existingInCategory] = component;
                                } else {
                                  testBuild.push(component);
                                }
                                return checkCompatibility(testBuild);
                              })();
                              const isSelected = selected?._id === component._id;

                              return (
                                <tr key={component._id} style={isSelected ? styles.selectedRow : {}}>
                                  <td style={styles.tableCell}>
                                    <input
                                      type="radio"
                                      name={selectedCategory}
                                      checked={isSelected}
                                      onChange={() => toggleComponent(component)}
                                      disabled={!compatCheck.isCompatible && !isSelected}
                                    />
                                  </td>
                                  <td style={styles.tableCell}>
                                    {component.url ? (
                                      <img src={component.url} alt={component.name} style={styles.componentImage} onError={(e)=>{e.target.style.display='none'}}/>
                                    ) : (
                                      <div style={styles.noImage}>No Image</div>
                                    )}
                                  </td>
                                  <td style={styles.tableCell}>{component.name}</td>
                                  <td style={styles.tableCell}>${Number(component.price || 0).toFixed(2)}</td>
                                  <td style={{...styles.tableCell, ...styles.smallText}}>{component.specifications}</td>
                                  <td style={styles.tableCell}>
                                    {!compatCheck.isCompatible && !isSelected ? (
                                      <span style={styles.incompatibleBadge}>Incompatible</span>
                                    ) : (
                                      <span style={styles.inStock}>{compatCheck.isCompatible ? 'Compatible' : 'Selected'}</span>
                                    )}
                                  </td>
                                  <td style={styles.tableCell}>
                                    <button onClick={() => toggleComponent(component)} className={(isSelected ? 'btn btn-sm btn-outline-danger' : 'btn btn-sm btn-outline-primary') + ' action-btn'} style={styles.viewButton}>
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
              })()
            ) : (
              // Show all categories
              activeCategories.map((category) => {
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
                      <div className="table-responsive" style={styles.componentsTableWrapper}>
                        <table className="table table-striped table-bordered table-hover align-middle" style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.tableHeaderCell}></th>
                              <th style={styles.tableHeaderCell}>Image</th>
                              <th style={styles.tableHeaderCell}>Name</th>
                              <th style={styles.tableHeaderCell}>Price</th>
                              <th style={styles.tableHeaderCell}>Specs</th>
                              <th style={styles.tableHeaderCell}>Compatibility</th>
                              <th style={styles.tableHeaderCell}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredComps.map((component) => {
                              // Use compatibility info attached to component, or calculate it
                              const compatCheck = component._compatibility || (() => {
                                const testBuild = [...selectedComponents];
                                const existingInCategory = testBuild.findIndex(
                                  (s) => (s.category || '').toUpperCase() === (category.name || '').toUpperCase()
                                );
                                if (existingInCategory >= 0) {
                                  testBuild[existingInCategory] = component;
                                } else {
                                  testBuild.push(component);
                                }
                                return checkCompatibility(testBuild);
                              })();
                              const isSelected = selected?._id === component._id;

                              return (
                                <tr key={component._id} style={isSelected ? styles.selectedRow : {}}>
                                  <td style={styles.tableCell}>
                                    <input
                                      type="radio"
                                      name={category.name}
                                      checked={isSelected}
                                      onChange={() => toggleComponent(component)}
                                      disabled={!compatCheck.isCompatible && !isSelected}
                                    />
                                  </td>
                                  <td style={styles.tableCell}>
                                    {component.url ? (
                                      <img src={component.url} alt={component.name} style={styles.componentImage} onError={(e)=>{e.target.style.display='none'}}/>
                                    ) : (
                                      <div style={styles.noImage}>No Image</div>
                                    )}
                                  </td>
                                  <td style={styles.tableCell}>{component.name}</td>
                                  <td style={styles.tableCell}>${Number(component.price || 0).toFixed(2)}</td>
                                  <td style={{...styles.tableCell, ...styles.smallText}}>{component.specifications}</td>
                                  <td style={styles.tableCell}>
                                    {!compatCheck.isCompatible && !isSelected ? (
                                      <span style={styles.incompatibleBadge}>Incompatible</span>
                                    ) : (
                                      <span style={styles.inStock}>{compatCheck.isCompatible ? 'Compatible' : 'Selected'}</span>
                                    )}
                                  </td>
                                  <td style={styles.tableCell}>
                                    <button onClick={() => toggleComponent(component)} className={(isSelected ? 'btn btn-sm btn-outline-danger' : 'btn btn-sm btn-outline-primary') + ' action-btn'} style={styles.viewButton}>
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
              })
            )}
          </div>
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

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      return alert('No builds selected for deletion.');
    }
    if (!window.confirm(`Delete ${selectedIds.length} selected build(s)? This action cannot be undone.`)) return;
    try {
      // delete in parallel
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
      // update local state
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

    // Check if build is completed
    if (build.assemblyStatus === 'Completed') {
      alert('Refunds are not allowed for completed builds.');
      return;
    }

    // Check if already refunded
    if (build.payment?.status === 'refunded') {
      alert('This build has already been refunded.');
      return;
    }

    // Check if there's already a pending request
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

  if (loading) {
    return <div style={styles.loading}>Loading builds...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>My Builds ({builds.length})</h2>
        {!selectionMode ? (
          <button
            onClick={() => {
              setSelectionMode(true);
              setSelectedIds([]);
            }}
            className="btn btn-danger"
            style={{ marginLeft: '1rem' }}
          >
            Delete
          </button>
        ) : (
          <div>
            <button onClick={deleteSelected} className="btn btn-danger" style={{ marginLeft: '1rem' }} disabled={selectedIds.length === 0}>
              Confirm Delete ({selectedIds.length})
            </button>
            <button onClick={() => { setSelectionMode(false); setSelectedIds([]); }} className="btn btn-secondary ms-2">
              Cancel
            </button>
          </div>
        )}
      </div>
      
      {selectedBuild && (
        <div style={styles.buildDetails}>
          <button onClick={() => setSelectedBuild(null)} className="btn btn-secondary float-end" style={styles.closeBtn}>
            Close Details
          </button>
          <h3>Build Details</h3>
          <p><strong>Status:</strong> {selectedBuild.assemblyStatus}</p>
          <p><strong>Total Price:</strong> ${selectedBuild.totalPrice.toFixed(2)}</p>
          <p><strong>Payment Status:</strong> {selectedBuild.payment?.status || 'pending'}</p>
          <p><strong>Compatible:</strong> {selectedBuild.isCompatible ? 'Yes' : 'No'}</p>
          
          {selectedBuild.payment?.status === 'paid' && selectedBuild.assemblyStatus !== 'Completed' && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff9e6', borderRadius: '4px', border: '1px solid #ffd700' }}>
              <p><strong>Refund Information:</strong></p>
              <p>You can request a refund for this build. You will receive 90% of your payment (${(selectedBuild.payment?.escrowAmount || 0).toFixed(2)}).</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Note: 3% admin commission and 7% assembler commission are non-refundable.</p>
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
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <p style={{ color: '#666' }}>This build is completed. Refunds are no longer available.</p>
            </div>
          )}
          
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
            <div
              key={build._id}
              style={{
                ...styles.buildCard,
                ...(selectedIds.includes(build._id) ? { borderLeft: '4px solid #dc3545', backgroundColor: '#fff6f6' } : {}),
              }}
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
                  <p><strong>Status:</strong> {build.assemblyStatus}</p>
                  <p><strong>Components:</strong> {build.components.length}</p>
                  <p style={styles.smallText}>
                    {new Date(build.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div style={styles.buildActions}>
                <button
                  onClick={() => setSelectedBuild(build)}
                  className="btn btn-sm btn-outline-primary action-btn"
                  style={styles.viewButton}
                >
                  View Details
                </button>
                {build.payment?.status !== 'paid' ? (
                  <button
                    onClick={() => payForBuildLocal(build._id)}
                    className="btn btn-sm btn-success action-btn"
                    style={styles.viewButton}
                    disabled={!!payLoadingMap[build._id]}
                  >
                    {payLoadingMap[build._id] ? 'Processing...' : 'Pay'}
                  </button>
                ) : build.payment?.status === 'refunded' ? (
                  <button
                    className="btn btn-sm btn-secondary action-btn"
                    style={styles.viewButton}
                    disabled
                  >
                    Refunded
                  </button>
                ) : (() => {
                  const pendingRequest = (build.refundRequests || []).find(
                    (req) => req.status === 'requested' || req.status === 'approved'
                  );
                  const isCompleted = build.assemblyStatus === 'Completed';
                  
                  if (pendingRequest) {
                    return (
                      <button
                        className="btn btn-sm btn-warning action-btn"
                        style={styles.viewButton}
                        disabled
                        title={`Refund request ${pendingRequest.status}`}
                      >
                        Refund {pendingRequest.status === 'requested' ? 'Pending' : 'Approved'}
                      </button>
                    );
                  } else if (isCompleted) {
                    return (
                      <button
                        className="btn btn-sm btn-secondary action-btn"
                        style={styles.viewButton}
                        disabled
                        title="Refunds not allowed for completed builds"
                      >
                        Paid
                      </button>
                    );
                  } else {
                    return (
                      <button
                        onClick={() => requestRefund(build._id)}
                        className="btn btn-sm btn-warning action-btn"
                        style={styles.viewButton}
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

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)',
    color: '#111',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#000',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  logo: {
    margin: 0,
    color: '#fff',
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#000',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  userInfo: {
    color: '#444',
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
    borderBottom: '2px solid #eee',
  },
  tab: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#333',
  },
  activeTab: {
    borderBottom: '2px solid #000',
    color: '#000',
    fontWeight: '600',
  },
  tabContent: {
    background: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
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
    fontWeight: '600',
    color: '#222',
  },
  select: {
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    background: '#fff',
  },
  componentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  componentCard: {
    border: '1px solid #e6e6e6',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#fff',
  },
  componentName: {
    margin: '0 0 0.5rem 0',
    color: '#111',
  },
  componentCategory: {
    color: '#111',
    fontWeight: '500',
    margin: '0 0 0.5rem 0',
  },
  componentPrice: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#111',
    margin: '0.5rem 0',
  },
  componentSpecs: {
    fontSize: '0.9rem',
    color: '#666',
    margin: '0.5rem 0',
  },
  compatibility: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0.5rem 0',
  },
  stockStatus: {
    margin: '0.5rem 0 0 0',
  },
  inStock: {
    color: '#000',
    fontWeight: '600',
  },
  outOfStock: {
    color: '#666',
    fontWeight: '600',
  },
  buildCreator: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  filterSidebar: {
    width: '280px',
    minWidth: '280px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '1.5rem',
    border: '1px solid #e6e6e6',
    position: 'sticky',
    top: '1rem',
    maxHeight: 'calc(100vh - 2rem)',
    overflowY: 'auto',
  },
  sidebarTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.1rem',
    color: '#111',
    borderBottom: '2px solid #000',
    paddingBottom: '0.5rem',
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
    border: '1px solid #e6e6e6',
    transition: 'all 0.15s',
  },
  activeCategoryItem: {
    backgroundColor: '#111',
    color: 'white',
    border: '1px solid #111',
    fontWeight: '600',
  },
  hasSelection: {
    borderLeft: '4px solid #000',
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
  selectedBadge: {
    color: '#000',
    fontSize: '1.2rem',
    fontWeight: '700',
  },
  budgetBadgeSmall: {
    fontSize: '0.75rem',
    color: '#444',
    backgroundColor: '#f2f2f2',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
  },
  countBadge: {
    fontSize: '0.75rem',
    color: '#111',
    backgroundColor: '#f2f2f2',
    padding: '0.2rem 0.5rem',
    borderRadius: '12px',
    fontWeight: '600',
  },
  // Override styles for active category items
  activeCategoryItemSelectedBadge: {
    color: '#fff',
    backgroundColor: '#111',
    padding: '0.1rem 0.3rem',
    borderRadius: '4px',
  },
  selectedSummary: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '2px solid #e6e6e6',
  },
  selectedSummaryList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  selectedSummaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem',
    marginBottom: '0.25rem',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '0.85rem',
  },
  selectedSummaryName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  selectedSummaryPrice: {
    color: '#111',
    fontWeight: '700',
    marginLeft: '0.5rem',
  },
  selectedSummaryTotal: {
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #e6e6e6',
    textAlign: 'right',
    color: '#111',
  },
  noSelectionText: {
    color: '#777',
    fontStyle: 'italic',
    fontSize: '0.9rem',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  selectedSection: {
    border: '1px solid #e6e6e6',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#fff',
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
    backgroundColor: '#222',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  totalPrice: {
    padding: '1rem',
    backgroundColor: '#000',
    color: 'white',
    borderRadius: '4px',
    marginTop: '1rem',
    textAlign: 'center',
    fontSize: '1.25rem',
  },
  createButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#000',
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
    border: '1px solid #e6e6e6',
    borderRadius: '4px',
    cursor: 'pointer',
  },
    componentsTableWrapper: {
    overflowX: 'auto',
    marginTop: '1rem',
    backgroundColor: '#fff',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #e6e6e6',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '0.5rem',
  },
  tableHeaderCell: {
    border: '1px solid #e6e6e6',
    padding: '0.6rem',
    backgroundColor: '#f5f5f5',
    textAlign: 'left',
    fontWeight: '700',
    color: '#111',
  },
  tableCell: {
    border: '1px solid #e6e6e6',
    padding: '0.6rem',
    verticalAlign: 'middle',
    backgroundColor: 'transparent',
    color: '#222',
  },
  componentImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid #e6e6e6',
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
    border: '1px solid #e6e6e6',
    fontSize: '0.75rem',
    color: '#777',
    textAlign: 'center',
  },
  selectedRow: {
    backgroundColor: '#f5f5f5',
  },
  selectedOption: {
    border: '2px solid #111',
    backgroundColor: '#f5f5f5',
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
    border: '1px solid #e6e6e6',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#fff',
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
    padding: '0.25rem 0.75rem',
    backgroundColor: '#000',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  deleteButton: {
    flex: 1,
    padding: '0.25rem 0.75rem',
    backgroundColor: '#444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  buildDetails: {
    border: '1px solid #e6e6e6',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
    backgroundColor: '#fff',
  },
  closeBtn: {
    float: 'right',
    padding: '0.5rem 1rem',
    backgroundColor: '#000',
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
    border: '1px solid #e6e6e6',
  },
  issue: {
    color: '#a00',
    margin: '0.25rem 0',
  },
  warning: {
    color: '#b07',
    margin: '0.25rem 0',
  },
  error: {
    backgroundColor: '#fff4f4',
    color: '#a00',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  success: {
    backgroundColor: '#f4fff4',
    color: '#0a0',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  budgetSection: {
    backgroundColor: '#f8f8f8',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid #e6e6e6',
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
    border: '1px solid #e6e6e6',
    width: '200px',
    background: '#fff',
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
    color: '#111',
    marginLeft: '1rem',
    fontWeight: 'normal',
  },
  unselectedItem: {
    padding: '0.75rem',
    marginBottom: '0.5rem',
    backgroundColor: '#fff',
    borderRadius: '4px',
    color: '#888',
  },
  price: {
    color: '#111',
    fontWeight: '700',
    marginLeft: '0.5rem',
  },
  overBudget: {
    color: '#a00',
    fontWeight: '700',
  },
  underBudget: {
    color: '#111',
    fontWeight: '700',
  },
  incompatibleOption: {
    opacity: 0.6,
    border: '1px solid #a00',
  },
  incompatibleBadge: {
    fontSize: '0.75rem',
    color: '#a00',
    backgroundColor: '#fff4f4',
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
    color: '#777',
    fontStyle: 'italic',
    padding: '1rem',
  },
  browseLayout: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  componentsContainer: {
    flex: 1,
  },
  searchBox: {
    marginBottom: '1rem',
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: '1px solid #e6e6e6',
    boxSizing: 'border-box',
    background: '#fff',
    color: '#111',
  },
  filterInfo: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e6e6e6',
  },
  filterInfoText: {
    fontSize: '0.85rem',
    color: '#666',
    margin: 0,
  },
  noResults: {
    textAlign: 'center',
    padding: '3rem',
    color: '#777',
  },
  compatibilityDetail: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0.25rem 0',
  },
};

export default UserDashboard;
