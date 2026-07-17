import { z } from "zod";

import { isValidHexColor, normalizeHexColor } from "@/modules/finance/lib/invoice-theme-colors";
import {
  WORKSPACE_LOGO_MAX_BYTES,
  WORKSPACE_LOGO_MIME_TYPES,
} from "@/modules/organization/branding/types";

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => {
      if (value == null || value === "") return null;
      return value;
    });

const hexColorSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const upper = value.startsWith("#") ? value.toUpperCase() : `#${value.toUpperCase()}`;
    if (
      /gradient|url\(|rgb\(|hsl\(|var\(/i.test(value) ||
      !isValidHexColor(upper)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Color must be #RRGGBB",
      });
    }
  })
  .transform((value) => normalizeHexColor(value));

export const workspaceBrandingUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  legalName: optionalTrimmed(160),
  tagline: optionalTrimmed(160),
  address: optionalTrimmed(400),
  email: optionalTrimmed(160),
  phone: optionalTrimmed(40),
  website: optionalTrimmed(200),
  taxId: optionalTrimmed(40),
  primaryColor: hexColorSchema.optional(),
  secondaryColor: hexColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
});

export const prepareWorkspaceLogoUploadSchema = z.object({
  originalFilename: z.string().trim().min(1).max(200),
  declaredMimeType: z.enum(WORKSPACE_LOGO_MIME_TYPES),
  declaredSize: z
    .number()
    .int()
    .positive()
    .max(WORKSPACE_LOGO_MAX_BYTES),
});

export const finalizeWorkspaceLogoUploadSchema = z.object({
  storagePath: z.string().trim().min(1).max(500),
  originalFilename: z.string().trim().min(1).max(200),
  contentHash: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i),
  mimeType: z.enum(WORKSPACE_LOGO_MIME_TYPES),
});

export type WorkspaceBrandingUpdateParsed = z.infer<
  typeof workspaceBrandingUpdateSchema
>;
