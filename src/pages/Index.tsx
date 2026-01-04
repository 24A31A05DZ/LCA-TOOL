import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, ChevronLeft, Sparkles, Leaf, Factory, TrendingDown, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { LCAInputForm } from '@/components/LCAInputForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LCAInput, LCAResult } from '@/types/lca';
import { generateLCAResult } from '@/lib/lca-calculations';
import { generatePDFReport } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type ViewState = 'landing' | 'input' | 'results';

const Index = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LCAResult | null>(null);

  const handleStartAnalysis = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to access the LCA analysis tool.',
      });
      navigate('/auth');
      return;
    }
    setView('input');
  };

  const handleSubmit = async (input: LCAInput) => {
    setIsLoading(true);
    
    try {
      // Add company info from user metadata
      const inputWithCompany: LCAInput = {
        ...input,
        companyName: user?.displayName || input.companyName || '',
      };

      // Generate initial LCA result
      const initialResult = generateLCAResult(inputWithCompany);
      
      // AI recommendations - using standard recommendations for now
      // You can integrate with your AI service later if needed
      let aiRecommendations: string[] = [];
      let isMock = true;
      
      // For now, we'll use standard recommendations
      // You can add your AI integration here if you have an API endpoint
      console.log('Using standard LCA recommendations');
      
      // Update result with recommendations
      const lcaResult = generateLCAResult(inputWithCompany, aiRecommendations);
      setResult(lcaResult);
      setView('results');
      
      toast({
        title: 'Analysis Complete!',
        description: isMock 
          ? 'Your LCA report is ready. Using standard recommendations.'
          : 'Your AI-powered LCA report is ready.',
      });
    } catch (error) {
      toast({
        title: 'Analysis Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (result) {
      generatePDFReport(result);
      toast({
        title: 'PDF Generated!',
        description: 'Your environmental compliance report has been opened in a new tab.',
      });
    }
  };

  const handleReset = () => {
    setResult(null);
    setView('input');
  };

  const handleBackToLanding = () => {
    setResult(null);
    setView('landing');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto"
            >
              {/* Hero Section */}
              <div className="text-center py-12 md:py-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
                >
                  <Sparkles className="h-4 w-4" />
                  AI-Powered Sustainability Analysis
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
                >
                  Life Cycle Assessment Tool for{' '}
                  <span className="text-primary">Metallurgy & Mining</span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
                >
                  Advancing circularity and sustainability with AI-driven environmental impact analysis. 
                  Calculate your GWP, energy intensity, and water footprint while aligning with UN SDGs 9, 12, and 13.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button size="lg" onClick={handleStartAnalysis} className="gap-2">
                    <Leaf className="h-5 w-5" />
                    Start LCA Analysis
                  </Button>
                  {!user && (
                    <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                  )}
                </motion.div>

                {!user && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-muted-foreground mt-4"
                  >
                    Sign in with your company account to access full features
                  </motion.p>
                )}
              </div>
              
              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12"
              >
                <Card className="text-center p-6">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
                      <Factory className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Cradle-to-Gate Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive environmental impact assessment from raw material extraction through production
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center p-6">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 rounded-lg bg-error flex items-center justify-center mx-auto mb-4">
                      <TrendingDown className="h-7 w-7 text-error-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">Hotspot Identification</h3>
                    <p className="text-sm text-muted-foreground">
                      Pinpoint environmental hotspots and receive AI-powered recommendations for improvement
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center p-6">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 rounded-lg bg-success flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-7 w-7 text-success-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">SDG Alignment</h3>
                    <p className="text-sm text-muted-foreground">
                      Align your operations with UN Sustainable Development Goals 9, 12, and 13
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                  Empowering Sustainable Metallurgy
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-primary">GWP</div>
                    <div className="text-sm text-muted-foreground mt-1">Global Warming Potential</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-primary">MJ/kg</div>
                    <div className="text-sm text-muted-foreground mt-1">Energy Intensity</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-primary">m³</div>
                    <div className="text-sm text-muted-foreground mt-1">Water Footprint</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-primary">MCI</div>
                    <div className="text-sm text-muted-foreground mt-1">Circularity Index</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {view === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto"
            >
              <Button
                variant="ghost"
                onClick={handleBackToLanding}
                className="mb-6"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Button>
              
              <LCAInputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </motion.div>
          )}
          
          {view === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-5xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <Button variant="ghost" onClick={handleReset}>
                  <ChevronLeft className="h-4 w-4" />
                  New Analysis
                </Button>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleReset}>
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4" />
                    Export Compliance Report
                  </Button>
                </div>
              </div>
              
              <ResultsDisplay {...result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AI-Driven Life Cycle Assessment Tool for Advancing Circularity and Sustainability in Metallurgy and Mining</p>
          <p className="mt-2">Powered by Gemini AI | IPCC AR6 & Ecoinvent Standards | Supporting UN SDGs 9, 12, 13</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
