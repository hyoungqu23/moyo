"use client";

import { SourceBadge } from "@/components/sources/SourceBadge";
import { cn } from "@/lib/cn";

interface SourceCardData {
  id: string;
  type: "youtube" | "blog" | "text" | "manual";
  url: string | null;
  title: string | null;
  channel: string | null;
  thumbnailUrl: string | null;
  isUnavailableOnSource: boolean;
}

interface Props {
  source: SourceCardData;
  onDelete?: () => void;
  className?: string;
}

export function SourceCard({ source, onDelete, className }: Props) {
  const title = source.title ?? "제목 없음";
  return (
    <article
      className={cn(
        "flex gap-3 rounded-md border border-hairline bg-canvas p-3",
        source.isUnavailableOnSource && "opacity-60",
        className,
      )}
    >
      {source.thumbnailUrl ? (
        <div className="relative w-20 h-20 shrink-0 rounded-sm overflow-hidden bg-canvas-parchment">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1">
            <SourceBadge type={source.type} />
          </div>
        </div>
      ) : (
        <div className="w-20 h-20 shrink-0 rounded-sm bg-canvas-parchment flex items-center justify-center">
          <SourceBadge type={source.type} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-body-strong text-ink truncate">{title}</h3>
        {source.channel && (
          <p className="mt-1 text-caption text-ink-muted-80 truncate">{source.channel}</p>
        )}
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-caption text-primary hover:underline"
          >
            원본 보기 →
          </a>
        )}
        {source.isUnavailableOnSource && (
          <p className="mt-1 text-caption text-ink-muted-48">접근 불가</p>
        )}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="출처 삭제"
          className="text-ink-muted-48 hover:text-ink min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm"
        >
          <span aria-hidden>×</span>
        </button>
      )}
    </article>
  );
}

