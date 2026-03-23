"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { cn, formatDate, truncate, daysUntil } from "@/lib/utils";
import type { TrackedTender, TrackerStatus } from "@/lib/types";
import DeadlineBadge from "./deadline-badge";

const COLUMNS: { status: TrackerStatus; label: string; color: string; bg: string }[] = [
  { status: "new",       label: "New",       color: "text-zinc-400",  bg: "bg-zinc-800" },
  { status: "reviewing", label: "Reviewing", color: "text-blue-400",  bg: "bg-blue-950/40" },
  { status: "bid",       label: "Bid",       color: "text-green-400", bg: "bg-green-950/40" },
  { status: "no_bid",    label: "No Bid",    color: "text-zinc-500",  bg: "bg-zinc-800/50" },
  { status: "submitted", label: "Submitted", color: "text-amber-400", bg: "bg-amber-950/40" },
];

interface TrackerBoardProps {
  initial: TrackedTender[];
}

export default function TrackerBoard({ initial }: TrackerBoardProps) {
  const [items, setItems] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TrackerStatus | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);

  function getColumnItems(status: TrackerStatus) {
    return items.filter((i) => i.status === status);
  }

  async function moveItem(id: string, newStatus: TrackerStatus) {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
          : item
      )
    );

    // Persist to API
    try {
      await fetch(`/api/tracker/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert on error
      setItems(initial);
    }
  }

  async function updateNote(id: string, notes: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
    setEditingNote(null);
    await fetch(`/api/tracker/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/tracker/${id}`, { method: "DELETE" });
  }

  // Drag and drop handlers
  function onDragStart(e: React.DragEvent, id: string) {
    dragItem.current = id;
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    setDragging(null);
    setDragOver(null);
    dragItem.current = null;
  }

  function onDragOver(e: React.DragEvent, status: TrackerStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(status);
  }

  function onDrop(e: React.DragEvent, status: TrackerStatus) {
    e.preventDefault();
    if (dragItem.current) {
      moveItem(dragItem.current, status);
    }
    setDragOver(null);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-zinc-600">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-zinc-400 text-sm">No tenders in tracker yet</p>
        <p className="text-zinc-600 text-xs mt-1 font-mono">
          Open a tender and click "Add to Tracker"
        </p>
        <Link href="/" className="mt-4 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm mono transition-colors">
          Browse Feed →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[600px]">
      {COLUMNS.map((col) => {
        const colItems = getColumnItems(col.status);
        return (
          <div
            key={col.status}
            className={cn(
              "flex-shrink-0 w-64 xl:w-72 flex flex-col rounded-xl border transition-all duration-150",
              "kanban-column",
              dragOver === col.status
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-zinc-800 bg-zinc-900/30"
            )}
            onDragOver={(e) => onDragOver(e, col.status)}
            onDrop={(e) => onDrop(e, col.status)}
            onDragLeave={() => setDragOver(null)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", col.bg)} />
                <span className={cn("text-xs font-mono font-semibold uppercase tracking-wider", col.color)}>
                  {col.label}
                </span>
              </div>
              <span className="mono text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                {colItems.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {colItems.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  isDragging={dragging === item.id}
                  isEditingNote={editingNote === item.id}
                  onDragStart={(e) => onDragStart(e, item.id)}
                  onDragEnd={onDragEnd}
                  onEditNote={() => setEditingNote(editingNote === item.id ? null : item.id)}
                  onSaveNote={(note) => updateNote(item.id, note)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}

              {colItems.length === 0 && (
                <div className={cn(
                  "flex items-center justify-center h-16 rounded-lg border border-dashed text-xs mono text-zinc-700",
                  dragOver === col.status ? "border-amber-500/30 text-amber-600" : "border-zinc-800"
                )}>
                  {dragOver === col.status ? "Drop here" : "Empty"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface KanbanCardProps {
  item: TrackedTender;
  isDragging: boolean;
  isEditingNote: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEditNote: () => void;
  onSaveNote: (note: string) => void;
  onRemove: () => void;
}

function KanbanCard({
  item,
  isDragging,
  isEditingNote,
  onDragStart,
  onDragEnd,
  onEditNote,
  onSaveNote,
  onRemove,
}: KanbanCardProps) {
  const tender = item.tender;
  const [noteValue, setNoteValue] = useState(item.notes ?? "");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-lg border p-3 cursor-grab transition-all duration-150 kanban-card",
        "border-zinc-800 bg-zinc-900 hover:border-zinc-700",
        isDragging && "opacity-40 cursor-grabbing scale-95"
      )}
    >
      {/* Issuer */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {tender?.issuer_canton && (
            <span className="mono text-xs px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 shrink-0">
              {tender.issuer_canton}
            </span>
          )}
          <span className="text-xs text-zinc-500 truncate mono">{tender?.issuer_name ?? "—"}</span>
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all ml-1 shrink-0"
          title="Remove from tracker"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11z" />
          </svg>
        </button>
      </div>

      {/* Title */}
      {tender ? (
        <Link
          href={`/tender/${tender.id}`}
          className="block text-xs font-medium text-zinc-200 hover:text-white mb-2 leading-snug"
          onClick={(e) => e.stopPropagation()}
        >
          {truncate(tender.title, 80)}
        </Link>
      ) : (
        <p className="text-xs text-zinc-500 mb-2 mono">{item.tender_id.slice(0, 8)}…</p>
      )}

      {/* Deadline */}
      {tender?.response_deadline && (
        <DeadlineBadge date={tender.response_deadline} showDate className="mb-2" />
      )}

      {/* Notes */}
      {isEditingNote ? (
        <div className="mt-2">
          <textarea
            autoFocus
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Add notes…"
            rows={2}
            className={cn(
              "w-full px-2 py-1.5 rounded border text-xs font-mono resize-none",
              "bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600",
              "focus:outline-none focus:border-amber-500/50"
            )}
          />
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => onSaveNote(noteValue)}
              className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs mono"
            >
              Save
            </button>
            <button
              onClick={onEditNote}
              className="px-2 py-0.5 rounded border border-zinc-700 text-zinc-500 text-xs mono"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onEditNote}
          className={cn(
            "w-full text-left text-xs rounded px-1.5 py-1 transition-colors mt-1",
            item.notes
              ? "text-zinc-400 hover:text-zinc-300"
              : "text-zinc-700 hover:text-zinc-500 border border-dashed border-zinc-800"
          )}
        >
          {item.notes ? truncate(item.notes, 60) : "+ note"}
        </button>
      )}
    </div>
  );
}
