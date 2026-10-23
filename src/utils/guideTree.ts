import type { GuideNode } from '@/types/api';

/** Limits the API enforces too — the editor stops short of them instead of letting a save fail. */
export const MAX_DEPTH = 4;
export const MAX_NODES = 400;

let seq = 0;
export const newNode = (label = '', kind: GuideNode['kind'] = 'item'): GuideNode => ({
  id: `n${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`,
  label,
  kind,
});

export const countNodes = (nodes: GuideNode[]): number =>
  nodes.reduce((n, x) => n + 1 + countNodes(x.children ?? []), 0);

/** Levels of nesting below (and including) this list: [] -> 0, flat -> 1. */
export const depthOf = (nodes: GuideNode[]): number =>
  nodes.reduce((d, x) => Math.max(d, 1 + depthOf(x.children ?? [])), 0);

type Path = number[];

const clone = (nodes: GuideNode[]): GuideNode[] => JSON.parse(JSON.stringify(nodes));

function listAt(root: GuideNode[], parentPath: Path): GuideNode[] {
  let list = root;
  for (const i of parentPath) {
    const node = list[i];
    node.children = node.children ?? [];
    list = node.children;
  }
  return list;
}
const tidy = (list: GuideNode[]) => list.forEach((n) => { if (n.children && n.children.length === 0) delete n.children; });

/** Every op returns a NEW tree, or the same one untouched when the move is not allowed. */
export function addSibling(nodes: GuideNode[], path: Path, node: GuideNode): GuideNode[] {
  if (countNodes(nodes) >= MAX_NODES) return nodes;
  const t = clone(nodes);
  const list = listAt(t, path.slice(0, -1));
  list.splice(path[path.length - 1] + 1, 0, node);
  return t;
}

export function addChild(nodes: GuideNode[], path: Path, node: GuideNode): GuideNode[] {
  if (countNodes(nodes) >= MAX_NODES || path.length >= MAX_DEPTH) return nodes;
  const t = clone(nodes);
  const parent = listAt(t, path.slice(0, -1))[path[path.length - 1]];
  parent.children = [...(parent.children ?? []), node];
  return t;
}

export function removeAt(nodes: GuideNode[], path: Path): GuideNode[] {
  const t = clone(nodes);
  const parentList = listAt(t, path.slice(0, -1));
  parentList.splice(path[path.length - 1], 1);
  tidy(parentList);
  if (path.length > 1) tidy(listAt(t, path.slice(0, -2)));
  return t;
}

export function move(nodes: GuideNode[], path: Path, delta: -1 | 1): GuideNode[] {
  const i = path[path.length - 1];
  const t = clone(nodes);
  const list = listAt(t, path.slice(0, -1));
  const j = i + delta;
  if (j < 0 || j >= list.length) return nodes;
  [list[i], list[j]] = [list[j], list[i]];
  return t;
}

/** Make the node a child of its previous sibling (nest it one level deeper). */
export function indent(nodes: GuideNode[], path: Path): GuideNode[] {
  const i = path[path.length - 1];
  if (i === 0) return nodes;
  const t = clone(nodes);
  const list = listAt(t, path.slice(0, -1));
  const [node] = list.splice(i, 1);
  if (path.length + depthOf([node]) > MAX_DEPTH) return nodes;
  const prev = list[i - 1];
  prev.children = [...(prev.children ?? []), node];
  return t;
}

/** Make the node a sibling placed just after its parent (nest it one level shallower). */
export function outdent(nodes: GuideNode[], path: Path): GuideNode[] {
  if (path.length < 2) return nodes;
  const t = clone(nodes);
  const parentPath = path.slice(0, -1);
  const list = listAt(t, parentPath);
  const [node] = list.splice(path[path.length - 1], 1);
  tidy(list);
  const grand = listAt(t, parentPath.slice(0, -1));
  grand.splice(parentPath[parentPath.length - 1] + 1, 0, node);
  return t;
}

export function updateAt(nodes: GuideNode[], path: Path, patch: Partial<GuideNode>): GuideNode[] {
  const t = clone(nodes);
  const node = listAt(t, path.slice(0, -1))[path[path.length - 1]];
  Object.assign(node, patch);
  if (!node.info) delete node.info;
  return t;
}

/** First problem that would make the API refuse this tree, as an admin-readable sentence (or null). */
export function firstProblem(nodes: GuideNode[]): string | null {
  if (nodes.length === 0) return 'Add at least one entry.';
  const walk = (list: GuideNode[], trail: string): string | null => {
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      const where = `${trail}#${i + 1}`;
      if (!n.label.trim()) return `Entry ${where} has no text.`;
      if (n.label.length > 200) return `Entry ${where} is longer than 200 characters.`;
      const sub = n.children?.length ? walk(n.children, `${where} › `) : null;
      if (sub) return sub;
    }
    return null;
  };
  if (countNodes(nodes) > MAX_NODES) return `A guide can hold at most ${MAX_NODES} entries.`;
  if (depthOf(nodes) > MAX_DEPTH) return `Entries can be nested at most ${MAX_DEPTH} levels deep.`;
  return walk(nodes, '');
}
