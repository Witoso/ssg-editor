import { z } from "zod";

export const PostSchema = z.object({
  frontmatter: z.string(),
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

export type PostsListResponseType = z.infer<typeof PostsListResponseSchema>;
