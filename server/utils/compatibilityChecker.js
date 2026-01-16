// Simple compatibility checker for PC components
// For demo purposes - checks basic compatibility rules

const checkCompatibility = (components) => {
  const issues = [];
  const warnings = [];
  let isCompatible = true;

  // Find required components
  const cpu = components.find((c) => c.category === 'CPU');
  const motherboard = components.find((c) => c.category === 'Motherboard');
  const psu = components.find((c) => c.category === 'PSU');
  const gpu = components.find((c) => c.category === 'GPU');
  const ram = components.find((c) => c.category === 'RAM');

  // Check CPU and Motherboard socket compatibility
  if (cpu && motherboard) {
    const cpuSocket = extractSocket(cpu.compatibility || cpu.specifications);
    const mbSocket = extractSocket(motherboard.compatibility || motherboard.specifications);

    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      issues.push(`CPU socket (${cpuSocket}) does not match Motherboard socket (${mbSocket})`);
      isCompatible = false;
    } else if (cpuSocket && mbSocket && cpuSocket === mbSocket) {
      warnings.push(`✓ CPU and Motherboard socket compatibility verified (${cpuSocket})`);
    }
  }

  // Check power requirements (basic)
  if (psu && (cpu || gpu)) {
    const psuWattage = extractWattage(psu.specifications || psu.name);
    if (psuWattage) {
      let estimatedNeed = 0;
      if (cpu) estimatedNeed += 150; // Average CPU power
      if (gpu) estimatedNeed += 200; // Average GPU power
      estimatedNeed += 100; // Other components

      if (psuWattage < estimatedNeed) {
        issues.push(`PSU wattage (${psuWattage}W) may be insufficient for this build (estimated need: ~${estimatedNeed}W)`);
        warnings.push('⚠ Low power supply - may cause issues under load');
      } else {
        warnings.push(`✓ PSU wattage (${psuWattage}W) appears sufficient`);
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
