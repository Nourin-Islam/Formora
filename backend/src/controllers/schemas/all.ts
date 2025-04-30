import { z } from "zod";

export const commentCreateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment cannot exceed 500 characters"),
});

export const commentUpdateSchema = commentCreateSchema; // Can reuse same schema

export type CommentCreateData = z.infer<typeof commentCreateSchema>;
export type CommentUpdateData = z.infer<typeof commentUpdateSchema>;
