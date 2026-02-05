/**
 * Allocate a budget across selected components based on their priority weights.
 *
 * Example:
 *  budget = 1000
 *  items = [{ componentId: '...', priority: 10 }, { componentId: '...', priority: 8 }]
 *  totalPriority = 18
 *  allocations => [{ componentId: '...', allocatedBudget: 555.56 }, { ...: 444.44 }]
 *
 * Notes:
 * - Any missing/invalid priority is treated as 1
 * - Priority is clamped to >= 1
 * - Result uses 2 decimal rounding for allocated budgets
 */

function normalizePriority(priority) {
  const p = Number(priority);
  if (!Number.isFinite(p)) return 1;
  return Math.max(1, Math.floor(p));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {number} budget Total budget in dollars
 * @param {Array<{componentId?: string, id?: string, priority?: number, category?: string, name?: string}>} items
 * @returns {{
 *   budget: number,
 *   totalPriority: number,
 *   allocations: Array<{ componentId: string | null, priority: number, ratio: number, allocatedBudget: number, name?: string, category?: string }>,
 * }}
 */
function allocateBudgetByPriority(budget, items) {
  const totalBudget = Number(budget);
  if (!Number.isFinite(totalBudget) || totalBudget < 0) {
    throw new Error('Budget must be a non-negative number');
  }

  if (!Array.isArray(items) || items.length === 0) {
    return {
      budget: round2(totalBudget),
      totalPriority: 0,
      allocations: [],
    };
  }

  const normalized = items.map((item) => {
    const componentId = item?.componentId ?? item?.id ?? null;
    return {
      componentId,
      name: item?.name,
      category: item?.category,
      priority: normalizePriority(item?.priority),
    };
  });

  const totalPriority = normalized.reduce((sum, x) => sum + x.priority, 0);
  if (totalPriority <= 0) {
    return {
      budget: round2(totalBudget),
      totalPriority: 0,
      allocations: normalized.map((x) => ({
        componentId: x.componentId,
        name: x.name,
        category: x.category,
        priority: x.priority,
        ratio: 0,
        allocatedBudget: 0,
      })),
    };
  }

  const allocations = normalized.map((x) => {
    const ratio = x.priority / totalPriority;
    return {
      componentId: x.componentId,
      name: x.name,
      category: x.category,
      priority: x.priority,
      ratio: round2(ratio),
      allocatedBudget: round2(ratio * totalBudget),
    };
  });

  return {
    budget: round2(totalBudget),
    totalPriority,
    allocations,
  };
}

module.exports = { allocateBudgetByPriority };

