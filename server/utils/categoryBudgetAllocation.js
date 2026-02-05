/**
 * Allocate budget across categories based on their priority ratios.
 * Returns budget ranges for each category that can be used to filter components.
 *
 * @param {number} totalBudget - Total budget in dollars
 * @param {Array<{_id: string, name: string, priority: number, isActive: boolean}>} categories - Active categories with priorities
 * @param {Array<{_id: string, category: string, price: number}>} selectedComponents - Already selected components
 * @returns {{
 *   totalBudget: number,
 *   spent: number,
 *   remaining: number,
 *   allocations: Array<{
 *     categoryId: string,
 *     categoryName: string,
 *     priority: number,
 *     ratio: number,
 *     allocatedBudget: number,
 *     minBudget: number,
 *     maxBudget: number,
 *     spent: number,
 *     remaining: number
 *   }>
 * }}
 */
function allocateBudgetByCategory(totalBudget, categories, selectedComponents = []) {
  const totalBudgetNum = Number(totalBudget);
  if (!Number.isFinite(totalBudgetNum) || totalBudgetNum < 0) {
    throw new Error('Total budget must be a non-negative number');
  }

  // Filter active categories
  const activeCategories = categories.filter((cat) => cat.isActive !== false);
  
  if (activeCategories.length === 0) {
    return {
      totalBudget: totalBudgetNum,
      spent: 0,
      remaining: totalBudgetNum,
      allocations: [],
    };
  }

  // Calculate spent amount per category
  const spentByCategory = {};
  let totalSpent = 0;
  selectedComponents.forEach((comp) => {
    const catName = comp.category?.toUpperCase();
    if (!spentByCategory[catName]) {
      spentByCategory[catName] = 0;
    }
    spentByCategory[catName] += Number(comp.price) || 0;
    totalSpent += Number(comp.price) || 0;
  });

  const remainingBudget = Math.max(0, totalBudgetNum - totalSpent);

  // Calculate total priority for remaining categories
  // Categories with selected components get 0 priority (budget already allocated)
  const categoryPriorities = activeCategories.map((cat) => {
    const catName = cat.name?.toUpperCase();
    const spent = spentByCategory[catName] || 0;
    return {
      categoryId: cat._id?.toString() || cat.id?.toString(),
      categoryName: cat.name,
      priority: spent > 0 ? 0 : (Number(cat.priority) || 1),
      spent,
    };
  });

  const totalPriority = categoryPriorities.reduce((sum, cat) => sum + cat.priority, 0);

  // Allocate remaining budget
  const allocations = categoryPriorities.map((cat) => {
    let allocatedBudget = 0;
    let minBudget = 0;
    let maxBudget = 0;
    let ratio = 0;

    if (cat.priority > 0 && totalPriority > 0) {
      ratio = cat.priority / totalPriority;
      allocatedBudget = ratio * remainingBudget;
      // Budget range: ±20% flexibility
      minBudget = Math.max(0, allocatedBudget * 0.8);
      maxBudget = allocatedBudget * 1.2;
    } else if (cat.spent > 0) {
      // Category already has selection, show spent amount
      allocatedBudget = cat.spent;
      minBudget = cat.spent;
      maxBudget = cat.spent;
    }

    return {
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      priority: cat.priority || 0,
      ratio: Math.round(ratio * 1000) / 1000, // 3 decimal places
      allocatedBudget: Math.round(allocatedBudget * 100) / 100,
      minBudget: Math.round(minBudget * 100) / 100,
      maxBudget: Math.round(maxBudget * 100) / 100,
      spent: Math.round(cat.spent * 100) / 100,
      remaining: Math.round((allocatedBudget - cat.spent) * 100) / 100,
    };
  });

  return {
    totalBudget: Math.round(totalBudgetNum * 100) / 100,
    spent: Math.round(totalSpent * 100) / 100,
    remaining: Math.round(remainingBudget * 100) / 100,
    allocations,
  };
}

module.exports = { allocateBudgetByCategory };
