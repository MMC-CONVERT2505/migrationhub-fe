import React from 'react';
import { cn } from '@/utils/format';
import { useOperationTeamMember } from '@/hooks/useIsOperationTeam';

/**
 * "Operation Team" indicator for a signed-in Operation Team member; renders
 * nothing for guests, customers and admins. Operators sign in through the
 * normal Sign in page, so this just reflects their account's role.
 *
 *  - `tag`:  compact label, for use inside an existing menu/button
 *  - `pill`: standalone header indicator that also shows the person's name
 */
export const OperationTeamBadge: React.FC<{ variant?: 'tag' | 'pill'; className?: string }> = ({
  variant = 'tag',
  className,
}) => {
  const { isOperationTeam, name } = useOperationTeamMember();
  if (!isOperationTeam) return null;

  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800',
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
        <span>Operation Team</span>
        {name && <span className="max-w-[120px] truncate font-medium text-blue-700">· {name}</span>}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700',
        className,
      )}
    >
      Operation Team
    </span>
  );
};
