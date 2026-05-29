import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { StepBar } from '@/components/migration/StepBar';
import { ConnectStep } from '@/components/migration/ConnectStep';
import { DataSelector } from '@/components/migration/DataSelector';
import { ReviewStep } from '@/components/migration/ReviewStep';
import { ProgressStep } from '@/components/migration/ProgressStep';
import { PAIRS } from '@/constants/pairs';
import { useAppStore } from '@/store/appStore';

const MigrationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedPairIndex,
    migrationStep,
    nextMigrationStep,
    prevMigrationStep,
  } = useAppStore((s) => ({
    selectedPairIndex:    s.selectedPairIndex,
    migrationStep:        s.migrationStep,
    nextMigrationStep:    s.nextMigrationStep,
    prevMigrationStep:    s.prevMigrationStep,
  }));

  // Guard
  const pair = selectedPairIndex !== null ? PAIRS[selectedPairIndex] : null;
  if (!pair) {
    navigate('/');
    return null;
  }

  const handleStart = () => {
    nextMigrationStep(); // moves from step 4 → 5
  };

  return (
    <div className="min-h-screen bg-bg animate-screen-enter">
      <Navbar variant="migration" />

      {/* Migration header */}
      <div className="bg-bg-light border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <p className="text-xs text-text-tertiary font-mono mb-2">
            MMC Convert <span className="text-text-secondary">/ Migration Pairs /</span>{' '}
            {pair.src} → {pair.dst}
          </p>

          <div className="flex items-start gap-4">
            {/* Platform logos */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                style={{ backgroundColor: pair.srcColor }}
              >
                {pair.srcAbbr}
              </div>
              <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                style={{ backgroundColor: pair.dstColor }}
              >
                {pair.dstAbbr}
              </div>
            </div>

            {/* Info */}
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {pair.src} → {pair.dst} Migration
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                Enterprise accounting data migration · Powered by MMC Convert
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {['Read-only source', 'SSL encrypted', 'Payment verified', 'Full history included'].map((badge) => (
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
    </div>
  );
};

export default MigrationPage;
