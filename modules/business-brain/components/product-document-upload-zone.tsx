"use client";

import { AlertCircle, CheckCircle2, Upload } from "lucide-react";

import { InspectorProgress } from "@/components/ui/inspector/inspector-notice";
import { formatTranslation } from "@/lib/i18n/dictionary";
import type { BbUiKey } from "@/lib/i18n/bb-ui-dictionary";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import type { ProductDocumentUploadSlotState } from "@/modules/business-brain/hooks/use-product-document-upload";
import type { ProductDocumentUploadErrorCode } from "@/modules/business-brain/lib/validate-product-document-file";
import type { ProductDocumentType } from "@/modules/business-brain/types/products";
import { cn } from "@/lib/utils";

const ERROR_KEYS: Record<ProductDocumentUploadErrorCode, BbUiKey> = {
  unsupported: "productUploadErrorUnsupported",
  too_large: "productUploadErrorTooLarge",
  corrupted_pdf: "productUploadErrorCorruptedPdf",
  storage: "productUploadErrorStorage",
  permission: "productUploadErrorPermission",
  network: "productUploadErrorNetwork",
  unknown: "productUploadErrorUnknown",
};

type ProductDocumentUploadZoneProps = {
  documentType: ProductDocumentType;
  title: string;
  hint: string;
  accept: string;
  uploadState: ProductDocumentUploadSlotState;
  disabled?: boolean;
  compact?: boolean;
  onFileSelected: (file: File) => void;
};

function statusMessage(
  bb: (key: BbUiKey) => string,
  state: ProductDocumentUploadSlotState,
): string | null {
  switch (state.status) {
    case "validating":
      return bb("productUploadCheckingFile");
    case "uploading":
      return `${state.progress}%`;
    case "processing":
      return bb("productUploadProcessingFile");
    case "success":
      return bb("productUploadSuccess");
    case "error":
      return state.errorCode ? bb(ERROR_KEYS[state.errorCode]) : bb("productUploadErrorUnknown");
    default:
      return null;
  }
}

export function ProductDocumentUploadZone({
  documentType,
  title,
  hint,
  accept,
  uploadState,
  disabled = false,
  compact = false,
  onFileSelected,
}: ProductDocumentUploadZoneProps) {
  const { bb } = useBbTranslation();
  const busy =
    disabled ||
    uploadState.status === "validating" ||
    uploadState.status === "uploading" ||
    uploadState.status === "processing";
  const showProgress =
    uploadState.status === "validating" ||
    uploadState.status === "uploading" ||
    uploadState.status === "processing" ||
    uploadState.status === "success" ||
    uploadState.status === "error";
  const message = statusMessage(bb, uploadState);
  const inputId = `product-document-upload-${documentType}`;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-dashed border-border/70",
        compact ? "gap-1.5 p-2.5" : "gap-2 rounded-xl p-4",
        busy && "pointer-events-none opacity-80",
        uploadState.status === "error" && "border-destructive/40 bg-destructive/5",
        uploadState.status === "success" && "border-emerald-500/40 bg-emerald-500/5",
      )}
    >
      <span className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>
        {title}
      </span>
      <span className={cn("text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
        {hint}
      </span>

      {uploadState.fileName ? (
        <p className="truncate text-xs font-medium text-foreground" title={uploadState.fileName}>
          {uploadState.fileName}
        </p>
      ) : null}

      {showProgress ? (
        <div className="space-y-1">
          {uploadState.status !== "error" ? (
            <InspectorProgress value={uploadState.progress} className={compact ? "h-1.5" : "h-2"} />
          ) : null}
          {message ? (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs",
                uploadState.status === "error" && "text-destructive",
                uploadState.status === "success" && "text-emerald-700 dark:text-emerald-300",
                uploadState.status !== "error" &&
                  uploadState.status !== "success" &&
                  "text-muted-foreground",
              )}
            >
              {uploadState.status === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : null}
              {uploadState.status === "error" ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : null}
              {uploadState.status === "uploading"
                ? formatTranslation(bb("productUploadPercent"), {
                    percent: String(uploadState.progress),
                  })
                : message}
            </p>
          ) : null}
        </div>
      ) : null}

      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-center gap-1.5 text-primary",
          compact ? "text-xs" : "text-sm",
          busy ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <Upload className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {bb("chooseFile")}
        <input
          id={inputId}
          type="file"
          className="hidden"
          accept={accept}
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelected(file);
            event.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
