import { motion } from 'framer-motion';
import { TrendingUp, Droplets, Zap, AlertTriangle, CheckCircle, XCircle, AlertCircle, Award, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImpactResult, Hotspot, SDGAlignment, SustainabilityScore, ValidationWarning } from '@/types/lca';

interface ResultsDisplayProps {
  projectName: string;
  companyName?: string;
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

export function ResultsDisplay({
  projectName,
  companyName,
  impacts,
  hotspots,
  sdgAlignments,
  recommendations,
  circularEconomySuggestions,
  sustainabilityScore,
  validationWarnings,
  aiRecommendations,
  isAIPowered,
}: ResultsDisplayProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-success bg-success/10 border-success/30';
      case 'warning': return 'text-warning bg-warning/10 border-warning/30';
      case 'critical': return 'text-error bg-error/10 border-error/30';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <XCircle className="h-5 w-5" />;
      default: return null;
    }
  };

  const getImpactIcon = (category: string) => {
    if (category.toLowerCase().includes('warming') || category.toLowerCase().includes('gwp')) {
      return <TrendingUp className="h-5 w-5" />;
    }
    if (category.toLowerCase().includes('water')) {
      return <Droplets className="h-5 w-5" />;
    }
    return <Zap className="h-5 w-5" />;
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'positive': return 'bg-success/10 border-success text-success';
      case 'neutral': return 'bg-warning/10 border-warning text-warning';
      case 'negative': return 'bg-error/10 border-error text-error';
      default: return 'bg-muted';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-success text-success-foreground';
      case 'B': return 'bg-success/80 text-success-foreground';
      case 'C': return 'bg-warning text-warning-foreground';
      case 'D': return 'bg-warning/80 text-warning-foreground';
      case 'F': return 'bg-error text-error-foreground';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-warning mb-2">Data Validation Notices</h4>
              <ul className="text-sm text-warning/80 space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index}>
                    <span className="font-medium">{warning.field}:</span> {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sustainability Score Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {projectName}
            </h2>
            {companyName && (
              <p className="text-muted-foreground">{companyName}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {isAIPowered ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Sparkles className="h-4 w-4" /> AI-Powered Analysis
                </span>
              ) : (
                'Standard Analysis'
              )}
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * sustainabilityScore.overall) / 100}
                    className={sustainabilityScore.grade === 'A' || sustainabilityScore.grade === 'B' ? 'text-success' : sustainabilityScore.grade === 'C' ? 'text-warning' : 'text-error'}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{sustainabilityScore.overall}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground mt-2">Sustainability Score</p>
            </div>

            {/* Grade Badge */}
            <div className="text-center">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getGradeColor(sustainabilityScore.grade)}`}>
                <span className="text-3xl font-bold">{sustainabilityScore.grade}</span>
              </div>
              <p className="text-sm font-medium text-foreground mt-2">Grade</p>
            </div>

            {/* MCI */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{sustainabilityScore.mciScore}</span>
              </div>
              <p className="text-sm font-medium text-foreground mt-2">MCI</p>
              <p className="text-xs text-muted-foreground">Circularity</p>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-border">
          <ScoreBar label="GWP" score={sustainabilityScore.gwpScore} />
          <ScoreBar label="Energy" score={sustainabilityScore.energyScore} />
          <ScoreBar label="Water" score={sustainabilityScore.waterScore} />
          <ScoreBar label="Waste" score={sustainabilityScore.wasteScore} />
          <ScoreBar label="MCI" score={sustainabilityScore.mciScore} />
        </div>
      </motion.div>

      {/* Impact Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Environmental Impact Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {impacts.map((impact, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {getImpactIcon(impact.category)}
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(impact.status)}`}>
                    {getStatusIcon(impact.status)}
                    {impact.status}
                  </div>
                </div>
                <CardTitle className="text-base mt-2">{impact.category}</CardTitle>
                <CardDescription>{impact.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{impact.value.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{impact.unit}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Benchmark: {impact.benchmark.toLocaleString()} {impact.unit}
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      impact.status === 'good' ? 'bg-success' : 
                      impact.status === 'warning' ? 'bg-warning' : 'bg-error'
                    }`}
                    style={{ width: `${Math.min(100, (impact.value / impact.benchmark) * 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Hotspots */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Environmental Hotspots
        </h3>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {hotspots.map((hotspot, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${
                    hotspot.contribution > 40 ? 'bg-error text-error-foreground' : 
                    hotspot.contribution > 20 ? 'bg-warning text-warning-foreground' : 
                    'bg-success text-success-foreground'
                  }`}>
                    {hotspot.contribution}%
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{hotspot.area}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Impact: {hotspot.impact.toFixed(2)} kg CO2e
                    </div>
                    <div className="text-sm text-primary">{hotspot.recommendation}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SDG Alignment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          SDG Alignment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sdgAlignments.map((sdg, index) => (
            <Card key={index} className={`border-2 ${getAlignmentColor(sdg.alignment)}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-current/10 flex items-center justify-center font-bold text-lg">
                    {sdg.sdg}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{sdg.title}</CardTitle>
                    <Badge variant="outline" className="mt-1 capitalize">{sdg.alignment}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{sdg.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* AI Recommendations */}
      {aiRecommendations && aiRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                Generated using Gemini AI with IPCC and Ecoinvent standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {aiRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Key Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Circular Economy Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {circularEconomySuggestions.slice(0, 4).map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 70) return 'bg-success';
    if (s >= 40) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{score}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
