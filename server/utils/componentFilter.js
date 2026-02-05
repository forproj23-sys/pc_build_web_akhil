/**
 * Filter components based on budget range and compatibility with selected components
 * 
 * @param {Array} allComponents - All available components
 * @param {Array} selectedComponents - Currently selected components
 * @param {Object} budgetAllocations - Budget allocation per category from allocateBudgetByCategory
 * @returns {Object} Filtered components by category and compatibility info
 */
const { checkCompatibility } = require('./compatibilityChecker');

function filterComponentsByBudgetAndCompatibility(allComponents, selectedComponents, budgetAllocations) {
  const filtered = {};
  const compatibilityInfo = {};

  // Group components by category
  const componentsByCategory = {};
  allComponents.forEach((comp) => {
    const catName = (comp.category || '').toUpperCase();
    if (!componentsByCategory[catName]) {
      componentsByCategory[catName] = [];
    }
    componentsByCategory[catName].push(comp);
  });

  // Process each category
  budgetAllocations.allocations.forEach((alloc) => {
    const catName = alloc.categoryName.toUpperCase();
    const categoryComponents = componentsByCategory[catName] || [];
    
    // Filter by budget range
    const budgetFiltered = categoryComponents.filter((comp) => {
      if (!comp.stockStatus) return false;
      const price = Number(comp.price) || 0;
      
      // If category already has selection, only show that selection
      if (alloc.spent > 0) {
        const selected = selectedComponents.find((s) => 
          (s.category || '').toUpperCase() === catName && s._id === comp._id
        );
        return !!selected;
      }
      
      // Filter by budget range (with 10% flexibility)
      const minPrice = alloc.minBudget * 0.9;
      const maxPrice = alloc.maxBudget * 1.1;
      return price >= minPrice && price <= maxPrice;
    });

    // Filter by compatibility
    const compatible = budgetFiltered.filter((comp) => {
      if (selectedComponents.length === 0) return true;
      
      // Create test build with this component
      const testBuild = [...selectedComponents];
      const existingInCategory = testBuild.findIndex((s) => 
        (s.category || '').toUpperCase() === catName
      );
      
      if (existingInCategory >= 0) {
        testBuild[existingInCategory] = comp;
      } else {
        testBuild.push(comp);
      }
      
      const compatCheck = checkCompatibility(testBuild);
      return compatCheck.isCompatible;
    });

    filtered[catName] = compatible;
    
    // Store compatibility info for each component
    compatible.forEach((comp) => {
      const testBuild = [...selectedComponents];
      const existingInCategory = testBuild.findIndex((s) => 
        (s.category || '').toUpperCase() === catName
      );
      
      if (existingInCategory >= 0) {
        testBuild[existingInCategory] = comp;
      } else {
        testBuild.push(comp);
      }
      
      const compatCheck = checkCompatibility(testBuild);
      compatibilityInfo[comp._id] = {
        isCompatible: compatCheck.isCompatible,
        issues: compatCheck.issues,
        warnings: compatCheck.warnings,
      };
    });
  });

  return {
    filtered,
    compatibilityInfo,
  };
}

module.exports = { filterComponentsByBudgetAndCompatibility };
