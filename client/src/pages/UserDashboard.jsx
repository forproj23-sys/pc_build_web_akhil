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

  const activeCategories = categories.filter((cat) => cat.isActive !== false);

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
                          className="btn btn-sm btn-outline-primary"
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
                        ${alloc.minBudget.toFixed(0)}-${alloc.maxBudget.toFixed(0)}
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
                      <button onClick={() => toggleComponent(comp)} className="btn btn-sm btn-danger" style={styles.removeBtn}>
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
                              const testBuild = [...selectedComponents];
                              const existingInCategory = testBuild.findIndex(
                                (s) => (s.category || '').toUpperCase() === (selectedCategory || '').toUpperCase()
                              );
                              if (existingInCategory >= 0) {
                                testBuild[existingInCategory] = component;
                              } else {
                                testBuild.push(component);
                              }
                              const compatCheck = checkCompatibility(testBuild);
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
                                    <button onClick={() => toggleComponent(component)} className={isSelected ? 'btn btn-sm btn-outline-danger' : 'btn btn-sm btn-outline-primary'} style={styles.viewButton}>
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
                                    <button onClick={() => toggleComponent(component)} className={isSelected ? 'btn btn-sm btn-outline-danger' : 'btn btn-sm btn-outline-primary'} style={styles.viewButton}>
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
          <button onClick={() => setSelectedBuild(null)} className="btn btn-secondary float-end" style={styles.closeBtn}>
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
                  className="btn btn-sm btn-outline-primary"
                  style={styles.viewButton}
                >
                  View Details
                </button>
                <button
                  onClick={() => deleteBuild(build._id)}
                  className="btn btn-sm btn-danger"
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
    background: 'linear-gradient(180deg, #e8f6ff 0%, #f5f5f5 100%)',
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
    background: 'linear-gradient(180deg, #eef8ff 0%, #ffffff 100%)',
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
  hasSelection: {
    borderLeft: '4px solid #28a745',
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
    color: '#28a745',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  budgetBadgeSmall: {
    fontSize: '0.75rem',
    color: '#666',
    backgroundColor: '#e9ecef',
    padding: '0.2rem 0.4rem',
    borderRadius: '4px',
  },
  countBadge: {
    fontSize: '0.75rem',
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    padding: '0.2rem 0.5rem',
    borderRadius: '12px',
    fontWeight: 'bold',
  },
  // Override styles for active category items
  activeCategoryItemSelectedBadge: {
    color: '#fff',
    backgroundColor: '#28a745',
    padding: '0.1rem 0.3rem',
    borderRadius: '4px',
  },
  selectedSummary: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '2px solid #dee2e6',
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
    color: '#28a745',
    fontWeight: 'bold',
    marginLeft: '0.5rem',
  },
  selectedSummaryTotal: {
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #dee2e6',
    textAlign: 'right',
    color: '#333',
  },
  noSelectionText: {
    color: '#999',
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
    componentsTableWrapper: {
    overflowX: 'auto',
    marginTop: '1rem',
    backgroundColor: '#f6fbff',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #e3f0ff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '0.5rem',
  },
  tableHeaderCell: {
    border: '1px solid #e6e6e6',
    padding: '0.6rem',
    backgroundColor: '#e7f3ff',
    textAlign: 'left',
    fontWeight: '600',
  },
  tableCell: {
    border: '1px solid #e6e6e6',
    padding: '0.6rem',
    verticalAlign: 'middle',
    backgroundColor: 'transparent',
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
  selectedRow: {
    backgroundColor: '#e7f3ff',
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
    border: '1px solid #dee2e6',
    boxSizing: 'border-box',
  },
  filterInfo: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #dee2e6',
  },
  filterInfoText: {
    fontSize: '0.85rem',
    color: '#666',
    margin: 0,
  },
  noResults: {
    textAlign: 'center',
    padding: '3rem',
    color: '#999',
  },
  compatibilityDetail: {
    fontSize: '0.85rem',
    color: '#666',
    margin: '0.25rem 0',
  },
};

export default UserDashboard;
