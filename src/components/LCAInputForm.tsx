import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LCAInput, RawMaterial, EnergyInput, Emission, Transport, WaterUsage } from '@/types/lca';
import { useToast } from '@/hooks/use-toast';

interface LCAInputFormProps {
  onSubmit: (data: LCAInput) => void;
  isLoading: boolean;
}

const defaultWater: WaterUsage = {
  consumption: 0,
  discharge: 0,
  recycled: 0,
  unit: 'm³',
};

export function LCAInputForm({ onSubmit, isLoading }: LCAInputFormProps) {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState('');
  const [processType, setProcessType] = useState('');
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([
    { name: '', quantity: 0, unit: 'kg', source: '' },
  ]);
  const [energy, setEnergy] = useState<EnergyInput[]>([
    { type: 'electricity', amount: 0, unit: 'kWh' },
  ]);
  const [emissions, setEmissions] = useState<Emission[]>([
    { type: 'CO2', amount: 0, unit: 'kg' },
  ]);
  const [transport, setTransport] = useState<Transport[]>([
    { mode: 'truck', distance: 0, loadWeight: 0 },
  ]);
  const [water, setWater] = useState<WaterUsage>(defaultWater);

  const handleAddRawMaterial = () => {
    setRawMaterials([...rawMaterials, { name: '', quantity: 0, unit: 'kg', source: '' }]);
  };

  const handleRemoveRawMaterial = (index: number) => {
    if (rawMaterials.length > 1) {
      setRawMaterials(rawMaterials.filter((_, i) => i !== index));
    }
  };

  const handleAddEnergy = () => {
    setEnergy([...energy, { type: 'electricity', amount: 0, unit: 'kWh' }]);
  };

  const handleRemoveEnergy = (index: number) => {
    if (energy.length > 1) {
      setEnergy(energy.filter((_, i) => i !== index));
    }
  };

  const handleAddEmission = () => {
    setEmissions([...emissions, { type: '', amount: 0, unit: 'kg' }]);
  };

  const handleRemoveEmission = (index: number) => {
    if (emissions.length > 1) {
      setEmissions(emissions.filter((_, i) => i !== index));
    }
  };

  const handleAddTransport = () => {
    setTransport([...transport, { mode: 'truck', distance: 0, loadWeight: 0 }]);
  };

  const handleRemoveTransport = (index: number) => {
    if (transport.length > 1) {
      setTransport(transport.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, string>[];
          
          // Parse project name and process type from first row or metadata
          const firstRow = data[0] || {};
          const parsedProjectName = firstRow.project_name || firstRow.projectName || 
                                    file.name.replace('.csv', '').replace(/_/g, ' ') || 
                                    'LCA Analysis Project';
          const parsedProcessType = firstRow.process_type || firstRow.processType || 
                                   firstRow.process || 'Metallurgical Processing';
          
          setProjectName(parsedProjectName);
          setProcessType(parsedProcessType);
          
          // Parse raw materials
          const materials = data
            .filter((row) => row.material_name || row.materialName)
            .map((row) => ({
              name: row.material_name || row.materialName || '',
              quantity: parseFloat(row.quantity) || 0,
              unit: row.unit || 'kg',
              source: row.source || '',
            }));
          
          if (materials.length > 0) {
            setRawMaterials(materials);
          }

          // Parse energy data
          const energyData = data
            .filter((row) => row.energy_type || row.energyType)
            .map((row) => ({
              type: (row.energy_type || row.energyType || 'electricity') as EnergyInput['type'],
              amount: parseFloat(row.energy_amount || row.energyAmount) || 0,
              unit: row.energy_unit || row.energyUnit || 'kWh',
            }));
          
          if (energyData.length > 0) {
            setEnergy(energyData);
          }

          // Parse emissions data
          const emissionsData = data
            .filter((row) => row.emission_type || row.emissionType || row.emission)
            .map((row) => ({
              type: row.emission_type || row.emissionType || row.emission || 'CO2',
              amount: parseFloat(row.emission_amount || row.emissionAmount) || 0,
              unit: row.emission_unit || row.emissionUnit || 'kg',
            }));
          
          if (emissionsData.length > 0) {
            setEmissions(emissionsData);
          }

          // Parse transport data
          const transportData = data
            .filter((row) => row.transport_mode || row.transportMode || row.transport)
            .map((row) => ({
              mode: (row.transport_mode || row.transportMode || row.transport || 'truck') as Transport['mode'],
              distance: parseFloat(row.distance) || 0,
              loadWeight: parseFloat(row.load_weight || row.loadWeight) || 0,
            }));
          
          if (transportData.length > 0) {
            setTransport(transportData);
          }

          // Parse water data
          const waterRow = data.find((row) => row.water_consumption || row.waterConsumption);
          if (waterRow) {
            setWater({
              consumption: parseFloat(waterRow.water_consumption || waterRow.waterConsumption) || 0,
              discharge: parseFloat(waterRow.water_discharge || waterRow.waterDischarge) || 0,
              recycled: parseFloat(waterRow.water_recycled || waterRow.waterRecycled) || 0,
              unit: 'm³',
            });
          }

          // Prepare the complete input data
          const inputData: LCAInput = {
            projectName: parsedProjectName,
            processType: parsedProcessType,
            rawMaterials: materials.filter((m) => m.name && m.quantity > 0),
            energy: energyData.filter((e) => e.amount > 0),
            emissions: emissionsData.filter((e) => e.type && e.amount > 0),
            water: waterRow ? {
              consumption: parseFloat(waterRow.water_consumption || waterRow.waterConsumption) || 0,
              discharge: parseFloat(waterRow.water_discharge || waterRow.waterDischarge) || 0,
              recycled: parseFloat(waterRow.water_recycled || waterRow.waterRecycled) || 0,
              unit: 'm³',
            } : defaultWater,
            transport: transportData.filter((t) => t.distance > 0),
          };

          // Validate that we have at least some data
          const hasData = inputData.rawMaterials.length > 0 || 
                         inputData.energy.length > 0 || 
                         inputData.emissions.length > 0 ||
                         inputData.water.consumption > 0;

          if (!hasData) {
            toast({
              title: '⚠️ No Valid Data Found',
              description: 'The CSV file does not contain valid LCA data. Please check the format.',
              variant: 'destructive',
            });
            return;
          }

          toast({
            title: '📊 Data Imported Successfully!',
            description: `Loaded ${materials.length} materials, ${energyData.length} energy sources. Generating report...`,
          });

          // Automatically submit to generate report
          setTimeout(() => {
            onSubmit(inputData);
          }, 500); // Small delay to show the toast message

        } catch (error) {
          console.error('CSV parsing error:', error);
          toast({
            title: 'Import Error',
            description: 'Could not parse the CSV file. Please check the format.',
            variant: 'destructive',
          });
        }
      },
      error: (error) => {
        console.error('PapaParse error:', error);
        toast({
          title: 'File Error',
          description: 'Could not read the file. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      toast({
        title: 'Missing Project Name',
        description: 'Please enter a project name to continue.',
        variant: 'destructive',
      });
      return;
    }

    const input: LCAInput = {
      projectName,
      processType,
      rawMaterials: rawMaterials.filter((m) => m.name && m.quantity > 0),
      energy: energy.filter((e) => e.amount > 0),
      emissions: emissions.filter((e) => e.type && e.amount > 0),
      water,
      transport: transport.filter((t) => t.distance > 0),
    };

    onSubmit(input);
  };

  const loadSampleData = () => {
    setProjectName('Copper Extraction Process');
    setProcessType('Hydrometallurgical Processing');
    setRawMaterials([
      { name: 'Copper Ore', quantity: 10000, unit: 'kg', source: 'Open Pit Mine' },
      { name: 'Sulfuric Acid', quantity: 500, unit: 'kg', source: 'Chemical Supplier' },
      { name: 'Water', quantity: 5000, unit: 'L', source: 'Municipal Supply' },
    ]);
    setEnergy([
      { type: 'electricity', amount: 15000, unit: 'kWh' },
      { type: 'diesel', amount: 800, unit: 'L' },
      { type: 'renewable', amount: 3000, unit: 'kWh' },
    ]);
    setEmissions([
      { type: 'CO2', amount: 8500, unit: 'kg' },
      { type: 'SO2', amount: 120, unit: 'kg' },
      { type: 'NOx', amount: 45, unit: 'kg' },
    ]);
    setWater({
      consumption: 5000,
      discharge: 3500,
      recycled: 2000,
      unit: 'm³',
    });
    setTransport([
      { mode: 'truck', distance: 150, loadWeight: 10000 },
      { mode: 'rail', distance: 500, loadWeight: 10000 },
    ]);

    toast({
      title: '🧪 Sample Data Loaded!',
      description: 'Copper extraction process data ready for analysis.',
    });
  };

  const loadSampleCSV = () => {
    // Sample CSV data matching the simple-lca-example.csv format
    const sampleCSV = `project_name,process_type,material_name,quantity,unit,source,energy_type,energy_amount,energy_unit,emission_type,emission_amount,emission_unit,transport_mode,distance,load_weight,water_consumption,water_discharge,water_recycled
Iron Ore Processing Project,Pyrometallurgical Processing,Iron Ore,50000,kg,Underground Mine,electricity,8000,kWh,CO2,4000,kg,truck,200,50000,1000,300,200
Iron Ore Processing Project,Pyrometallurgical Processing,Coke,5000,kg,Coal Plant,coal,2000,kWh,CO2,1500,kg,rail,300,5000,,,
Iron Ore Processing Project,Pyrometallurgical Processing,Limestone,3000,kg,Quarry,electricity,500,kWh,CO2,250,kg,truck,50,3000,,,`;

    try {
      const results = Papa.parse(sampleCSV, {
        header: true,
        skipEmptyLines: true,
      });

      const data = results.data as Record<string, string>[];
      
      // Parse project name and process type from first row
      const firstRow = data[0] || {};
      const parsedProjectName = firstRow.project_name || firstRow.projectName || 'Iron Ore Processing Project';
      const parsedProcessType = firstRow.process_type || firstRow.processType || 'Pyrometallurgical Processing';
      
      setProjectName(parsedProjectName);
      setProcessType(parsedProcessType);
      
      // Parse raw materials
      const materials = data
        .filter((row) => row.material_name || row.materialName)
        .map((row) => ({
          name: row.material_name || row.materialName || '',
          quantity: parseFloat(row.quantity) || 0,
          unit: row.unit || 'kg',
          source: row.source || '',
        }));
      
      if (materials.length > 0) {
        setRawMaterials(materials);
      }

      // Parse energy data
      const energyData = data
        .filter((row) => row.energy_type || row.energyType)
        .map((row) => ({
          type: (row.energy_type || row.energyType || 'electricity') as EnergyInput['type'],
          amount: parseFloat(row.energy_amount || row.energyAmount) || 0,
          unit: row.energy_unit || row.energyUnit || 'kWh',
        }));
      
      if (energyData.length > 0) {
        setEnergy(energyData);
      }

      // Parse emissions data
      const emissionsData = data
        .filter((row) => row.emission_type || row.emissionType || row.emission)
        .map((row) => ({
          type: row.emission_type || row.emissionType || row.emission || 'CO2',
          amount: parseFloat(row.emission_amount || row.emissionAmount) || 0,
          unit: row.emission_unit || row.emissionUnit || 'kg',
        }));
      
      if (emissionsData.length > 0) {
        setEmissions(emissionsData);
      }

      // Parse transport data
      const transportData = data
        .filter((row) => row.transport_mode || row.transportMode || row.transport)
        .map((row) => ({
          mode: (row.transport_mode || row.transportMode || row.transport || 'truck') as Transport['mode'],
          distance: parseFloat(row.distance) || 0,
          loadWeight: parseFloat(row.load_weight || row.loadWeight) || 0,
        }));
      
      if (transportData.length > 0) {
        setTransport(transportData);
      }

      // Parse water data
      const waterRow = data.find((row) => row.water_consumption || row.waterConsumption);
      if (waterRow) {
        setWater({
          consumption: parseFloat(waterRow.water_consumption || waterRow.waterConsumption) || 0,
          discharge: parseFloat(waterRow.water_discharge || waterRow.waterDischarge) || 0,
          recycled: parseFloat(waterRow.water_recycled || waterRow.waterRecycled) || 0,
          unit: 'm³',
        });
      }

      // Prepare the complete input data
      const inputData: LCAInput = {
        projectName: parsedProjectName,
        processType: parsedProcessType,
        rawMaterials: materials.filter((m) => m.name && m.quantity > 0),
        energy: energyData.filter((e) => e.amount > 0),
        emissions: emissionsData.filter((e) => e.type && e.amount > 0),
        water: waterRow ? {
          consumption: parseFloat(waterRow.water_consumption || waterRow.waterConsumption) || 0,
          discharge: parseFloat(waterRow.water_discharge || waterRow.waterDischarge) || 0,
          recycled: parseFloat(waterRow.water_recycled || waterRow.waterRecycled) || 0,
          unit: 'm³',
        } : defaultWater,
        transport: transportData.filter((t) => t.distance > 0),
      };

      // Validate that we have at least some data
      const hasData = inputData.rawMaterials.length > 0 || 
                     inputData.energy.length > 0 || 
                     inputData.emissions.length > 0 ||
                     inputData.water.consumption > 0;

      if (!hasData) {
        toast({
          title: '⚠️ No Valid Data Found',
          description: 'The sample CSV does not contain valid LCA data.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: '📊 Sample CSV Loaded!',
        description: `Loaded ${materials.length} materials, ${energyData.length} energy sources. Generating report...`,
      });

      // Automatically submit to generate report
      setTimeout(() => {
        onSubmit(inputData);
      }, 500);

    } catch (error) {
      console.error('Sample CSV parsing error:', error);
      toast({
        title: 'Import Error',
        description: 'Could not parse the sample CSV data.',
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">LCA Data Input</h2>
          <p className="text-muted-foreground">Enter your process data or upload a CSV file</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button type="button" variant="secondary" onClick={loadSampleData}>
            <FileSpreadsheet className="h-4 w-4" />
            Load Sample
          </Button>
          <Button type="button" variant="secondary" onClick={loadSampleCSV}>
            <FileSpreadsheet className="h-4 w-4" />
            Load Sample CSV
          </Button>
          <label className="cursor-pointer">
            <Button type="button" variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4" />
                Upload CSV
              </span>
            </Button>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Project Info */}
      <Card variant="nature">
        <CardHeader>
          <CardTitle className="text-lg">📋 Project Information</CardTitle>
          <CardDescription>Basic details about your LCA project</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Copper Refining Process"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="processType">Process Type</Label>
            <Select value={processType} onValueChange={setProcessType}>
              <SelectTrigger>
                <SelectValue placeholder="Select process type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pyrometallurgy">Pyrometallurgical Processing</SelectItem>
                <SelectItem value="hydrometallurgy">Hydrometallurgical Processing</SelectItem>
                <SelectItem value="electrometallurgy">Electrometallurgical Processing</SelectItem>
                <SelectItem value="mining">Mining & Extraction</SelectItem>
                <SelectItem value="beneficiation">Mineral Beneficiation</SelectItem>
                <SelectItem value="smelting">Smelting & Refining</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Raw Materials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>⛏️ Raw Materials</span>
            <Button type="button" size="sm" variant="outline" onClick={handleAddRawMaterial}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rawMaterials.map((material, index) => (
            <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-2">
                <Label>Material Name</Label>
                <Input
                  value={material.name}
                  onChange={(e) => {
                    const updated = [...rawMaterials];
                    updated[index].name = e.target.value;
                    setRawMaterials(updated);
                  }}
                  placeholder="e.g., Iron Ore"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={material.quantity || ''}
                  onChange={(e) => {
                    const updated = [...rawMaterials];
                    updated[index].quantity = parseFloat(e.target.value) || 0;
                    setRawMaterials(updated);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={material.unit}
                  onValueChange={(value) => {
                    const updated = [...rawMaterials];
                    updated[index].unit = value;
                    setRawMaterials(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="tonnes">tonnes</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  value={material.source}
                  onChange={(e) => {
                    const updated = [...rawMaterials];
                    updated[index].source = e.target.value;
                    setRawMaterials(updated);
                  }}
                  placeholder="e.g., Local Mine"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveRawMaterial(index)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Energy Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>⚡ Energy Consumption</span>
            <Button type="button" size="sm" variant="outline" onClick={handleAddEnergy}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {energy.map((e, index) => (
            <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2">
                <Label>Energy Type</Label>
                <Select
                  value={e.type}
                  onValueChange={(value: EnergyInput['type']) => {
                    const updated = [...energy];
                    updated[index].type = value;
                    setEnergy(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electricity">Electricity (Grid)</SelectItem>
                    <SelectItem value="renewable">Renewable Energy</SelectItem>
                    <SelectItem value="natural_gas">Natural Gas</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="coal">Coal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={e.amount || ''}
                  onChange={(event) => {
                    const updated = [...energy];
                    updated[index].amount = parseFloat(event.target.value) || 0;
                    setEnergy(updated);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={e.unit}
                  onValueChange={(value) => {
                    const updated = [...energy];
                    updated[index].unit = value;
                    setEnergy(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kWh">kWh</SelectItem>
                    <SelectItem value="MJ">MJ</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveEnergy(index)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>💨 Direct Emissions</span>
            <Button type="button" size="sm" variant="outline" onClick={handleAddEmission}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {emissions.map((emission, index) => (
            <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2">
                <Label>Emission Type</Label>
                <Input
                  value={emission.type}
                  onChange={(e) => {
                    const updated = [...emissions];
                    updated[index].type = e.target.value;
                    setEmissions(updated);
                  }}
                  placeholder="e.g., CO2, CH4, SO2"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={emission.amount || ''}
                  onChange={(e) => {
                    const updated = [...emissions];
                    updated[index].amount = parseFloat(e.target.value) || 0;
                    setEmissions(updated);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={emission.unit}
                  onValueChange={(value) => {
                    const updated = [...emissions];
                    updated[index].unit = value;
                    setEmissions(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="tonnes">tonnes</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveEmission(index)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Water Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💧 Water Usage</CardTitle>
          <CardDescription>Water consumption, discharge, and recycling data</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Consumption (m³)</Label>
            <Input
              type="number"
              value={water.consumption || ''}
              onChange={(e) => setWater({ ...water, consumption: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Discharge (m³)</Label>
            <Input
              type="number"
              value={water.discharge || ''}
              onChange={(e) => setWater({ ...water, discharge: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label>Recycled (m³)</Label>
            <Input
              type="number"
              value={water.recycled || ''}
              onChange={(e) => setWater({ ...water, recycled: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Transport */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>🚚 Transportation</span>
            <Button type="button" size="sm" variant="outline" onClick={handleAddTransport}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transport.map((t, index) => (
            <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={t.mode}
                  onValueChange={(value: Transport['mode']) => {
                    const updated = [...transport];
                    updated[index].mode = value;
                    setTransport(updated);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="rail">Rail</SelectItem>
                    <SelectItem value="ship">Ship</SelectItem>
                    <SelectItem value="air">Air</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Distance (km)</Label>
                <Input
                  type="number"
                  value={t.distance || ''}
                  onChange={(e) => {
                    const updated = [...transport];
                    updated[index].distance = parseFloat(e.target.value) || 0;
                    setTransport(updated);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Load Weight (kg)</Label>
                <Input
                  type="number"
                  value={t.loadWeight || ''}
                  onChange={(e) => {
                    const updated = [...transport];
                    updated[index].loadWeight = parseFloat(e.target.value) || 0;
                    setTransport(updated);
                  }}
                  placeholder="0"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveTransport(index)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-center pt-4">
        <Button type="submit" variant="hero" size="xl" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              🌱 Run LCA Analysis
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
}
