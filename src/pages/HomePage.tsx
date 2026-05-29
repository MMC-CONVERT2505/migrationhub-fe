import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/home/Hero';
import { WorksWith } from '@/components/home/WorksWith';
import { MetricsBar } from '@/components/home/MetricsBar';
import { CompanyLogos } from '@/components/home/CompanyLogos';
import { TrustpilotSection } from '@/components/home/TrustpilotSection';
import { PairsSection } from '@/components/home/PairsSection';
import { WhySection } from '@/components/home/WhySection';
import { SafetyNet } from '@/components/home/SafetyNet';

const HomePage: React.FC = () => (
  <div className="min-h-screen bg-bg animate-screen-enter">
    <Navbar variant="default" />

    <main>
      <Hero />
      <WorksWith />
      <MetricsBar />
      <CompanyLogos />
      <TrustpilotSection />
      <PairsSection />
      <WhySection />
      <SafetyNet />
    </main>

    <Footer />
  </div>
);

export default HomePage;
