// Enhanced compatibility checker for PC components
// Uses structured compatibility fields for accurate validation

const normalizeCategory = (cat) => {
  const c = String(cat || '').trim().toUpperCase();
  if (!c) return '';
  // Handle common aliases safely
  if (c === 'POWER SUPPLY' || c === 'POWER SUPPLY UNIT' || c === 'PSU UNIT') return 'PSU';
  if (c === 'MOTHER BOARD') return 'MOTHERBOARD';
  if (c === 'GRAPHICS CARD') return 'GPU';
  if (c === 'SOLID STATE DRIVE' || c === 'HARD DRIVE') return 'STORAGE';
  return c;
};

const normalizeSocket = (socket) => {
  const s = String(socket || '').trim().toUpperCase();
  if (!s) return '';
  // Make comparisons robust against formatting differences: "LGA 1700" vs "LGA1700", "AM-4" vs "AM4"
  return s.replace(/SOCKET/gi, '').replace(/[^A-Z0-9]/g, '');
};

const checkCompatibility = (components) => {
  const issues = [];
  const warnings = [];
  let isCompatible = true;

  // Find required components
  const cpu = components.find((c) => normalizeCategory(c.category) === 'CPU');
  const motherboard = components.find((c) => normalizeCategory(c.category) === 'MOTHERBOARD');
  const psu = components.find((c) => normalizeCategory(c.category) === 'PSU');
  const gpu = components.find((c) => normalizeCategory(c.category) === 'GPU');
  const ram = components.find((c) => normalizeCategory(c.category) === 'RAM');
  const storage = components.find((c) => normalizeCategory(c.category) === 'STORAGE');
  const case_ = components.find((c) => normalizeCategory(c.category) === 'CASE');

  // Check CPU and Motherboard socket compatibility
  if (cpu && motherboard) {
    const rawCpuSocket =
      (cpu.socket || '').trim().toUpperCase() || extractSocket(cpu.compatibility || cpu.specifications);
    const rawMbSocket =
      (motherboard.socket || '').trim().toUpperCase() ||
      extractSocket(motherboard.compatibility || motherboard.specifications);

    const cpuSocket = normalizeSocket(rawCpuSocket);
    const mbSocket = normalizeSocket(rawMbSocket);

    if (cpuSocket && mbSocket) {
      if (cpuSocket !== mbSocket) {
        // Keep the original values in the message when available (better UX)
        const displayCpu = rawCpuSocket || cpuSocket;
        const displayMb = rawMbSocket || mbSocket;
        issues.push(`CPU socket (${displayCpu}) does not match Motherboard socket (${displayMb})`);
        isCompatible = false;
      } else {
        warnings.push(`✓ CPU and Motherboard socket compatibility verified (${rawCpuSocket || cpuSocket})`);
      }
    } else if (!cpuSocket || !mbSocket) {
      warnings.push('⚠ Socket information missing - compatibility cannot be verified');
    }
  }

  // Check CPU and Motherboard chipset compatibility
  if (cpu && motherboard) {
    const cpuChipset = (cpu.chipset || '').trim();
    const mbChipset = (motherboard.chipset || '').trim();
    
    if (cpuChipset && mbChipset) {
      // Basic chipset compatibility check (can be enhanced with compatibility matrix)
      const compatibleChipsets = {
        'Z690': ['Z690', 'B660', 'H670'],
        'B660': ['Z690', 'B660', 'H670'],
        'Z790': ['Z790', 'B760', 'H770'],
        'B550': ['B550', 'X570'],
        'X570': ['B550', 'X570'],
        'B650': ['B650', 'X670'],
        'X670': ['B650', 'X670'],
      };
      
      const cpuChipsetBase = cpuChipset.split(' ')[0];
      const compatible = compatibleChipsets[mbChipset] || [mbChipset];
      
      if (!compatible.includes(cpuChipsetBase) && !compatible.includes(cpuChipset)) {
        warnings.push(`⚠ CPU chipset (${cpuChipset}) may not be fully compatible with Motherboard chipset (${mbChipset})`);
      }
    }
  }

  // Check form factor compatibility (Case and Motherboard)
  if (case_ && motherboard) {
    const caseFormFactor = (case_.formFactor || '').trim().toUpperCase();
    const mbFormFactor = (motherboard.formFactor || '').trim().toUpperCase();
    
    if (caseFormFactor && mbFormFactor) {
      // Form factor compatibility: larger cases can fit smaller motherboards
      const formFactorSize = {
        'ITX': 1,
        'M-ATX': 2,
        'MATX': 2,
        'MICRO-ATX': 2,
        'ATX': 3,
        'E-ATX': 4,
        'EXTENDED-ATX': 4,
      };
      
      const caseSize = formFactorSize[caseFormFactor] || 0;
      const mbSize = formFactorSize[mbFormFactor] || 0;
      
      if (caseSize > 0 && mbSize > 0 && caseSize < mbSize) {
        issues.push(`Case form factor (${caseFormFactor}) is too small for Motherboard form factor (${mbFormFactor})`);
        isCompatible = false;
      } else if (caseSize >= mbSize && caseSize > 0 && mbSize > 0) {
        warnings.push(`✓ Case form factor (${caseFormFactor}) is compatible with Motherboard (${mbFormFactor})`);
      }
    }
  }

  // Check RAM type compatibility
  if (ram && motherboard) {
    const ramType = (ram.ramType || '').trim().toUpperCase();
    const mbRamType = (motherboard.ramType || '').trim().toUpperCase();
    
    if (ramType && mbRamType && ramType !== mbRamType) {
      issues.push(`RAM type (${ramType}) does not match Motherboard RAM type (${mbRamType})`);
      isCompatible = false;
    } else if (ramType && mbRamType && ramType === mbRamType) {
      warnings.push(`✓ RAM type (${ramType}) is compatible with Motherboard`);
    }
  }

  // Check power requirements
  if (psu) {
    const psuWattage = psu.wattage || extractWattage(psu.specifications || psu.name);
    
    if (psuWattage) {
      let totalPowerNeed = 0;
      
      // Use structured powerRequirement field if available, otherwise estimate
      if (cpu) totalPowerNeed += cpu.powerRequirement || 150;
      if (gpu) totalPowerNeed += gpu.powerRequirement || 200;
      totalPowerNeed += 100; // Other components (RAM, Storage, etc.)
      
      if (psuWattage < totalPowerNeed) {
        issues.push(`PSU wattage (${psuWattage}W) is insufficient for this build (estimated need: ~${totalPowerNeed}W)`);
        isCompatible = false;
      } else {
        warnings.push(`✓ PSU wattage (${psuWattage}W) is sufficient (estimated need: ~${totalPowerNeed}W)`);
      }
    }
  }

  // Check storage interface compatibility
  if (storage && motherboard) {
    const storageInterface = (storage.storageInterface || '').trim().toUpperCase();
    
    if (storageInterface) {
      // Most modern motherboards support both SATA and NVME M.2
      if (storageInterface === 'SATA' || storageInterface === 'NVME' || storageInterface === 'NVME M.2' || storageInterface === 'M.2') {
        warnings.push(`✓ Storage interface (${storageInterface}) is typically supported`);
      }
    }
  }

  // Check if required components exist
  if (!cpu) {
    warnings.push('⚠ No CPU selected');
  }
  if (!motherboard) {
    warnings.push('⚠ No Motherboard selected');
  }
  if (!psu) {
    warnings.push('⚠ No PSU selected');
  }

  return {
    isCompatible,
    issues,
    warnings,
    summary: issues.length === 0 ? 'Build is compatible' : 'Compatibility issues found',
  };
};

// Extract socket type from text (e.g., "LGA 1700", "AM4", "LGA1200")
const extractSocket = (text) => {
  if (!text) return null;
  const socketPatterns = [
    /LGA\s*\d+/i,
    /AM[0-9]+/i,
    /Socket\s*\w+/i,
    /[A-Z]{2,3}\s*\d+/i,
  ];

  for (const pattern of socketPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim().toUpperCase();
    }
  }
  return null;
};

// Extract wattage from PSU specifications
const extractWattage = (text) => {
  if (!text) return null;
  const wattageMatch = text.match(/(\d+)\s*W/i);
  if (wattageMatch) {
    return parseInt(wattageMatch[1]);
  }
  return null;
};

module.exports = { checkCompatibility };
