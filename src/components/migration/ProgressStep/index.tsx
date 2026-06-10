import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { DATA_CATEGORIES } from '@/constants/pairs';
import { useAppStore } from '@/store/appStore';
import { useNavigate } from 'react-router-dom';

type CategoryStatus = 'queued' | 'running' | 'done';

interface CategoryProgress {
  pct: number;
  status: CategoryStatus;
}

export const ProgressStep: React.FC = () => {
  const navigate = useNavigate();
  const { selectedDataCategories, completeMigration, migrationComplete, resetMigration } = useAppStore((s) => ({
    selectedDataCategories: s.selectedDataCategories,
    completeMigration: s.completeMigration,
    migrationComplete: s.migrationComplete,
    resetMigration: s.resetMigration,
  }));

  const categories = DATA_CATEGORIES.filter((_, i) => selectedDataCategories.includes(i));
  const migId = useRef(`MCX-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`);

  const [progress, setProgress] = useState<CategoryProgress[]>(
    categories.map((_, i) => ({ pct: 0, status: i === 0 ? 'running' : 'queued' }))
  );

  // Animate categories sequentially
  useEffect(() => {
    const runCategory = (index: number) => {
      if (index >= categories.length) {
        completeMigration();
        return;
      }

      setProgress((prev) =>
        prev.map((p, i) => (i === index ? { ...p, status: 'running' } : p))
      );

      const interval = setInterval(() => {
        setProgress((prev) => {
          const updated = [...prev];
          const cat = updated[index];
          const newPct = Math.min(cat.pct + Math.random() * 8 + 3, 100);
          updated[index] = { ...cat, pct: newPct };

          if (newPct >= 100) {
            clearInterval(interval);
            updated[index] = { pct: 100, status: 'done' };
            // Start next after short delay
            setTimeout(() => runCategory(index + 1), 300);
          }

          return updated;
        });
      }, 180);
    };

    // Start with a small delay
    const timeout = setTimeout(() => runCategory(0), 600);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDone = () => {
    resetMigration();
    navigate('/');
  };

  const statusBadge = (status: CategoryStatus) => {
    const map: Record<CategoryStatus, string> = {
      queued:  'bg-bg-lighter text-text-tertiary',
      running: 'bg-blue-50 text-blue-700',
      done:    'bg-green-50 text-green-700',
    };
    const label: Record<CategoryStatus, string> = { queued: 'Queued', running: 'Running', done: 'Done' };
    return (
      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full min-w-[52px] text-center inline-block', map[status])}>
        {label[status]}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">
          {migrationComplete ? 'Migration complete!' : 'Migration in progress'}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {migrationComplete
            ? 'All records transferred and verified successfully.'
            : 'Do not close this window. A confirmation email will be sent when complete.'}
        </p>
      </div>

      {/* Progress panel */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card mb-4">
        {/* Panel header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-bg-light">
          {!migrationComplete && (
            <div className="w-5 h-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin flex-shrink-0" />
          )}
          {migrationComplete && (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {migrationComplete ? 'Migration complete' : 'Processing records…'}
            </p>
            <p className="text-xs text-text-tertiary font-mono">Migration ID: {migId.current}</p>
          </div>
        </div>

        {/* Category rows */}
        {categories.map((cat, i) => (
          <div key={cat.name} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-2 min-w-[180px] text-sm font-medium text-text-primary">
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
            <div className="flex-1 h-2 bg-bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  progress[i]?.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
                )}
                style={{ width: `${progress[i]?.pct ?? 0}%` }}
              />
            </div>
            <span className="text-xs font-mono text-text-secondary w-10 text-right">
              {Math.round(progress[i]?.pct ?? 0)}%
            </span>
            {statusBadge(progress[i]?.status ?? 'queued')}
          </div>
        ))}
      </div>

      {/* Done banner */}
      {migrationComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-green-800 mb-1">Migration complete!</h3>
          <p className="text-sm text-green-700 mb-4">
            All records transferred and verified. A full report has been sent to your billing email.
          </p>
          <Button variant="primary" size="md" onClick={handleDone}>
            Return to home
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
