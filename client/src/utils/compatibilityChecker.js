/**
 * Client-side compatibility checker
 * Checks component compatibility based on structured fields
 */

export function checkCompatibility(components) {
  const issues = [];
  const warnings = [];
  let isCompatible = true;

  // Find required components
  const cpu = components.find((c) => (c.category || '').toUpperCase() === 'CPU');
  const motherboard = components.find((c) => (c.category || '').toUpperCase() === 'MOTHERBOARD');
  const psu = components.find((c) => (c.category || '').toUpperCase() === 'PSU');
  const gpu = components.find((c) => (c.category || '').toUpperCase() === 'GPU');
  const ram = components.find((c) => (c.category || '').toUpperCase() === 'RAM');
  const case_ = components.find((c) => (c.category || '').toUpperCase() === 'CASE');

  // Check CPU and Motherboard socket compatibility
  if (cpu && motherboard) {
    const cpuSocket = (cpu.socket || '').trim().toUpperCase();
    const mbSocket = (motherboard.socket || '').trim().toUpperCase();

    if (cpuSocket && mbSocket) {
      if (cpuSocket !== mbSocket) {
        issues.push(`CPU socket (${cpuSocket}) does not match Motherboard socket (${mbSocket})`);
        isCompatible = false;
      } else {
        warnings.push(`✓ CPU and Motherboard socket compatibility verified (${cpuSocket})`);
      }
    }
  }

  // Check form factor compatibility
  if (case_ && motherboard) {
    const caseFormFactor = (case_.formFactor || '').trim().toUpperCase();
    const mbFormFactor = (motherboard.formFactor || '').trim().toUpperCase();
    
    if (caseFormFactor && mbFormFactor) {
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
        issues.push(`Case form factor (${caseFormFactor}) is too small for Motherboard (${mbFormFactor})`);
        isCompatible = false;
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
    }
  }

  // Check power requirements
  if (psu) {
    const psuWattage = psu.wattage || 0;
    
    if (psuWattage > 0) {
      let totalPowerNeed = 0;
      if (cpu) totalPowerNeed += cpu.powerRequirement || 150;
      if (gpu) totalPowerNeed += gpu.powerRequirement || 200;
      totalPowerNeed += 100; // Other components
      
      if (psuWattage < totalPowerNeed) {
        issues.push(`PSU wattage (${psuWattage}W) is insufficient (estimated need: ~${totalPowerNeed}W)`);
        isCompatible = false;
      }
    }
  }

  return {
    isCompatible,
    issues,
    warnings,
    summary: issues.length === 0 ? 'Build is compatible' : 'Compatibility issues found',
  };
}
