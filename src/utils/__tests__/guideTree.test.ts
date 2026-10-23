import { describe, expect, it } from 'vitest';
import type { GuideNode } from '@/types/api';
import { MAX_DEPTH, MAX_NODES, addChild, addSibling, countNodes, depthOf, firstProblem, indent, move, newNode, outdent, removeAt, updateAt } from '../guideTree';

const n = (label: string, children?: GuideNode[]): GuideNode => ({ id: label, label, kind: 'item', ...(children && { children }) });
const labels = (t: GuideNode[]): unknown[] => t.map((x) => (x.children ? [x.label, labels(x.children)] : x.label));
const base = () => [n('A', [n('A1'), n('A2')]), n('B'), n('C')];

describe('guide tree editing', () => {
  it('adds a sibling right after, and a child at the end', () => {
    expect(labels(addSibling(base(), [0], n('X')))).toEqual([['A', ['A1', 'A2']], 'X', 'B', 'C']);
    expect(labels(addChild(base(), [1], n('X')))).toEqual([['A', ['A1', 'A2']], ['B', ['X']], 'C']);
  });
  it('never mutates its input', () => {
    const t = base(); const snap = JSON.stringify(t);
    addChild(t, [0], n('X')); removeAt(t, [0, 0]); move(t, [1], -1); indent(t, [1]); outdent(t, [0, 1]);
    expect(JSON.stringify(t)).toBe(snap);
  });
  it('removes, and drops an emptied children array', () => {
    expect(labels(removeAt(base(), [1]))).toEqual([['A', ['A1', 'A2']], 'C']);
    const r = removeAt([n('A', [n('A1')])], [0, 0]);
    expect(r[0]).not.toHaveProperty('children');
  });
  it('moves up/down within its level and stops at the ends', () => {
    expect(labels(move(base(), [1], -1))).toEqual(['B', ['A', ['A1', 'A2']], 'C']);
    expect(labels(move(base(), [0, 1], -1))).toEqual([['A', ['A2', 'A1']], 'B', 'C']);
    const t = base();
    expect(move(t, [0], -1)).toBe(t);
    expect(move(t, [2], 1)).toBe(t);
  });
  it('indents under the previous sibling, outdents after the parent; first item cannot indent, top level cannot outdent', () => {
    expect(labels(indent(base(), [1]))).toEqual([['A', ['A1', 'A2', 'B']], 'C']);
    expect(labels(outdent(base(), [0, 0]))).toEqual([['A', ['A2']], 'A1', 'B', 'C']);
    const t = base();
    expect(indent(t, [0])).toBe(t);
    expect(outdent(t, [1])).toBe(t);
  });
  it('respects the depth limit (add child, indent a subtree)', () => {
    let deep: GuideNode[] = [n('L1')];
    let path = [0];
    for (let d = 2; d <= MAX_DEPTH; d++) { deep = addChild(deep, path, n(`L${d}`)); path = [...path, 0]; }
    expect(depthOf(deep)).toBe(MAX_DEPTH);
    expect(addChild(deep, path, n('too deep'))).toBe(deep);
    const t = [n('P'), n('Q', [n('Q1', [n('Q2')])])];
    const tooDeep = [n('R'), n('S', [n('S1', [n('S2', [n('S3')])])])];
    expect(indent(tooDeep, [1])).toBe(tooDeep);
    expect(depthOf(indent(t, [1]))).toBe(4);
  });
  it('respects the size limit', () => {
    const big = Array.from({ length: MAX_NODES }, (_, i) => n(`n${i}`));
    expect(addSibling(big, [0], n('x'))).toBe(big);
    expect(countNodes(big)).toBe(MAX_NODES);
  });
  it('updates a node and drops an emptied info', () => {
    const r = updateAt(base(), [0, 1], { label: 'Renamed', info: '<p>x</p>' });
    expect(r[0].children?.[1]).toMatchObject({ label: 'Renamed', info: '<p>x</p>' });
    expect(updateAt(r, [0, 1], { info: '' })[0].children?.[1]).not.toHaveProperty('info');
  });
  it('newNode ids are unique', () => {
    expect(new Set(Array.from({ length: 200 }, () => newNode().id)).size).toBe(200);
  });
  it('firstProblem names what the API would refuse', () => {
    expect(firstProblem([])).toMatch(/at least one/);
    expect(firstProblem([n('A'), n('  ')])).toMatch(/#2 has no text/);
    expect(firstProblem([n('A', [n('')])])).toMatch(/#1 › #1/);
    expect(firstProblem([n('x'.repeat(201))])).toMatch(/200/);
    expect(firstProblem(base())).toBeNull();
  });
});
