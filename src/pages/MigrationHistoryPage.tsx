import React, { useEffect, useState } from 'react';
import { chargeSummary, historyText } from '@/utils/migrationCharge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { CompactFooter } from '@/components/layout/Footer';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';

import { migrationsService } from '@/api/migrations';
import { ApiError } from '@/api/client';
import { PLATFORM_COLORS, PLATFORM_ABBR } from '@/constants/logos';
import { normalizePlatform } from '@/utils/platformMap';
import type { MigrationStatus, UserMigration } from '@/types/api';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  MigrationStatus,
  { label: string; variant: 'default' | 'info' | 'success' | 'error' | 'warning'; pulse?: boolean }
> = {
  DRAFT:        { label: 'Draft',        variant: 'default' },
  QUEUED:       { label: 'Queued',       variant: 'info',    pulse: true },
  RUNNING:      { label: 'Running',      variant: 'info',    pulse: true },
  COMPLETED:    { label: 'Completed',    variant: 'success' },
  UNDER_REVIEW: { label: 'Under review', variant: 'warning' },
  FAILED:       { label: 'Failed',       variant: 'error' },
  CANCELLED:    { label: 'Cancelled',    variant: 'default' },
};

// ─── Platform pill ────────────────────────────────────────────────────────────
const PlatformPill: React.FC<{ platform: string }> = ({ platform }) => {
  const name  = normalizePlatform(platform);
  const color = PLATFORM_COLORS[name] ?? '#64748b';
  const abbr  = PLATFORM_ABBR[name] ?? name.slice(0, 2).toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold font-mono text-xs flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {abbr}
    </div>
  );
};

// ─── Single migration card ────────────────────────────────────────────────────
const MigrationCard: React.FC<{ migration: UserMigration; index: number }> = ({
  migration,
  index,
}) => {
  const navigate = useNavigate();
  const cfg      = STATUS_CONFIG[migration.status] ?? STATUS_CONFIG.DRAFT;
  const charge   = chargeSummary(migration);
  const isActive = migration.status === 'RUNNING' || migration.status === 'QUEUED';
  const isFailed = migration.status === 'FAILED';

  const formattedDate = new Date(migration.createdAt).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/migrations/${migration.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/migrations/${migration.id}`); }}
      className="bg-white border border-border rounded-xl p-5 hover:shadow-card hover:border-border-medium transition-all cursor-pointer"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <PlatformPill platform={migration.migrationPair.source} />
          <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <PlatformPill platform={migration.migrationPair.destination} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {migration.migrationPair.displayName}
            </p>
            <p className="text-xs text-text-tertiary mt-0.5">{formattedDate}</p>
          </div>
        </div>

        <Badge variant={cfg.variant} className="flex-shrink-0">
          {cfg.pulse && (
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse mr-1" />
          )}
          {cfg.label}
        </Badge>
      </div>

      {/* Progress bar — shown when running or completed */}
      {(isActive || migration.status === 'COMPLETED') && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-tertiary mb-1">
            <span>{isActive ? 'In progress' : 'Complete'}</span>
            <span className="font-mono">{migration.progress}%</span>
          </div>
          <div className="h-1.5 bg-bg-lighter rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                migration.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${migration.progress}%` }}
            />
          </div>
          {migration.currentCategory && (
            <p className="text-xs text-text-tertiary mt-1">
              Processing: <span className="font-medium text-text-secondary">{migration.currentCategory}</span>
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {isFailed && migration.errorMessage && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{migration.errorMessage}</p>
        </div>
      )}

      {/* Plan + price row */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-text-tertiary">Plan</p>
            <p className="text-sm font-semibold text-text-primary">{migration.plan.name}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-xs text-text-tertiary">History</p>
            <p className="text-sm font-medium text-text-secondary">{historyText(migration)}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-xs text-text-tertiary">{charge.label}</p>
            <p className="text-sm font-semibold text-text-primary font-mono">{charge.value}</p>
          </div>
        </div>

        {/* Action button */}
        {(migration.status === 'DRAFT' || migration.status === 'QUEUED') && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/migration'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
        {migration.status === 'RUNNING' && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/migrations/${migration.id}`); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            View live
          </button>
        )}
        {migration.status === 'COMPLETED' && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
            View summary
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        )}
        {migration.status === 'FAILED' && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/payment'); }}
            className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
          >
            Retry
          </button>
        )}
      </div>

      {/* Migration ID */}
      <p className="text-xs text-text-tertiary font-mono mt-2">ID: {migration.id}</p>
    </motion.div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const MigrationHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [migrations, setMigrations] = useState<UserMigration[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    migrationsService
      .list()
      .then((data) => {
        // Sort: active first, then by newest
        const sorted = [...data].sort((a, b) => {
          const order: MigrationStatus[] = ['RUNNING', 'QUEUED', 'DRAFT', 'FAILED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'];
          const ai = order.indexOf(a.status);
          const bi = order.indexOf(b.status);
          if (ai !== bi) return ai - bi;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setMigrations(sorted);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load migrations.'),
      )
      .finally(() => setLoading(false));
  }, []);

  const active    = migrations.filter((m) => m.status === 'RUNNING' || m.status === 'QUEUED');
  const drafts    = migrations.filter((m) => m.status === 'DRAFT');
  const completed = migrations.filter((m) => m.status === 'COMPLETED' || m.status === 'UNDER_REVIEW');
  const failed    = migrations.filter((m) => m.status === 'FAILED' || m.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar showBack />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Migrations</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Track and manage all your data migration jobs
            </p>
          </div>
          <button
            onClick={() => navigate('/payment')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New migration
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-text-secondary">Loading your migrations…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg mb-6">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && migrations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-border rounded-xl text-center">
            <div className="w-16 h-16 rounded-full bg-bg-light flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">No migrations yet</p>
            <p className="text-sm text-text-tertiary mb-6">Start your first migration to see it here.</p>
            <button
              onClick={() => navigate('/payment')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start a migration
            </button>
          </div>
        )}

        {/* Sections */}
        {!loading && migrations.length > 0 && (
          <div className="space-y-8">
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  In progress ({active.length})
                </h2>
                <div className="space-y-3">
                  {active.map((m, i) => (
                    <MigrationCard key={m.id} migration={m} index={i} />
                  ))}
                </div>
              </section>
            )}

            {drafts.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  Drafts ({drafts.length})
                </h2>
                <div className="space-y-3">
                  {drafts.map((m, i) => (
                    <MigrationCard key={m.id} migration={m} index={i} />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  Completed ({completed.length})
                </h2>
                <div className="space-y-3">
                  {completed.map((m, i) => (
                    <MigrationCard key={m.id} migration={m} index={i} />
                  ))}
                </div>
              </section>
            )}

            {failed.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  Failed / Cancelled ({failed.length})
                </h2>
                <div className="space-y-3">
                  {failed.map((m, i) => (
                    <MigrationCard key={m.id} migration={m} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      <CompactFooter />
    </div>
  );
};

export default MigrationHistoryPage;
