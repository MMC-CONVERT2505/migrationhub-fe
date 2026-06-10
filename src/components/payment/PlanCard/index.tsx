import React from 'react';
import { formatCurrency } from '@/utils/format';
import type { Plan } from '@/types';

interface PlanCardProps {
  plan: Plan;
  index: number;
  selected: boolean;
  onSelect: (planId: string) => void;
  isFree?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, index: _index, selected, onSelect, isFree = false }) => (
  <div
    onClick={() => plan.id && onSelect(plan.id)}
    style={{
      background: selected ? 'rgba(37,99,235,0.05)' : '#fff',
      border: `1.5px solid ${selected ? '#2563eb' : '#dce2ef'}`,
      borderRadius: 12,
      padding: '18px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      position: 'relative',
      transition: 'border-color .15s, background .15s',
    }}
  >
    {/* MOST POPULAR tag */}
    {plan.popular && (
      <div style={{
        position: 'absolute',
        top: -1,
        right: 14,
        background: '#2563eb',
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 10px',
        borderRadius: '0 0 6px 6px',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
      }}>
        MOST POPULAR
      </div>
    )}

    {/* Radio indicator */}
    <div style={{
      width: 18,
      height: 18,
      borderRadius: '50%',
      border: `2px solid ${selected ? '#2563eb' : '#c8d0e7'}`,
      background: selected ? '#2563eb' : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
      transition: 'all .15s',
    }}>
      {selected && (
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
      )}
    </div>

    {/* Plan info */}
    <div style={{ flex: 1 }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{plan.name}</div>
          <div style={{ fontSize: 11, color: '#4b5568', marginTop: 2, fontWeight: 500 }}>
            {plan.history} history
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          {isFree ? (
            <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>Free</div>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>
                {formatCurrency(plan.basePrice)}
              </div>
              <div style={{ fontSize: 10.5, color: '#9ba3b8', marginTop: 2 }}>one-time · USD</div>
            </>
          )}
        </div>
      </div>

      {/* Support description */}
      {plan.support && (
        <div style={{ fontSize: 12.5, color: '#4b5568', marginBottom: plan.features.length ? 8 : 0, lineHeight: 1.5 }}>
          {plan.support}
        </div>
      )}

      {/* Feature chips */}
      {plan.features.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {plan.features.map((f) => (
            <span key={f} style={{
              fontSize: 11,
              background: '#e8edf7',
              border: '1px solid #dce2ef',
              borderRadius: 4,
              padding: '2px 7px',
              color: '#4b5568',
            }}>
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);
