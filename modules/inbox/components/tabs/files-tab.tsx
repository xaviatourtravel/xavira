"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, ImageIcon, Send } from "lucide-react";

import { sendWhatsappDocumentAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import { refreshBrainDocumentPreviewAction } from "@/modules/business-brain/actions/document-actions";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import {
  InspectorAction,
  InspectorEmpty,
  InspectorListItem,
  InspectorRoot,
  InspectorSection,
} from "@/components/ui/inspector";
import { formatInboxMessageTime } from "@/components/omnichannel-inbox/inbox-display";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import {
  extractConversationUploadedFiles,
  partitionConversationFiles,
  type ConversationUploadedFile,
} from "@/modules/inbox/lib/conversation-uploaded-files";
import type { RecommendedDocumentItem } from "@/modules/inbox/lib/build-ai-command-center";
import type { InboxKey } from "@/lib/i18n/inbox-dictionary";
import { logInboxError } from "@/modules/inbox/lib/resolve-inbox-error";

type FilesTabProps = {
  conversation: OmnichannelConversationDetail;
  canManageAi?: boolean;
};

export function FilesTab({ conversation, canManageAi = false }: FilesTabProps) {
  const router = useRouter();
  const { ti } = useInboxTranslation();
  const [isPending, startTransition] = useTransition();
  const [sendingDocId, setSendingDocId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const documents = conversation.recommendedDocuments ?? [];
  const uploadedFiles = useMemo(
    () => extractConversationUploadedFiles(conversation.messages),
    [conversation.messages],
  );
  const { media, documents: fileDocuments } = useMemo(
    () => partitionConversationFiles(uploadedFiles),
    [uploadedFiles],
  );

  async function handlePreview(document: RecommendedDocumentItem) {
    setNotice(null);
    if (document.previewUrl) {
      window.open(document.previewUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const result = await refreshBrainDocumentPreviewAction(document.id);
    if (!result.ok || !("previewUrl" in result) || !result.previewUrl) {
      setNotice(ti("noPreviewAvailable"));
      return;
    }
    window.open(result.previewUrl, "_blank", "noopener,noreferrer");
  }

  function handleSendDocument(document: RecommendedDocumentItem) {
    if (!canManageAi) return;
    setNotice(null);
    setSendingDocId(document.id);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("conversation_id", conversation.id);
      formData.set("document_id", document.id);

      const result = await sendWhatsappDocumentAction(formData);
      setSendingDocId(null);

      if (!result.success) {
        logInboxError("sendDocument", result.message);
        setNotice(ti("failedSendDocument"));
        return;
      }

      setNotice(ti("documentSent"));
      router.refresh();
    });
  }

  return (
    <InspectorRoot className="pb-8">
      <InspectorSection title={ti("resourcesRecommended")}>
        {documents.length > 0 ? (
          <ul className="space-y-0.5">
            {documents.map((document) => (
              <InspectorListItem
                key={document.id}
                label={document.name}
                action={
                  <div className="flex items-center gap-1">
                    <InspectorAction
                      variant="ghost"
                      onClick={() => void handlePreview(document)}
                      className="px-2 py-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {ti("preview")}
                    </InspectorAction>
                    {canManageAi ? (
                      <InspectorAction
                        variant="primary"
                        disabled={isPending || sendingDocId === document.id}
                        onClick={() => handleSendDocument(document)}
                        className="px-2 py-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {sendingDocId === document.id ? ti("sending") : ti("send")}
                      </InspectorAction>
                    ) : null}
                  </div>
                }
              />
            ))}
          </ul>
        ) : (
          <InspectorEmpty
            title={ti("resourcesEmptyTitle")}
            description={ti("resourcesEmptyDesc")}
          />
        )}
      </InspectorSection>

      <InspectorSection title={ti("resourcesDocuments")}>
        <UploadedFileList
          files={fileDocuments}
          ti={ti}
          emptyTitle={ti("filesNoUploads")}
          emptyDesc={ti("filesNoUploadsDesc")}
          emptyIcon={FileText}
        />
      </InspectorSection>

      <InspectorSection title={ti("resourcesMedia")} hideDivider>
        {media.length > 0 ? (
          <UploadedFileList files={media} ti={ti} emptyTitle={ti("filesNoMedia")} emptyDesc={ti("filesNoMediaDesc")} emptyIcon={ImageIcon} />
        ) : (
          <InspectorEmpty
            title={ti("filesNoMedia")}
            description={ti("filesNoMediaDesc")}
          />
        )}
      </InspectorSection>


      {notice ? (
        <p className="px-4 pb-4 text-xs text-muted-foreground">{notice}</p>
      ) : null}
    </InspectorRoot>
  );
}

function UploadedFileList({
  files,
  ti,
  emptyTitle,
  emptyDesc,
  emptyIcon: EmptyIcon = FileText,
}: {
  files: ConversationUploadedFile[];
  ti: (key: InboxKey) => string;
  emptyTitle: string;
  emptyDesc: string;
  emptyIcon?: typeof FileText;
}) {
  if (files.length === 0) {
    return (
      <InspectorEmpty
        icon={EmptyIcon}
        title={emptyTitle}
        description={emptyDesc}
      />
    );
  }

  return (
    <ul className="space-y-0.5">
      {files.map((file) => (
        <InspectorListItem
          key={file.id}
          label={file.name}
          detail={
            file.direction === "incoming" ? ti("filesFromCustomer") : ti("filesFromTeam")
          }
          meta={formatInboxMessageTime(file.timestamp)}
          action={
            file.url ? (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ti("preview")}
              </a>
            ) : null
          }
        />
      ))}
    </ul>
  );
}
