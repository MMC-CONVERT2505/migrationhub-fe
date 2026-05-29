import React from 'react';

interface DividerProps {
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ label = 'or' }) => (
  <div className="relative flex items-center gap-3 my-5">
    <div className="flex-1 h-px bg-border" />
    <span className="text-xs text-text-tertiary font-medium px-1">{label}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);
