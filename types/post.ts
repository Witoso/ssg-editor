import { z } from "zod";

export const PostSchema = z.object({
  content: z.string(),
  filePath: z.string(),
  filename: z.string(),
});

export type PostType = z.infer<typeof PostSchema>;

export const PostsListResponseSchema = z.object({
  status: z.union([z.literal("success"), z.literal("error")]),
  filenames: z.array(z.string()),
  message: z.union([z.string(), z.null()]),
});

export const PostResponseSchema = z.object({
  status: z.union([z.literal("success"), z.literal("error")]),
  post: z.union([PostSchema, z.null()]),
  message: z.union([z.string(), z.null()]),
});

export const PostSaveRequestSchema = z.object({
  content: z.string(),
  filename: z.string(),
});

export const PostSaveResponseSchema = z.object({
  status: z.union([z.literal("success"), z.literal("error")]),
  message: z.union([z.string(), z.null()]),
});
