import React, { useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
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
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { usersService } from '@/api/users';

const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  // Deep-link users are locked to the migration flow — the marketing home is off-limits.
  const entryLocked = useAppStore((s) => s.entryLocked);
  const selectedPair = useAppStore((s) => s.selectedPair);
  const setEntryLocked = useAppStore((s) => s.setEntryLocked);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) return;

    setToken('user', token);
    // Remove the token from the URL so it isn't bookmarked or leaked in the browser history
    navigate('/', { replace: true });
    usersService.getMe().then((res) => setUser('user', res.data)).catch(() => {});
  }, []);

  // Clear a stale lock that has no pair to return to, so we never trap the user (or loop).
  useEffect(() => {
    if (entryLocked && !selectedPair) setEntryLocked(false);
  }, [entryLocked, selectedPair, setEntryLocked]);

  if (entryLocked && selectedPair) return <Navigate to="/migration/details" replace />;

  return (
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
};

export default HomePage;
