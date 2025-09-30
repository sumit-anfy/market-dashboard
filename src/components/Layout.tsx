import React from 'react';
import { BarChart3, Clock, TrendingUp, Menu, X, ArrowLeftRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: 'historical' | 'live' | 'arbitrage' | 'covered-calls') => void;
}

export function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">Market Data Platform</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button
                variant={currentView === 'historical' ? 'default' : 'ghost'}
                onClick={() => onViewChange('historical')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Historical Data
              </Button>
              <Button
                variant={currentView === 'live' ? 'default' : 'ghost'}
                onClick={() => onViewChange('live')}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Live Data
              </Button>
              <Button
                variant={currentView === 'arbitrage' ? 'default' : 'ghost'}
                onClick={() => onViewChange('arbitrage')}
                className="flex items-center gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Arbitrage
              </Button>
              <Button
                variant={currentView === 'covered-calls' ? 'default' : 'ghost'}
                onClick={() => onViewChange('covered-calls')}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Covered Calls
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container mx-auto px-4 py-2 space-y-1">
              <Button
                variant={currentView === 'historical' ? 'default' : 'ghost'}
                onClick={() => {
                  onViewChange('historical');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Historical Data
              </Button>
              <Button
                variant={currentView === 'live' ? 'default' : 'ghost'}
                onClick={() => {
                  onViewChange('live');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start gap-2"
              >
                <Clock className="h-4 w-4" />
                Live Data
              </Button>
              <Button
                variant={currentView === 'arbitrage' ? 'default' : 'ghost'}
                onClick={() => {
                  onViewChange('arbitrage');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Arbitrage
              </Button>
              <Button
                variant={currentView === 'covered-calls' ? 'default' : 'ghost'}
                onClick={() => {
                  onViewChange('covered-calls');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start gap-2"
              >
                <Shield className="h-4 w-4" />
                Covered Calls
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}