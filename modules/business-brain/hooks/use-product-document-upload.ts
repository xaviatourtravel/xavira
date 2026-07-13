"use client";

import { useCallback, useMemo, useState } from "react";

import { uploadProductDocumentAction } from "@/modules/business-brain/actions/product-actions";
import {
  beginProductUploadDebug,
  describeSelectedFile,
  describeUploadPayload,
  endProductUploadDebug,
  logProductUploadError,
  logProductUploadStep,
} from "@/modules/business-brain/lib/product-upload-debug";
import {
  classifyProductUploadError,
  validateProductDocumentFile,
} from "@/modules/business-brain/lib/validate-product-document-file";
import type { ProductDocumentUploadErrorCode } from "@/modules/business-brain/lib/validate-product-document-file";
import type { BrainProductDetail, ProductDocumentType } from "@/modules/business-brain/types/products";

export type ProductDocumentUploadStatus =
  | "idle"
  | "validating"
  | "uploading"
  | "processing"
  | "success"
  | "error";

export type ProductDocumentUploadSlotState = {
  status: ProductDocumentUploadStatus;
  progress: number;
  fileName: string | null;
  errorCode: ProductDocumentUploadErrorCode | null;
};

const IDLE_SLOT: ProductDocumentUploadSlotState = {
  status: "idle",
  progress: 0,
  fileName: null,
  errorCode: null,
};

function isBusyStatus(status: ProductDocumentUploadStatus): boolean {
  return status === "validating" || status === "uploading" || status === "processing";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type UseProductDocumentUploadOptions = {
  productId: string;
  onSuccess: (product: BrainProductDetail) => void;
};

export function useProductDocumentUpload({
  productId,
  onSuccess,
}: UseProductDocumentUploadOptions) {
  const [slots, setSlots] = useState<Partial<Record<ProductDocumentType, ProductDocumentUploadSlotState>>>({});

  const updateSlot = useCallback(
    (documentType: ProductDocumentType, patch: Partial<ProductDocumentUploadSlotState>) => {
      setSlots((current) => ({
        ...current,
        [documentType]: {
          ...IDLE_SLOT,
          ...current[documentType],
          ...patch,
        },
      }));

      if (process.env.NODE_ENV === "development") {
        logProductUploadStep("upload state change", {
          documentType,
          ...patch,
        });
      }
    },
    [],
  );

  const getSlotState = useCallback(
    (documentType: ProductDocumentType): ProductDocumentUploadSlotState => {
      return slots[documentType] ?? IDLE_SLOT;
    },
    [slots],
  );

  const resetSlot = useCallback(
    (documentType: ProductDocumentType) => {
      updateSlot(documentType, IDLE_SLOT);
    },
    [updateSlot],
  );

  const uploadFile = useCallback(
    async (documentType: ProductDocumentType, file: File) => {
      if (isBusyStatus(getSlotState(documentType).status)) {
        return;
      }

      beginProductUploadDebug();

      try {
        logProductUploadStep("selected file", {
          ...describeSelectedFile(file),
          extension: file.name.split(".").pop()?.toLowerCase() ?? "",
        });

        updateSlot(documentType, {
          status: "validating",
          progress: 10,
          fileName: file.name,
          errorCode: null,
        });

        const validation = await validateProductDocumentFile(file, documentType);
        if (!validation.ok) {
          updateSlot(documentType, {
            status: "error",
            progress: 10,
            fileName: file.name,
            errorCode: validation.code,
          });
          return;
        }

        updateSlot(documentType, {
          status: "uploading",
          progress: 30,
          fileName: file.name,
          errorCode: null,
        });
        await delay(120);

        updateSlot(documentType, { progress: 70 });

        const formData = new FormData();
        formData.set("productId", productId);
        formData.set("documentType", documentType);
        formData.set("file", file);

        logProductUploadStep(
          "Request payload",
          describeUploadPayload({ productId, documentType, file }),
        );

        let result;
        try {
          result = await uploadProductDocumentAction(formData);
          logProductUploadStep("server response", result);
        } catch (error) {
          logProductUploadError(error);
          updateSlot(documentType, {
            status: "error",
            progress: 70,
            fileName: file.name,
            errorCode: classifyProductUploadError(
              error instanceof Error ? error.message : "network",
            ),
          });
          return;
        }

        if (!result.ok || !result.product) {
          updateSlot(documentType, {
            status: "error",
            progress: 70,
            fileName: file.name,
            errorCode: classifyProductUploadError(result.error),
          });
          return;
        }

        updateSlot(documentType, {
          status: "processing",
          progress: 90,
          fileName: file.name,
          errorCode: null,
        });
        await delay(80);

        onSuccess(result.product);

        updateSlot(documentType, {
          status: "success",
          progress: 100,
          fileName: file.name,
          errorCode: null,
        });

        window.setTimeout(() => {
          resetSlot(documentType);
        }, 4000);
      } catch (error) {
        logProductUploadError(error);
        updateSlot(documentType, {
          status: "error",
          progress: 0,
          fileName: file.name,
          errorCode: classifyProductUploadError(
            error instanceof Error ? error.message : undefined,
          ),
        });
      } finally {
        endProductUploadDebug();
      }
    },
    [getSlotState, onSuccess, productId, resetSlot, updateSlot],
  );

  const uploadVideoUrl = useCallback(
    async (videoUrl: string) => {
      const documentType: ProductDocumentType = "video";
      if (isBusyStatus(getSlotState(documentType).status)) {
        return;
      }

      const trimmed = videoUrl.trim();
      if (!trimmed) {
        updateSlot(documentType, {
          status: "error",
          progress: 0,
          fileName: null,
          errorCode: "unsupported",
        });
        return;
      }

      beginProductUploadDebug();

      try {
        updateSlot(documentType, {
          status: "validating",
          progress: 10,
          fileName: trimmed,
          errorCode: null,
        });

        updateSlot(documentType, { status: "uploading", progress: 30 });
        await delay(120);
        updateSlot(documentType, { progress: 70 });

        const formData = new FormData();
        formData.set("productId", productId);
        formData.set("documentType", documentType);
        formData.set("fileUrl", trimmed);

        let result;
        try {
          result = await uploadProductDocumentAction(formData);
          logProductUploadStep("server response", result);
        } catch (error) {
          logProductUploadError(error);
          updateSlot(documentType, {
            status: "error",
            progress: 70,
            fileName: trimmed,
            errorCode: "network",
          });
          return;
        }

        if (!result.ok) {
          updateSlot(documentType, {
            status: "error",
            progress: 70,
            fileName: trimmed,
            errorCode: classifyProductUploadError(result.error, result.errorCode),
          });
          return;
        }

        if (!result.product) {
          updateSlot(documentType, {
            status: "error",
            progress: 70,
            fileName: trimmed,
            errorCode: "unknown",
          });
          return;
        }

        updateSlot(documentType, { status: "processing", progress: 90 });
        await delay(80);
        onSuccess(result.product);
        updateSlot(documentType, { status: "success", progress: 100, fileName: trimmed });
        window.setTimeout(() => resetSlot(documentType), 4000);
      } finally {
        endProductUploadDebug();
      }
    },
    [getSlotState, onSuccess, productId, resetSlot, updateSlot],
  );

  const isUploading = useMemo(
    () => Object.values(slots).some((slot) => slot && isBusyStatus(slot.status)),
    [slots],
  );

  const isSlotBusy = useCallback(
    (documentType: ProductDocumentType) => isBusyStatus(getSlotState(documentType).status),
    [getSlotState],
  );

  return {
    getSlotState,
    uploadFile,
    uploadVideoUrl,
    resetSlot,
    isUploading,
    isSlotBusy,
  };
}
