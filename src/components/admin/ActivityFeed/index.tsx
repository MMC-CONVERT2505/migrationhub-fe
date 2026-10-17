import React from 'react';
import { cn, principalLabel } from '@/utils/format';
import type { ActivityItem } from '@/types/api';
import type { FeedItemType } from '@/types';

const DOT_COLOR: Record<FeedItemType, string> = {
  success: 'bg-green-500',
  info:    'bg-blue-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
};

function kindToType(kind: string): FeedItemType {
  if (kind.includes('completed') || kind.includes('success')) return 'success';
  if (kind.includes('failed') || kind.includes('error'))      return 'error';
  if (kind.includes('paused') || kind.includes('warning'))    return 'warning';
  return 'info';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ items, loading }) => (
  <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card h-full">
    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-light">
      <h3 className="text-sm font-bold text-text-primary">Live Activity</h3>
      <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
        Live
      </div>
    </div>

    <div className="divide-y divide-border overflow-y-auto max-h-[520px]">
      {loading ? (
        Array(6).fill(null).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-3.5 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-bg-lighter mt-1.5 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-bg-lighter rounded w-3/4" />
              <div className="h-2.5 bg-bg-lighter rounded w-1/3" />
            </div>
          </div>
        ))
      ) : items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-text-secondary">No activity yet</div>
      ) : (
        items.map((item) => {
          const type = kindToType(item.kind);
          // Whom the event belongs to. Fall back to the performer for events with
          // no distinct owner; show nothing only when no identity could be resolved.
          const account = item.owner ?? item.actor;
          // A human (admin/user) performed it, distinct from the owning account.
          const performer =
            item.actor && item.actor.type !== 'system' && item.actor.id !== item.owner?.id
              ? principalLabel(item.actor)
              : null;
          // No human actor => automated/system-driven event (webhook, worker).
          const systemDriven = !item.actor || item.actor.type === 'system';
          return (
            <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-bg-light transition-colors">
              <div className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1.5', DOT_COLOR[type])} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary leading-relaxed">{item.displayText}</p>
                {account && (
                  <p className="text-[11px] text-text-secondary truncate mt-0.5" title={account.email ?? account.name}>
                    <span className="text-text-secondary">User:</span>{' '}
                    <span className="font-medium">{principalLabel(account)}</span>
                    {performer ? (
                      <span className="text-text-secondary"> · by {performer}</span>
                    ) : systemDriven ? (
                      <span className="text-text-secondary"> · automated</span>
                    ) : null}
                  </p>
                )}
                <p className="text-[10px] text-text-secondary font-mono mt-0.5">{relativeTime(item.createdAt)}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);
