import { z } from "zod";

export const thumbSchema = z.object({
  thumbs: z.enum(["up", "down"]).nullable()
});

export const stepInputSchema = z.object({
  note: z.string().trim().min(1),
  videoTimestamp: z.number().int().min(0).nullable().optional()
});

export const attemptInputSchema = z.object({
  videoId: z.string().uuid(),
  rating: z.number().min(0).max(5).multipleOf(0.5),
  changes: z.string().nullable().optional(),
  improvementNote: z.string().nullable().optional(),
  triedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.array(stepInputSchema).optional()
});

export const attemptPatchSchema = attemptInputSchema.omit({ videoId: true }).partial().extend({
  rating: z.number().min(0).max(5).multipleOf(0.5).optional()
});

export const dishInputSchema = z.object({
  name: z.string().trim().min(1).max(100)
});

export const videoInputSchema = z.object({
  dishId: z.string().uuid(),
  youtubeVideoId: z.string().min(1).max(20),
  title: z.string().min(1),
  channel: z.string().min(1),
  thumbnailUrl: z.string().url(),
  publishedAt: z.string().datetime().nullable().optional()
});

export const videoHiddenSchema = z.object({
  isHidden: z.boolean().optional()
});
