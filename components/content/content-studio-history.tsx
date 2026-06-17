"use client";

import { useState } from "react";

import { AddToContentBoardModal } from "@/components/content/add-to-content-board-modal";
import { ContentGenerationDetailModal } from "@/components/content/content-generation-detail-modal";
import { Button } from "@/components/ui/button";
import { getContentStudioSourceBadgeClassName } from "@/lib/ai/content-studio";
import {
  formatGenerationDateTime,
  type ContentGenerationListItem,
} from "@/lib/content/generations";
import { cn } from "@/lib/utils";

type ContentStudioHistoryProps = {
  history: ContentGenerationListItem[];
  profiles: ReadonlyArray<{ id: string; full_name: string | null }>;
  canManage: boolean;
};

export function ContentStudioHistory({
  history,
  profiles,
  canManage,
}: ContentStudioHistoryProps) {
  const [detailGeneration, setDetailGeneration] =
    useState<ContentGenerationListItem | null>(null);
  const [boardGeneration, setBoardGeneration] =
    useState<ContentGenerationListItem | null>(null);

  return (
    <>
      <div className="rounded-xl border p-6">
        <div>
          <h2 className="text-lg font-semibold">History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generation tersimpan untuk dibuka ulang atau ditambahkan ke Content
            Board.
          </p>
        </div>

        {history.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Belum ada generation tersimpan.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Package / Topic</th>
                  <th className="px-3 py-2 font-medium">Platform</th>
                  <th className="px-3 py-2 font-medium">Pillar</th>
                  <th className="px-3 py-2 font-medium">Preview</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatGenerationDateTime(item.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          getContentStudioSourceBadgeClassName(item.sourceType),
                        )}
                      >
                        {item.sourceLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3">{item.subjectLabel}</td>
                    <td className="px-3 py-3">{item.platformLabel}</td>
                    <td className="px-3 py-3">{item.pillarLabel ?? "-"}</td>
                    <td className="max-w-xs truncate px-3 py-3 text-muted-foreground">
                      {item.preview}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailGeneration(item)}
                        >
                          Open
                        </Button>
                        {canManage && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setBoardGeneration(item)}
                          >
                            Add to Content Board
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailGeneration && (
        <ContentGenerationDetailModal
          generation={detailGeneration}
          onClose={() => setDetailGeneration(null)}
        />
      )}

      {boardGeneration && (
        <AddToContentBoardModal
          generation={boardGeneration}
          profiles={profiles}
          onClose={() => setBoardGeneration(null)}
        />
      )}
    </>
  );
}
