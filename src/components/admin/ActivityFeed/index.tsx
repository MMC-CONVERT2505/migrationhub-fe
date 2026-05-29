import React from 'react';
import { cn } from '@/utils/format';
import { ACTIVITY_FEED } from '@/constants/admin';
import type { FeedItemType } from '@/types';

const DOT_COLOR: Record<FeedItemType, string> = {
  success: 'bg-green-500',
  info:    'bg-blue-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
};

export const ActivityFeed: React.FC = () => (
  <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card h-full">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-light">
      <h3 className="text-sm font-bold text-text-primary">Live Activity</h3>
      <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
        Live
      </div>
    </div>

    {/* Feed items */}
    <div className="divide-y divide-border overflow-y-auto max-h-[520px]">
      {ACTIVITY_FEED.map((item, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-bg-light transition-colors">
          {/* Dot */}
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1.5', DOT_COLOR[item.type])} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-primary leading-relaxed">
              <span className="font-semibold">{item.title}</span>
              {' — '}
              {item.description}
            </p>
            <p className="text-[10px] text-text-tertiary font-mono mt-0.5">{item.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
