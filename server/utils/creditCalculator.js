// ── CREDIT CALCULATION LOGIC ───────────────────────
// Based on land size, crop type, irrigation & machines

const BASE_PER_ACRE = 8000;  // ₹8,000 per acre
const MAX_CREDIT    = 200000; // ₹2,00,000 maximum

// Crop multipliers
const CROP_MULTIPLIERS = {
  sugarcane: 1.5,
  cotton:    1.3,
  rice:      1.2,
  wheat:     1.1,
  potato:    1.1,
  onion:     1.1,
  maize:     1.0,
  mustard:   1.0,
  soybean:   1.0,
  groundnut: 1.0,
  default:   1.0,
};

// Machine daily rates
const MACHINE_RATES = {
  tractorDays:   1200,
  harvesterDays: 3500,
  seederDays:    800,
  ploughDays:    600,
  sprayerDays:   400,
};

const calculateCreditLimit = (farmProfile) => {
  if (!farmProfile || !farmProfile.landSize) return 0;

  // Step 1 — Base credit from land size
  let credit = farmProfile.landSize * BASE_PER_ACRE;

  // Step 2 — Apply crop multiplier
  if (farmProfile.cropTypes && farmProfile.cropTypes.length > 0) {
    const topCrop      = farmProfile.cropTypes[0].toLowerCase();
    const multiplier   = CROP_MULTIPLIERS[topCrop] || CROP_MULTIPLIERS.default;
    credit            *= multiplier;
  }

  // Step 3 — Irrigation bonus
  if (farmProfile.irrigation?.type === 'Drip') {
    credit *= 1.1; // 10% bonus for drip irrigation
  }

  // Step 4 — Add machine costs
  const machines = farmProfile.machines || {};
  Object.keys(MACHINE_RATES).forEach(machine => {
    credit += (machines[machine] || 0) * MACHINE_RATES[machine];
  });

  // Step 5 — Add fertilizer estimate
  credit += (farmProfile.fertilizer?.quantity || 0) * 400;

  // Step 6 — Add pesticide estimate
  credit += (farmProfile.pesticide?.quantity || 0) * 200;

  // Step 7 — Cap at maximum
  const finalCredit = Math.min(Math.round(credit), MAX_CREDIT);

  return finalCredit;
};

// Calculate interest
const calculateInterest = (principal, ratePerMonth, months) => {
  return Math.round(principal * (ratePerMonth / 100) * months);
};

// Calculate months until harvest
const calculateMonthsUntilHarvest = (harvestMonth, harvestYear) => {
  const now     = new Date();
  const harvest = new Date(harvestYear, harvestMonth - 1, 1);
  const diff    = (harvest - now) / (1000 * 60 * 60 * 24 * 30);
  return Math.max(1, Math.ceil(diff));
};

// Get credit breakdown
const getCreditBreakdown = (farmProfile) => {
  const base      = farmProfile.landSize * BASE_PER_ACRE;
  const topCrop   = farmProfile.cropTypes?.[0]?.toLowerCase() || 'default';
  const multi     = CROP_MULTIPLIERS[topCrop] || 1.0;
  const afterCrop = base * multi;

  const machines      = farmProfile.machines || {};
  let   machineTotal  = 0;
  Object.keys(MACHINE_RATES).forEach(m => {
    machineTotal += (machines[m] || 0) * MACHINE_RATES[m];
  });

  const fertTotal = (farmProfile.fertilizer?.quantity || 0) * 400;
  const pestTotal = (farmProfile.pesticide?.quantity  || 0) * 200;
  const total     = calculateCreditLimit(farmProfile);

  return {
    baseCredit:       Math.round(base),
    cropMultiplier:   multi,
    afterCropBonus:   Math.round(afterCrop),
    machineCredit:    Math.round(machineTotal),
    fertilizerCredit: Math.round(fertTotal),
    pesticideCredit:  Math.round(pestTotal),
    totalCredit:      total,
    maxLimit:         MAX_CREDIT,
    cappedAt:         total === MAX_CREDIT,
  };
};

module.exports = {
  calculateCreditLimit,
  calculateInterest,
  calculateMonthsUntilHarvest,
  getCreditBreakdown,
};