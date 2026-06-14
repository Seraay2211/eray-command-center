import { memo } from "react";
import {
  CalendarDays,
  Edit3,
  ImageIcon,
  Pin,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCategoryDisplayName } from "@/lib/categories/display";
import { cn } from "@/lib/utils";
import type { NoteWithRelations } from "@/types";

interface NoteCardProps {
  isBusy: boolean;
  isSelected: boolean;
  note: NoteWithRelations;
  onDelete: (note: NoteWithRelations) => void;
  onEdit: (note: NoteWithRelations) => void;
  onSelect: (note: NoteWithRelations) => void;
  onTogglePin: (note: NoteWithRelations) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function buildPreview(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Bu notta henuz içerik bulunmuyor.";
  }

  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177).trimEnd()}...`;
}

function NoteCardComponent({
  isBusy,
  isSelected,
  note,
  onDelete,
  onEdit,
  onSelect,
  onTogglePin,
}: NoteCardProps) {
  const displayDate =
    note.updated_at !== note.created_at ? note.updated_at : note.created_at;
  const coverImage = note.images[0];
  const visibleTags = note.tags.slice(0, 3);

  return (
    <Card
      className={cn(
        "group relative flex min-h-56 flex-col overflow-hidden p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-[#131317]",
        note.is_pinned && "border-violet-400/20 bg-violet-500/[0.035]",
        isSelected &&
          "border-violet-400/35 bg-violet-500/[0.07] shadow-[0_18px_60px_rgba(124,58,237,0.08)]",
      )}
    >
      <button
        aria-label={`${note.title} notunu aç`}
        className="absolute inset-0 z-0 cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/70"
        onClick={() => onSelect(note)}
        type="button"
      />

      {note.is_pinned ? (
        <div className="pointer-events-none absolute right-0 top-0 size-24 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_65%)]" />
      ) : null}

      <div className="pointer-events-none relative z-[1] flex items-start justify-between gap-3">
        <div className="min-w-0">
          {note.category ? (
            <span
              className="inline-flex max-w-full items-center truncate rounded-md border px-2 py-1 text-[10px] font-semibold"
              style={{
                backgroundColor: `${note.category.color}12`,
                borderColor: `${note.category.color}35`,
                color: note.category.color,
              }}
            >
              {getCategoryDisplayName(note.category)}
            </span>
          ) : (
            <span className="inline-flex rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-zinc-600">
              Kategorisiz
            </span>
          )}
          <h2 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-zinc-100">
            {note.title}
          </h2>
        </div>

        <button
          aria-label={
            note.is_pinned
              ? `${note.title} sabitlemesini kaldır`
              : `${note.title} notunu sabitle`
          }
          className={cn(
            "pointer-events-auto relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border transition",
            note.is_pinned
              ? "border-violet-400/20 bg-violet-500/10 text-violet-300"
              : "border-white/[0.07] bg-[#111114] text-zinc-600 hover:border-violet-400/20 hover:text-violet-300",
          )}
          disabled={isBusy}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(note);
          }}
          type="button"
        >
          <Pin
            className="size-3.5"
            fill={note.is_pinned ? "currentColor" : "none"}
          />
        </button>
      </div>

      <p className="pointer-events-none relative z-[1] mt-3 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-zinc-600">
        {buildPreview(note.content)}
      </p>

      {coverImage ? (
        <div className="pointer-events-none relative z-[1] mt-3 h-20 overflow-hidden rounded-xl border border-white/[0.07] bg-black/30">
          {coverImage.signedUrl ? (
            <div
              aria-label={coverImage.file_name}
              className="size-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
              role="img"
              style={{ backgroundImage: `url("${coverImage.signedUrl}")` }}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-zinc-700">
              <ImageIcon className="size-5" />
            </div>
          )}
          {note.images.length > 1 ? (
            <span className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-black/75 px-2 py-1 text-[9px] font-semibold text-zinc-200 backdrop-blur-sm">
              +{note.images.length - 1} görsel
            </span>
          ) : null}
        </div>
      ) : null}

      {visibleTags.length > 0 ? (
        <div className="pointer-events-none relative z-[1] mt-3 flex flex-wrap gap-1.5">
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
          {note.tags.length > visibleTags.length ? (
            <span className="px-1 py-0.5 text-[9px] text-zinc-700">
              +{note.tags.length - visibleTags.length}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="pointer-events-none relative z-[1] mt-auto flex items-center justify-between border-t border-white/[0.055] pt-3">
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-700">
          <CalendarDays className="size-3.5" />
          {formatDate(displayDate)}
        </span>
        <div className="pointer-events-auto relative z-10 flex items-center gap-1">
          <button
            aria-label={`${note.title} notunu düzenle`}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200"
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(note);
            }}
            type="button"
          >
            <Edit3 className="size-3.5" />
          </button>
          <button
            aria-label={`${note.title} notunu sil`}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-rose-500/[0.08] hover:text-rose-300"
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(note);
            }}
            type="button"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

export const NoteCard = memo(
  NoteCardComponent,
  (previous, next) =>
    previous.isBusy === next.isBusy &&
    previous.isSelected === next.isSelected &&
    previous.note === next.note,
);
