export interface RawMaterial {
  name: string;
  quantity: number;
  unit: string;
  source: string;
}

export interface EnergyInput {
  type: 'electricity' | 'natural_gas' | 'diesel' | 'coal' | 'renewable';
  amount: number;
  unit: string;
}

export interface Emission {
  type: string;
  amount: number;
  unit: string;
}

export interface WaterUsage {
  consumption: number;
  discharge: number;
  recycled: number;
  unit: string;
}

export interface Transport {
  mode: 'truck' | 'rail' | 'ship' | 'air';
  distance: number;
  loadWeight: number;
}

export interface WasteOutput {
  type: string;
  amount: number;
  unit: string;
  recycled: number;
}

export interface LCAInput {
  projectName: string;
  processType: string;
  rawMaterials: RawMaterial[];
  energy: EnergyInput[];
  emissions: Emission[];
  water: WaterUsage;
  transport: Transport[];
  waste?: WasteOutput[];
  companyName?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  usedBenchmark: boolean;
  benchmarkValue?: number;
}

export interface ImpactResult {
  category: string;
  value: number;
  unit: string;
  benchmark: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

export interface Hotspot {
  area: string;
  impact: number;
  contribution: number;
  recommendation: string;
}

export interface SDGAlignment {
  sdg: number;
  title: string;
  alignment: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface SustainabilityScore {
  overall: number;
  gwpScore: number;
  energyScore: number;
  waterScore: number;
  wasteScore: number;
  mciScore: number; // Material Circularity Index
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface LCAResult {
  projectName: string;
  companyName?: string;
  timestamp: string;
  impacts: ImpactResult[];
  hotspots: Hotspot[];
  sdgAlignments: SDGAlignment[];
  recommendations: string[];
  circularEconomySuggestions: string[];
  overallScore: number;
  sustainabilityScore: SustainabilityScore;
  validationWarnings: ValidationWarning[];
  aiRecommendations?: string[];
  isAIPowered: boolean;
}
