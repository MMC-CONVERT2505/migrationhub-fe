import React, { useState } from 'react';
import { RichTextEditor, isRichTextBlank } from '@/components/admin/RichTextEditor';
import { Modal } from '@/components/admin/Modal';
import { MAX_DEPTH, addChild, addSibling, countNodes, firstProblem, indent, move, newNode, outdent, removeAt, updateAt } from '@/utils/guideTree';
import type { GuideNode } from '@/types/api';

const fieldCls =
  'w-full px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white';
const miniBtn =
  'rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-text-secondary hover:bg-bg-light disabled:opacity-30 disabled:hover:bg-transparent';

type SetTree = (fn: (t: GuideNode[]) => GuideNode[]) => void;

const Rows: React.FC<{ nodes: GuideNode[]; parent: number[]; setTree: SetTree; editInfo: (path: number[], node: GuideNode) => void }> = ({
  nodes, parent, setTree, editInfo,
}) => (
  <ul className="space-y-1.5">
    {nodes.map((node, i) => {
      const path = [...parent, i];
      const depth = path.length;
      const label = path.map((p) => p + 1).join('.');
      return (
        <li key={node.id}>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-white p-2">
            <input
              aria-label={`Text of entry ${label}`}
              className={`${fieldCls} min-w-[10rem] flex-1 ${node.kind === 'heading' ? 'font-semibold' : ''}`}
              value={node.label}
              maxLength={200}
              placeholder={node.kind === 'heading' ? 'Heading, e.g. What We Convert:' : 'Entry text'}
              onChange={(e) => setTree((t) => updateAt(t, path, { label: e.target.value }))}
              onKeyDown={(e) => {
                // Enter would submit the whole FAQ form; here it means "next entry".
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setTree((t) => addSibling(t, path, newNode()));
                }
              }}
            />
            <select
              aria-label={`Type of entry ${label}`}
              className="rounded border border-border bg-white px-1.5 py-1 text-xs"
              value={node.kind}
              onChange={(e) => setTree((t) => updateAt(t, path, { kind: e.target.value as GuideNode['kind'] }))}
            >
              <option value="item">Entry</option>
              <option value="heading">Heading</option>
            </select>
            <button
              type="button"
              className={`${miniBtn} ${node.info ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}`}
              onClick={() => editInfo(path, node)}
              title="Text shown when the visitor clicks the ⓘ button"
            >
              ⓘ {node.info ? 'Edit info' : 'Add info'}
            </button>
            <button type="button" className={miniBtn} disabled={i === 0} onClick={() => setTree((t) => move(t, path, -1))} aria-label={`Move entry ${label} up`}>↑</button>
            <button type="button" className={miniBtn} disabled={i === nodes.length - 1} onClick={() => setTree((t) => move(t, path, 1))} aria-label={`Move entry ${label} down`}>↓</button>
            <button type="button" className={miniBtn} disabled={i === 0} onClick={() => setTree((t) => indent(t, path))} title="Nest under the entry above">→ In</button>
            <button type="button" className={miniBtn} disabled={depth < 2} onClick={() => setTree((t) => outdent(t, path))} title="Move out one level">← Out</button>
            <button type="button" className={miniBtn} onClick={() => setTree((t) => addSibling(t, path, newNode()))}>+ Below</button>
            <button type="button" className={miniBtn} disabled={depth >= MAX_DEPTH} onClick={() => setTree((t) => addChild(t, path, newNode()))}>+ Sub</button>
            <button type="button" className="rounded border border-red-200 px-1.5 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-50" onClick={() => setTree((t) => removeAt(t, path))} aria-label={`Delete entry ${label}`}>Delete</button>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="ml-5 mt-1.5 border-l-2 border-border pl-3">
              <Rows nodes={node.children} parent={path} setTree={setTree} editInfo={editInfo} />
            </div>
          )}
        </li>
      );
    })}
  </ul>
);

/**
 * Editor for a module-list answer: a tree of entries, each with an optional ⓘ pop-up. `value` is the tree the
 * parent owns; every edit hands back a new one. The API re-validates all of it on save.
 */
export const GuideTreeEditor: React.FC<{ value: GuideNode[]; onChange: (tree: GuideNode[]) => void }> = ({ value, onChange }) => {
  const [infoEdit, setInfoEdit] = useState<{ path: number[]; node: GuideNode; html: string } | null>(null);
  const setTree: SetTree = (fn) => onChange(fn(value));
  const problem = firstProblem(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-secondary">
          {countNodes(value)} entries, up to {MAX_DEPTH} levels. Use “Heading” for run-in labels like “What We Convert:”; “Add info” creates the ⓘ pop-up.
        </p>
        <button type="button" className={miniBtn} onClick={() => onChange([...value, newNode()])}>+ Add top-level entry</button>
      </div>
      <Rows nodes={value} parent={[]} setTree={setTree} editInfo={(path, node) => setInfoEdit({ path, node, html: node.info ?? '' })} />
      {problem && <p role="status" className="text-xs text-amber-700">{problem}</p>}

      {infoEdit && (
        <Modal title={`Info for “${infoEdit.node.label || 'entry'}”`} size="lg" onClose={() => setInfoEdit(null)}>
          <p className="mb-2 text-xs text-text-secondary">Shown in a pop-up when a visitor clicks the ⓘ next to this entry. Leave empty to remove the button.</p>
          <RichTextEditor key={infoEdit.node.id} value={infoEdit.html} allowImages={false} placeholder="Write the pop-up text…" onChange={(html) => setInfoEdit((s) => (s ? { ...s, html } : s))} />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setInfoEdit(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium">Cancel</button>
            <button
              type="button"
              onClick={() => { setTree((t) => updateAt(t, infoEdit.path, { info: isRichTextBlank(infoEdit.html) ? '' : infoEdit.html })); setInfoEdit(null); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Apply
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
