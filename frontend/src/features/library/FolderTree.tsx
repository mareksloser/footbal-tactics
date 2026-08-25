import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { FolderNode } from './tree';

export interface FolderTreeProps {
  nodes: readonly FolderNode[];
  activeId: string | null;
  rootCount: number;
  onSelect: (folderId: string | null) => void;
  depth?: number;
}

export function FolderTree({ nodes, activeId, rootCount, onSelect, depth = 0 }: FolderTreeProps) {
  return (
    <ul className={cn('space-y-0.5', depth === 0 && 'text-sm')}>
      {depth === 0 ? (
        <li>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition',
              activeId === null ? 'bg-panel-soft text-chalk' : 'text-muted hover:bg-panel hover:text-chalk',
            )}
          >
            <span aria-hidden>🗂</span>
            <span className="font-semibold">Celá knihovna</span>
            <span className="ml-auto text-xs opacity-60">{rootCount}</span>
          </button>
        </li>
      ) : null}
      {nodes.map((node) => (
        <FolderBranch key={node.folder.id} node={node} activeId={activeId} onSelect={onSelect} depth={depth} />
      ))}
    </ul>
  );
}

function FolderBranch({
  node,
  activeId,
  onSelect,
  depth,
}: {
  node: FolderNode;
  activeId: string | null;
  onSelect: (folderId: string | null) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg pr-2 transition',
          activeId === node.folder.id ? 'bg-panel-soft text-chalk' : 'text-muted hover:bg-panel hover:text-chalk',
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn('h-7 w-6 shrink-0 text-xs', !hasChildren && 'invisible')}
          aria-label={open ? 'Sbalit' : 'Rozbalit'}
          aria-expanded={open}
        >
          {open ? '▾' : '▸'}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node.folder.id)}
          className="flex-1 py-2 text-left font-semibold"
        >
          {node.folder.name}
        </button>
        <span className="text-xs opacity-60">{node.totalTactics}</span>
      </div>
      {open && hasChildren ? (
        <FolderTree
          nodes={node.children}
          activeId={activeId}
          rootCount={0}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ) : null}
    </li>
  );
}
