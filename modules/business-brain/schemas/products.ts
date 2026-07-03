import { z } from "zod";

import {
  BRAIN_PRODUCT_CATEGORIES,
  BRAIN_PRODUCT_STATUSES,
  DEPARTURE_STATUSES,
  PRODUCT_CURRENCIES,
} from "@/modules/business-brain/types/products";

const pricingItemSchema = z.object({
  id: z.string().min(1),
  packageName: z.string().trim().min(1, "Package name is required."),
  price: z.number().min(0),
  currency: z.enum(PRODUCT_CURRENCIES),
  validUntil: z.string().trim(),
  earlyBird: z.string().trim().optional(),
  promo: z.string().trim().optional(),
});

const departureItemSchema = z.object({
  id: z.string().min(1),
  departureDate: z.string().trim().min(1, "Departure date is required."),
  availableSeats: z.number().int().min(0),
  status: z.enum(DEPARTURE_STATUSES),
});

export const brainProductFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  category: z.enum(BRAIN_PRODUCT_CATEGORIES, {
    errorMap: () => ({ message: "Category is required." }),
  }),
  destination: z.string().trim(),
  status: z.enum(BRAIN_PRODUCT_STATUSES),
  description: z.string(),
  highlights: z.array(z.string().trim().min(1)),
  pricing: z.array(pricingItemSchema),
  departures: z.array(departureItemSchema),
  included: z.array(z.string().trim().min(1)),
  excluded: z.array(z.string().trim().min(1)),
  aiNotes: z.string(),
});

export type BrainProductFormInput = z.infer<typeof brainProductFormSchema>;

export const createProductFaqSchema = z.object({
  title: z.string().trim().min(1, "FAQ title is required."),
  content: z.string().trim().min(1, "FAQ content is required."),
});
