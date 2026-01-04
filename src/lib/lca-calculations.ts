import { LCAInput, LCAResult, ImpactResult, Hotspot, SDGAlignment, SustainabilityScore, ValidationWarning, WasteOutput } from '@/types/lca';

// IPCC AR6 Emission factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  electricity: 0.436, // kg CO2e/kWh (global average IPCC AR6)
  natural_gas: 2.02, // kg CO2e/m³ (IPCC)
  diesel: 2.68, // kg CO2e/L (IPCC)
  coal: 2.42, // kg CO2e/kg (IPCC)
  renewable: 0.012, // kg CO2e/kWh (lifecycle emissions)
};

// Ecoinvent transport emission factors (kg CO2e per tonne-km)
const TRANSPORT_FACTORS = {
  truck: 0.0621, // Ecoinvent 3.9
  rail: 0.0224, // Ecoinvent 3.9
  ship: 0.0082, // Ecoinvent 3.9
  air: 0.6023, // Ecoinvent 3.9
};

// IPCC GWP100 factors
const GWP_FACTORS: Record<string, number> = {
  co2: 1,
  ch4: 29.8, // IPCC AR6
  n2o: 273, // IPCC AR6
  sf6: 25200, // IPCC AR6
  hfc: 1530, // IPCC AR6 average
  pfc: 9200, // IPCC AR6 average
};

// Water impact factor (kg CO2e per m³) - Ecoinvent
const WATER_FACTOR = 0.344;

// Industry benchmarks (Ecoinvent 3.9)
const BENCHMARKS = {
  electricity_per_tonne: 500, // kWh per tonne of processed material
  water_per_tonne: 5, // m³ per tonne
  emission_factor_default: 1.5, // kg CO2e per kg emission
  transport_distance: 200, // km average
  waste_recycle_rate: 0.3, // 30% industry average
};

export function validateAndApplyBenchmarks(input: LCAInput): { validatedInput: LCAInput; warnings: ValidationWarning[] } {
  const warnings: ValidationWarning[] = [];
  const validatedInput = { ...input };

  // Calculate total material weight for benchmarks
  const totalMaterialKg = input.rawMaterials.reduce((sum, m) => {
    return sum + (m.unit === 'tonnes' ? m.quantity * 1000 : m.quantity);
  }, 0) || 1000; // Default to 1000kg if no materials

  // Validate energy - if no energy data, apply benchmark
  if (input.energy.length === 0 || input.energy.every(e => e.amount === 0)) {
    const benchmarkEnergy = (totalMaterialKg / 1000) * BENCHMARKS.electricity_per_tonne;
    validatedInput.energy = [{ type: 'electricity', amount: benchmarkEnergy, unit: 'kWh' }];
    warnings.push({
      field: 'Energy',
      message: `No energy data provided. Using industry benchmark: ${benchmarkEnergy.toFixed(0)} kWh`,
      usedBenchmark: true,
      benchmarkValue: benchmarkEnergy,
    });
  }

  // Validate water - if zero, apply benchmark
  if (input.water.consumption === 0) {
    const benchmarkWater = (totalMaterialKg / 1000) * BENCHMARKS.water_per_tonne;
    validatedInput.water = { ...input.water, consumption: benchmarkWater };
    warnings.push({
      field: 'Water',
      message: `No water consumption data. Using industry benchmark: ${benchmarkWater.toFixed(1)} m³`,
      usedBenchmark: true,
      benchmarkValue: benchmarkWater,
    });
  }

  // Validate transport - if no transport data
  if (input.transport.length === 0 || input.transport.every(t => t.distance === 0)) {
    validatedInput.transport = [{ mode: 'truck', distance: BENCHMARKS.transport_distance, loadWeight: totalMaterialKg }];
    warnings.push({
      field: 'Transport',
      message: `No transport data. Using industry average: ${BENCHMARKS.transport_distance} km by truck`,
      usedBenchmark: true,
      benchmarkValue: BENCHMARKS.transport_distance,
    });
  }

  // Warn about missing emissions data
  if (input.emissions.length === 0 || input.emissions.every(e => e.amount === 0)) {
    warnings.push({
      field: 'Emissions',
      message: 'No direct emissions specified. Only indirect emissions from energy will be calculated.',
      usedBenchmark: false,
    });
  }

  // Validate project name
  if (!input.projectName || input.projectName.trim() === '') {
    validatedInput.projectName = 'Unnamed LCA Project';
    warnings.push({
      field: 'Project Name',
      message: 'Project name was empty. Using default name.',
      usedBenchmark: false,
    });
  }

  return { validatedInput, warnings };
}

export function calculateGWP(input: LCAInput): number {
  let totalGWP = 0;

  // Energy-related emissions (using IPCC factors)
  input.energy.forEach((e) => {
    const factor = EMISSION_FACTORS[e.type] || EMISSION_FACTORS.electricity;
    totalGWP += e.amount * factor;
  });

  // Direct emissions with IPCC GWP100 factors
  input.emissions.forEach((e) => {
    const emissionType = e.type.toLowerCase().replace(/[^a-z0-9]/g, '');
    const gwpFactor = Object.entries(GWP_FACTORS).find(([key]) => 
      emissionType.includes(key)
    )?.[1] || 1;
    totalGWP += e.amount * gwpFactor;
  });

  // Transport emissions (Ecoinvent factors)
  input.transport.forEach((t) => {
    const factor = TRANSPORT_FACTORS[t.mode];
    totalGWP += (t.distance * t.loadWeight * factor) / 1000;
  });

  // Water-related emissions
  totalGWP += input.water.consumption * WATER_FACTOR;

  return Math.round(totalGWP * 100) / 100;
}

export function calculateEnergyIntensity(input: LCAInput): number {
  let totalEnergy = 0;
  let totalMaterial = 0;

  input.energy.forEach((e) => {
    // Convert all to MJ
    if (e.unit === 'kWh') {
      totalEnergy += e.amount * 3.6;
    } else if (e.unit === 'MJ') {
      totalEnergy += e.amount;
    } else {
      totalEnergy += e.amount * 3.6; // Assume kWh if unknown
    }
  });

  input.rawMaterials.forEach((m) => {
    if (m.unit === 'kg' || m.unit === 'tonnes') {
      totalMaterial += m.unit === 'tonnes' ? m.quantity * 1000 : m.quantity;
    }
  });

  return totalMaterial > 0 ? Math.round((totalEnergy / totalMaterial) * 100) / 100 : 0;
}

export function calculateWaterFootprint(input: LCAInput): number {
  const netConsumption = input.water.consumption - input.water.recycled;
  return Math.round(Math.max(0, netConsumption) * 100) / 100;
}

export function calculateMCI(input: LCAInput): number {
  // Material Circularity Index (Ellen MacArthur Foundation methodology)
  // MCI = 1 - LFI * (0.9 / F(X))
  // Simplified calculation based on recycled content and recyclability
  
  const totalMaterial = input.rawMaterials.reduce((sum, m) => {
    return sum + (m.unit === 'tonnes' ? m.quantity * 1000 : m.quantity);
  }, 0);

  if (totalMaterial === 0) return 0;

  // Water recycling rate as proxy for circularity
  const waterRecycleRate = input.water.consumption > 0 
    ? input.water.recycled / input.water.consumption 
    : 0;

  // Renewable energy share
  const renewableEnergy = input.energy.filter(e => e.type === 'renewable');
  const totalEnergy = input.energy.reduce((sum, e) => sum + e.amount, 0);
  const renewableShare = totalEnergy > 0 
    ? renewableEnergy.reduce((sum, e) => sum + e.amount, 0) / totalEnergy 
    : 0;

  // Waste recycling (if available)
  const wasteRecycleRate = input.waste?.length 
    ? input.waste.reduce((sum, w) => sum + (w.recycled / Math.max(w.amount, 1)), 0) / input.waste.length
    : BENCHMARKS.waste_recycle_rate;

  // Weighted MCI calculation
  const mci = (waterRecycleRate * 0.3 + renewableShare * 0.3 + wasteRecycleRate * 0.4) * 100;
  
  return Math.round(Math.min(100, mci) * 10) / 10;
}

export function calculateSustainabilityScore(
  input: LCAInput,
  gwp: number,
  energyIntensity: number,
  waterFootprint: number
): SustainabilityScore {
  // Calculate individual scores (0-100)
  const totalMaterial = input.rawMaterials.reduce((sum, m) => 
    sum + (m.unit === 'tonnes' ? m.quantity * 1000 : m.quantity), 0) || 1000;

  // GWP Score (lower is better) - normalized to kg CO2e per tonne
  const gwpPerTonne = (gwp / totalMaterial) * 1000;
  const gwpScore = Math.max(0, Math.min(100, 100 - (gwpPerTonne / 20))); // 2000 kg CO2e/t = 0

  // Energy Score (based on energy intensity)
  const energyScore = Math.max(0, Math.min(100, 100 - (energyIntensity / 1))); // 100 MJ/kg = 0

  // Water Score (based on net consumption per tonne)
  const waterPerTonne = (waterFootprint / totalMaterial) * 1000;
  const waterScore = Math.max(0, Math.min(100, 100 - (waterPerTonne / 0.1))); // 10 m³/t = 0

  // Waste Score (if available, otherwise use water recycling as proxy)
  const wasteRecycleRate = input.waste?.length 
    ? input.waste.reduce((sum, w) => sum + (w.recycled / Math.max(w.amount, 1)), 0) / input.waste.length * 100
    : (input.water.recycled / Math.max(input.water.consumption, 1)) * 100;
  const wasteScore = Math.min(100, wasteRecycleRate);

  // MCI Score
  const mciScore = calculateMCI(input);

  // Overall weighted score
  const overall = Math.round(
    gwpScore * 0.30 +
    energyScore * 0.25 +
    waterScore * 0.15 +
    wasteScore * 0.15 +
    mciScore * 0.15
  );

  // Grade assignment
  let grade: SustainabilityScore['grade'];
  if (overall >= 80) grade = 'A';
  else if (overall >= 65) grade = 'B';
  else if (overall >= 50) grade = 'C';
  else if (overall >= 35) grade = 'D';
  else grade = 'F';

  return {
    overall,
    gwpScore: Math.round(gwpScore),
    energyScore: Math.round(energyScore),
    waterScore: Math.round(waterScore),
    wasteScore: Math.round(wasteScore),
    mciScore: Math.round(mciScore),
    grade,
  };
}

export function identifyHotspots(input: LCAInput): Hotspot[] {
  const hotspots: Hotspot[] = [];
  const totalGWP = calculateGWP(input);

  if (totalGWP === 0) return hotspots;

  // Energy hotspot
  let energyGWP = 0;
  input.energy.forEach((e) => {
    const factor = EMISSION_FACTORS[e.type] || EMISSION_FACTORS.electricity;
    energyGWP += e.amount * factor;
  });
  if (energyGWP > 0) {
    const contribution = (energyGWP / totalGWP) * 100;
    hotspots.push({
      area: 'Energy Consumption',
      impact: energyGWP,
      contribution: Math.round(contribution),
      recommendation: contribution > 40 
        ? 'PRIORITY: Transition to renewable energy sources - potential 80%+ reduction'
        : 'Optimize energy efficiency through process improvements',
    });
  }

  // Transport hotspot
  let transportGWP = 0;
  input.transport.forEach((t) => {
    const factor = TRANSPORT_FACTORS[t.mode];
    transportGWP += (t.distance * t.loadWeight * factor) / 1000;
  });
  if (transportGWP > 0) {
    const contribution = (transportGWP / totalGWP) * 100;
    hotspots.push({
      area: 'Transportation',
      impact: transportGWP,
      contribution: Math.round(contribution),
      recommendation: contribution > 20
        ? 'PRIORITY: Shift to rail/ship transport or optimize routes'
        : 'Consider local sourcing to reduce transport distances',
    });
  }

  // Direct emissions hotspot
  let directGWP = 0;
  input.emissions.forEach((e) => {
    const emissionType = e.type.toLowerCase().replace(/[^a-z0-9]/g, '');
    const gwpFactor = Object.entries(GWP_FACTORS).find(([key]) => 
      emissionType.includes(key)
    )?.[1] || 1;
    directGWP += e.amount * gwpFactor;
  });
  if (directGWP > 0) {
    const contribution = (directGWP / totalGWP) * 100;
    hotspots.push({
      area: 'Direct Process Emissions',
      impact: directGWP,
      contribution: Math.round(contribution),
      recommendation: contribution > 30
        ? 'PRIORITY: Implement emission capture or process optimization'
        : 'Monitor and report emissions for continuous improvement',
    });
  }

  // Water hotspot
  const waterGWP = input.water.consumption * WATER_FACTOR;
  if (waterGWP > 0) {
    const contribution = (waterGWP / totalGWP) * 100;
    const recycleRate = (input.water.recycled / input.water.consumption) * 100;
    hotspots.push({
      area: 'Water Usage',
      impact: waterGWP,
      contribution: Math.round(contribution),
      recommendation: recycleRate < 50
        ? 'Implement closed-loop water recycling systems'
        : 'Good recycling rate - focus on water treatment efficiency',
    });
  }

  return hotspots.sort((a, b) => b.contribution - a.contribution);
}

export function calculateSDGAlignment(input: LCAInput, gwp: number): SDGAlignment[] {
  const alignments: SDGAlignment[] = [];
  
  // SDG 9: Industry, Innovation, Infrastructure
  const renewableEnergy = input.energy.filter(e => e.type === 'renewable');
  const totalEnergy = input.energy.reduce((sum, e) => sum + e.amount, 0);
  const renewableShare = totalEnergy > 0 
    ? (renewableEnergy.reduce((sum, e) => sum + e.amount, 0) / totalEnergy) * 100 
    : 0;

  alignments.push({
    sdg: 9,
    title: 'Industry, Innovation & Infrastructure',
    alignment: renewableShare > 30 ? 'positive' : renewableShare > 10 ? 'neutral' : 'negative',
    description: renewableShare > 30
      ? `${renewableShare.toFixed(0)}% renewable energy supports sustainable industrialization`
      : 'Opportunity to increase renewable energy adoption in operations',
  });

  // SDG 12: Responsible Consumption and Production
  const recycleRate = input.water.consumption > 0 
    ? (input.water.recycled / input.water.consumption) * 100 
    : 0;

  alignments.push({
    sdg: 12,
    title: 'Responsible Consumption & Production',
    alignment: recycleRate > 50 ? 'positive' : recycleRate > 25 ? 'neutral' : 'negative',
    description: recycleRate > 50
      ? `Excellent ${recycleRate.toFixed(0)}% water recycling rate supports circular economy`
      : 'Implement circular economy practices for materials and water',
  });

  // SDG 13: Climate Action
  const totalMaterial = input.rawMaterials.reduce((sum, m) => 
    sum + (m.unit === 'tonnes' ? m.quantity * 1000 : m.quantity), 0) || 1;
  const gwpPerTonne = (gwp / totalMaterial) * 1000;

  alignments.push({
    sdg: 13,
    title: 'Climate Action',
    alignment: gwpPerTonne < 500 ? 'positive' : gwpPerTonne < 1000 ? 'neutral' : 'negative',
    description: gwpPerTonne < 500
      ? 'Low carbon intensity aligns with Paris Agreement goals'
      : `Carbon intensity of ${gwpPerTonne.toFixed(0)} kg CO2e/tonne - reduction opportunities exist`,
  });

  return alignments;
}

export function generateLCAResult(input: LCAInput, aiRecommendations?: string[]): LCAResult {
  // Validate and apply benchmarks
  const { validatedInput, warnings } = validateAndApplyBenchmarks(input);
  
  const gwp = calculateGWP(validatedInput);
  const energyIntensity = calculateEnergyIntensity(validatedInput);
  const waterFootprint = calculateWaterFootprint(validatedInput);
  const hotspots = identifyHotspots(validatedInput);
  const sdgAlignments = calculateSDGAlignment(validatedInput, gwp);
  const sustainabilityScore = calculateSustainabilityScore(validatedInput, gwp, energyIntensity, waterFootprint);

  const impacts: ImpactResult[] = [
    {
      category: 'Global Warming Potential (GWP)',
      value: gwp,
      unit: 'kg CO2e',
      benchmark: 1000,
      status: gwp < 500 ? 'good' : gwp < 1500 ? 'warning' : 'critical',
      description: 'Total greenhouse gas emissions (IPCC AR6 factors)',
    },
    {
      category: 'Energy Intensity',
      value: energyIntensity,
      unit: 'MJ/kg',
      benchmark: 50,
      status: energyIntensity < 30 ? 'good' : energyIntensity < 70 ? 'warning' : 'critical',
      description: 'Energy consumed per unit of material processed',
    },
    {
      category: 'Water Footprint',
      value: waterFootprint,
      unit: 'm³',
      benchmark: 100,
      status: waterFootprint < 50 ? 'good' : waterFootprint < 150 ? 'warning' : 'critical',
      description: 'Net water consumption after recycling',
    },
  ];

  const recommendations = [
    hotspots[0]?.contribution > 40 
      ? `PRIORITY: Address ${hotspots[0]?.area} - contributing ${hotspots[0]?.contribution}% of total impact`
      : 'No single hotspot dominates - focus on incremental improvements across all areas',
    sdgAlignments.find(s => s.alignment === 'negative')
      ? `SDG Gap: ${sdgAlignments.find(s => s.alignment === 'negative')?.title} needs attention`
      : 'Strong SDG alignment across all measured goals',
    energyIntensity > 50 
      ? 'Consider energy audits to identify efficiency opportunities'
      : 'Energy efficiency is performing well',
    sustainabilityScore.mciScore < 30
      ? 'Improve material circularity through recycling and renewable inputs'
      : 'Good circularity practices - continue optimization',
  ];

  const circularEconomySuggestions = [
    'Implement industrial symbiosis - partner with nearby facilities for waste-to-resource exchanges',
    'Design for recyclability in product specifications',
    'Explore renewable energy PPAs (Power Purchase Agreements) for long-term decarbonization',
    'Consider carbon capture technologies for high-emission processes',
    'Optimize packaging and logistics for reduced material use',
  ];

  return {
    projectName: validatedInput.projectName,
    companyName: validatedInput.companyName,
    timestamp: new Date().toISOString(),
    impacts,
    hotspots,
    sdgAlignments,
    recommendations,
    circularEconomySuggestions,
    overallScore: sustainabilityScore.overall,
    sustainabilityScore,
    validationWarnings: warnings,
    aiRecommendations,
    isAIPowered: !!aiRecommendations && aiRecommendations.length > 0,
  };
}
