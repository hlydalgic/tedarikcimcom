"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Pencil,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { CategoryRow, CategoryTreeNode } from "@/lib/categories/types";
import {
  archiveCategory,
  moveCategory,
  reorderCategory,
} from "@/app/actions/categories";
import { CategoryDetailPanel } from "@/components/admin/categories/CategoryDetailPanel";

type Props = {
  initialTree: CategoryTreeNode[];
  flatCategories: CategoryRow[];
  selectedId?: string;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-success/15 text-success",
    inactive: "bg-ink-muted/15 text-ink-muted",
    draft: "bg-warning/15 text-warning",
    archived: "bg-error/15 text-error",
  };
  const labels: Record<string, string> = {
    active: "Aktif",
    inactive: "Pasif",
    draft: "Taslak",
    archived: "Arşiv",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        styles[status] ?? "bg-background text-ink-muted"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function TreeNode({
  node,
  depth,
  selectedId,
  expanded,
  onToggle,
  onSelect,
  onAddChild,
  onReorder,
  onArchive,
  busy,
}: {
  node: CategoryTreeNode;
  depth: number;
  selectedId?: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onArchive: (id: string) => void;
  busy: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const selected = selectedId === node.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition ${
          selected ? "bg-primary-soft text-primary" : "hover:bg-background"
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-muted disabled:opacity-30"
          disabled={!hasChildren}
          onClick={() => onToggle(node.id)}
          aria-label={isOpen ? "Kapat" : "Aç"}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left font-medium"
          onClick={() => onSelect(node.id)}
        >
          {node.name}
        </button>

        <StatusBadge status={node.status} />

        <div className="ml-1 hidden items-center gap-0.5 group-hover:flex">
          <button
            type="button"
            title="Yukarı"
            disabled={busy}
            className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink"
            onClick={() => onReorder(node.id, "up")}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Aşağı"
            disabled={busy}
            className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink"
            onClick={() => onReorder(node.id, "down")}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Düzenle"
            className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink"
            onClick={() => onSelect(node.id)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Alt kategori ekle"
            className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink"
            onClick={() => onAddChild(node.id)}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Arşivle"
            disabled={busy}
            className="rounded p-1 text-ink-muted hover:bg-surface hover:text-error"
            onClick={() => onArchive(node.id)}
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && isOpen
        ? node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onReorder={onReorder}
              onArchive={onArchive}
              busy={busy}
            />
          ))
        : null}
    </div>
  );
}

export function CategoryBuilder({
  initialTree,
  flatCategories,
  selectedId: initialSelectedId,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    initialSelectedId
  );
  const [mode, setMode] = useState<"view" | "create">("view");
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const defaultExpanded = useMemo(() => {
    const set = new Set<string>();
    flatCategories.forEach((c) => {
      if (c.depth <= 1) set.add(c.id);
    });
    return set;
  }, [flatCategories]);

  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);

  const selected = flatCategories.find((c) => c.id === selectedId) ?? null;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const run = (fn: () => Promise<{ error?: string; success?: boolean; categoryId?: string }>) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
      else {
        setMessage("Kaydedildi.");
        if (result.categoryId) {
          setSelectedId(result.categoryId);
          setMode("view");
        }
        router.refresh();
      }
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      {/* Left: tree */}
      <aside className="flex w-full flex-col rounded-2xl border border-border bg-surface lg:w-[360px] lg:shrink-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h1 className="font-display text-base font-bold text-ink">
              Kategoriler
            </h1>
            <p className="text-xs text-ink-muted">
              {flatCategories.length} kategori
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
            onClick={() => {
              setMode("create");
              setCreateParentId(null);
              setSelectedId(undefined);
            }}
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Root ekle
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {initialTree.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-ink-muted">
              Henüz kategori yok. Root kategori ekleyin.
            </p>
          ) : (
            initialTree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                expanded={expanded}
                onToggle={toggle}
                onSelect={(id) => {
                  setSelectedId(id);
                  setMode("view");
                }}
                onAddChild={(parentId) => {
                  setCreateParentId(parentId);
                  setMode("create");
                  setSelectedId(undefined);
                  setExpanded((prev) => new Set(prev).add(parentId));
                }}
                onReorder={(id, direction) =>
                  run(() => reorderCategory({ id, direction }))
                }
                onArchive={(id) => {
                  if (
                    !window.confirm(
                      "Bu kategoriyi arşivlemek istediğinize emin misiniz?"
                    )
                  ) {
                    return;
                  }
                  run(async () => {
                    const result = await archiveCategory(id);
                    if (result.success && selectedId === id) {
                      setSelectedId(undefined);
                    }
                    return result;
                  });
                }}
                busy={pending}
              />
            ))
          )}
        </div>
      </aside>

      {/* Right: detail */}
      <section className="min-w-0 flex-1 rounded-2xl border border-border bg-surface">
        {error ? (
          <div className="border-b border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="border-b border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            {message}
          </div>
        ) : null}

        {mode === "create" ? (
          <CategoryDetailPanel
            mode="create"
            parentId={createParentId}
            flatCategories={flatCategories}
            onCreated={(id) => {
              setSelectedId(id);
              setMode("view");
              setMessage("Kategori oluşturuldu.");
              router.refresh();
            }}
            onError={setError}
          />
        ) : selected ? (
          <CategoryDetailPanel
            mode="edit"
            category={selected}
            flatCategories={flatCategories}
            onMoved={() => {
              setMessage("Kategori taşındı.");
              router.refresh();
            }}
            onError={setError}
            onMove={(newParentId) =>
              run(() => moveCategory({ id: selected.id, newParentId }))
            }
          />
        ) : (
          <div className="flex h-full min-h-[320px] items-center justify-center p-8 text-sm text-ink-muted">
            Düzenlemek için soldan bir kategori seçin veya yeni kategori ekleyin.
          </div>
        )}
      </section>
    </div>
  );
}
