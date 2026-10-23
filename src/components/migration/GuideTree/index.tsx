import React, { useState } from 'react';
import { Modal } from '@/components/admin/Modal';
import { cn } from '@/utils/format';
import type { GuideNode } from '@/types/api';

const InfoIcon: React.FC = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

interface RowProps {
  node: GuideNode;
  depth: number;
  onInfo: (node: GuideNode) => void;
}

const Rows: React.FC<{ nodes: GuideNode[]; depth: number; onInfo: RowProps['onInfo'] }> = ({ nodes, depth, onInfo }) => (
  <ul className={cn(depth > 0 && 'ml-5')}>
    {nodes.map((node) => (
      <Row key={node.id} node={node} depth={depth} onInfo={onInfo} />
    ))}
  </ul>
);

const Row: React.FC<RowProps> = ({ node, depth, onInfo }) => {
  const heading = node.kind === 'heading';
  return (
    <li className={cn('py-0.5 text-[13px] leading-snug text-text-primary', depth === 0 && 'mt-2.5 first:mt-0')}>
      <div className="flex items-start gap-1.5">
        {!heading && <span className="mt-0.5 text-blue-500" aria-hidden="true">»</span>}
        <span className={cn(heading || depth === 0 || (node.children && node.children.length > 0) ? 'font-semibold' : 'font-normal text-text-secondary')}>
          {node.label}
        </span>
        {node.info && (
          <button
            type="button"
            onClick={() => onInfo(node)}
            aria-label={`More about ${node.label}`}
            className="mt-px text-text-primary/80 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
          >
            <InfoIcon />
          </button>
        )}
      </div>
      {node.children && node.children.length > 0 && <Rows nodes={node.children} depth={depth + 1} onInfo={onInfo} />}
    </li>
  );
};


/**
 * An FAQ answer written as a module list: nested entries, bold headings, and an ⓘ button that opens a pop-up
 * for entries that have info. Text is plain; the pop-up HTML is sanitized by the API (no scripts or images).
 */
/** Drops anything malformed (stored JSON is validated on write, but a bad row must never crash the page). */
export function safeNodes(input: unknown, depth = 0): GuideNode[] {
  if (!Array.isArray(input) || depth > 6) return [];
  return input
    .filter((n): n is GuideNode => !!n && typeof n === 'object' && typeof (n as GuideNode).label === 'string' && (n as GuideNode).label.trim() !== '')
    .map((n, i) => ({
      id: typeof n.id === 'string' && n.id ? n.id : `n${depth}-${i}`,
      label: n.label,
      kind: n.kind === 'heading' ? 'heading' : 'item',
      ...(typeof n.info === 'string' && n.info.trim() && { info: n.info }),
      ...(Array.isArray(n.children) && n.children.length > 0 && { children: safeNodes(n.children, depth + 1) }),
    }));
}

export const GuideTree: React.FC<{ nodes: GuideNode[] }> = ({ nodes: raw }) => {
  const nodes = React.useMemo(() => safeNodes(raw), [raw]);
  const [info, setInfo] = useState<GuideNode | null>(null);
  return (
    <>
      <Rows nodes={nodes} depth={0} onInfo={setInfo} />
      {info?.info && (
        <Modal title={info.label} size="xl" onClose={() => setInfo(null)}>
          <div className="faq-answer text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: info.info }} />
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={() => setInfo(null)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};
