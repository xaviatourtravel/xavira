"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ExternalLink,
  FileText,
  Image,
  Paperclip,
  Send,
  Zap,
} from "lucide-react";

import { sendWhatsappDocumentAction } from "@/app/(dashboard)/inbox/whatsapp-actions";
import { refreshBrainDocumentPreviewAction } from "@/modules/business-brain/actions/document-actions";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import {
  InspectorAction,
  InspectorEmpty,
  InspectorFooter,
  InspectorHeader,
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
  const { media, documents: fileDocuments, recent } = useMemo(
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
        setNotice(result.message ?? ti("failedSendDocument"));
        return;
      }

      setNotice(ti("documentSent"));
      router.refresh();
    });
  }

  return (
    <InspectorRoot>
      <InspectorHeader
        icon={Paperclip}
        title={ti("workspacePanelFilesTitle")}
        description={ti("workspacePanelFilesDesc")}
      />

      <InspectorSection icon={FileText} title={ti("suggestedDocuments")}>
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
            title={ti("noDocumentsSuggested")}
            description={ti("filesQuickSendEmpty")}
          />
        )}
      </InspectorSection>

      <InspectorSection title={ti("filesUploadedFiles")}>
        <UploadedFileList files={fileDocuments} ti={ti} />
      </InspectorSection>

      <InspectorSection icon={Image} title={ti("filesMedia")}>
        {media.length > 0 ? (
          <UploadedFileList files={media} ti={ti} />
        ) : (
          <InspectorEmpty
            title={ti("filesNoMedia")}
            description={ti("filesNoMedia")}
            icon={Image}
          />
        )}
      </InspectorSection>

      <InspectorSection icon={Clock} title={ti("filesRecentFiles")} hideDivider>
        {recent.length > 0 ? (
          <UploadedFileList files={recent} ti={ti} />
        ) : (
          <InspectorEmpty
            title={ti("filesNoRecentFiles")}
            description={ti("filesNoUploads")}
          />
        )}
      </InspectorSection>

      <InspectorFooter label={ti("filesQuickSend")}>
        {documents.length > 0 && canManageAi ? (
          <div className="space-y-2">
            <p className="text-[13px] text-muted-foreground">{ti("filesQuickSendHint")}</p>
            <div className="flex flex-wrap gap-2">
              {documents.slice(0, 4).map((document) => (
                <InspectorAction
                  key={document.id}
                  variant="secondary"
                  disabled={isPending || sendingDocId === document.id}
                  onClick={() => handleSendDocument(document)}
                  className="flex-1 sm:flex-none"
                >
                  <Send className="h-3.5 w-3.5" />
                  {document.name}
                </InspectorAction>
              ))}
            </div>
          </div>
        ) : (
          <InspectorEmpty
            title={ti("filesQuickSendEmpty")}
            description={ti("noDocumentsSuggested")}
            icon={Zap}
          />
        )}
      </InspectorFooter>

      {notice ? (
        <p className="px-6 pb-4 text-xs text-muted-foreground">{notice}</p>
      ) : null}
    </InspectorRoot>
  );
}

function UploadedFileList({
  files,
  ti,
}: {
  files: ConversationUploadedFile[];
  ti: (key: InboxKey) => string;
}) {
  if (files.length === 0) {
    return (
      <InspectorEmpty
        title={ti("filesNoUploads")}
        description={ti("filesNoRecentFiles")}
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
