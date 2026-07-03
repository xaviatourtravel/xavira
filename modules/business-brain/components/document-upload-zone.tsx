"use client";

import { useCallback, useState, useTransition } from "react";
import { FileUp, Link2, Upload } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { DsField, DsTextInput } from "@/components/design-system/form-controls";
import { uploadBrainDocumentAction, uploadBrainDocumentUrlAction } from "@/modules/business-brain/actions/document-actions";
import { cn } from "@/lib/utils";

type DocumentUploadZoneProps = {
  canEdit: boolean;
  onUploaded: (documentId: string) => void;
};

export function DocumentUploadZone({ canEdit, onUploaded }: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlName, setUrlName] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const uploadFile = useCallback(
    (file: File) => {
      setErrorMessage(null);
      const formData = new FormData();
      formData.set("file", file);
      formData.set("name", file.name);

      startTransition(async () => {
        const result = await uploadBrainDocumentAction(formData);
        if (!result.ok || !result.document) {
          setErrorMessage(result.ok ? "Upload failed." : result.error);
          return;
        }
        onUploaded(result.document.id);
      });
    },
    [onUploaded],
  );

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!canEdit) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleAddUrl = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await uploadBrainDocumentUrlAction({
        name: urlName.trim() || urlValue.trim(),
        publicUrl: urlValue.trim(),
      });
      if (!result.ok || !result.document) {
        setErrorMessage(result.ok ? "Failed to add URL." : result.error);
        return;
      }
      setUrlName("");
      setUrlValue("");
      onUploaded(result.document.id);
    });
  };

  if (!canEdit) return null;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "rounded-2xl border border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/30",
        )}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-medium text-foreground">
          Drag & drop PDF, image, or video
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Max 50MB per file</p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
          <FileUp className="h-4 w-4" />
          Browse files
          <input
            type="file"
            className="hidden"
            accept="application/pdf,image/*,video/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadFile(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-border p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Link2 className="h-4 w-4" />
          Add URL document
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <DsField label="Name">
            <DsTextInput
              value={urlName}
              onChange={(event) => setUrlName(event.target.value)}
              placeholder="Company profile"
            />
          </DsField>
          <DsField label="URL">
            <DsTextInput
              value={urlValue}
              onChange={(event) => setUrlValue(event.target.value)}
              placeholder="https://..."
            />
          </DsField>
        </div>
        <DsButton
          type="button"
          variant="outline"
          className="mt-3"
          onClick={handleAddUrl}
          loading={isPending}
          disabled={!urlValue.trim()}
        >
          Add URL
        </DsButton>
      </div>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
