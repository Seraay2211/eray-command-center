import Link from "next/link";
import { Pin, Tag as TagIcon } from "lucide-react";
import type { DashboardRecentNote } from "@/types";

interface RecentNoteCardProps {
  note: DashboardRecentNote;
}

export function RecentNoteCard({ note }: RecentNoteCardProps) {
  const visibleTags = note.tags.slice(0, 2);
  const hiddenTagCount = note.tags.length - visibleTags.length;

  return (
    <Link
      className="group block border-b border-white/[0.055] px-1 py-4 last:border-0"
      href={`/notes?note=${encodeURIComponent(note.id)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {note.category ? (
              <span
                className="inline-flex max-w-full items-center truncate rounded-md border px-2 py-1 text-[10px] font-semibold"
                style={{
                  backgroundColor: `${note.category.color}12`,
                  borderColor: `${note.category.color}35`,
                  color: note.category.color,
                }}
              >
                {note.category.name}
              </span>
            ) : (
              <span className="inline-flex rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-zinc-600">
                Kategorisiz
              </span>
            )}
            {note.isPinned ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                <Pin className="size-3" fill="currentColor" />
                Sabitli
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 truncate text-sm font-medium text-zinc-200 transition group-hover:text-white">
            {note.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">
            {note.preview}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {visibleTags.map((tag) => (
              <span
                className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-semibold"
                key={tag.id}
                style={{
                  backgroundColor: `${tag.color}10`,
                  borderColor: `${tag.color}30`,
                  color: tag.color,
                }}
              >
                <TagIcon className="size-2.5" />
                {tag.name}
              </span>
            ))}
            {hiddenTagCount > 0 ? (
              <span className="text-[10px] text-zinc-700">
                +{hiddenTagCount} etiket
              </span>
            ) : null}
            <span className="ml-auto text-[10px] text-zinc-700">{note.date}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
