import React from 'react';
import { useNavigate } from 'react-router-dom';
import { pairDisplayName } from '@/utils/platformName';
import { Navbar } from '@/components/layout/Navbar';
import { CompactFooter } from '@/components/layout/Footer';
import { FlowStepper } from '@/components/migration/FlowStepper';
import { StepBar } from '@/components/migration/StepBar';
import { ConnectStep } from '@/components/migration/ConnectStep';
import { DataSelector } from '@/components/migration/DataSelector';
import { ReviewStep } from '@/components/migration/ReviewStep';
import { ProgressStep } from '@/components/migration/ProgressStep';
import { useAppStore } from '@/store/appStore';

const MigrationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedPair,
    migrationStep,
    nextMigrationStep,
    prevMigrationStep,
  } = useAppStore((s) => ({
    selectedPair:      s.selectedPair,
    migrationStep:     s.migrationStep,
    nextMigrationStep: s.nextMigrationStep,
    prevMigrationStep: s.prevMigrationStep,
  }));

  // Guard
  if (!selectedPair) {
    navigate('/');
    return null;
  }

  const pair = selectedPair;

  const handleStart = () => {
    nextMigrationStep(); // moves from step 4 → 5
  };

  return (
    <div className="min-h-screen bg-bg animate-screen-enter flex flex-col">
      <Navbar showBack hideAuthCta />

      {/* Migration header */}
      <div className="bg-bg-light border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <p className="text-xs text-text-tertiary font-mono mb-2">
            MMC Convert <span className="text-text-secondary">/ Migration Pairs /</span>{' '}
            {pairDisplayName(pair)}
          </p>

          <div className="flex items-start gap-4">
            {/* Info */}
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {pairDisplayName(pair)} Migration
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                Enterprise accounting data migration · Powered by MMC Convert
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {['Read-only source', 'SSL encrypted', ...(pair.isFree ? [] : ['Payment verified']), 'Full history included'].map((badge) => (
                  <span
                    key={badge}
                    className="text-[10px] font-medium px-2 py-0.5 rounded border border-border text-text-tertiary bg-white"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <FlowStepper page={migrationStep >= 5 ? 'track' : 'connect'} className="max-w-xl mx-auto mb-8" />
        <StepBar currentStep={migrationStep} />

        {/* Step panels */}
        {migrationStep === 1 && (
          <ConnectStep
            role="source"
            pair={pair}
            onNext={nextMigrationStep}
          />
        )}
        {migrationStep === 2 && (
          <ConnectStep
            role="destination"
            pair={pair}
            onNext={nextMigrationStep}
            onBack={prevMigrationStep}
          />
        )}
        {migrationStep === 3 && (
          <DataSelector onNext={nextMigrationStep} onBack={prevMigrationStep} />
        )}
        {migrationStep === 4 && (
          <ReviewStep pair={pair} onStart={handleStart} onBack={prevMigrationStep} />
        )}
        {migrationStep === 5 && (
          <ProgressStep />
        )}
      </div>
      <CompactFooter />
    </div>
  );
};

export default MigrationPage;
