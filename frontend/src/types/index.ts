import { z } from "zod";
// Base User type
export interface User {
  id: number;
  email?: string;
  name: string;
  isAdmin: boolean;
  clerkId: string;
  isBlocked: boolean;
  createdAt: string | Date;
  // Add other fields from your Prisma model as needed
}

// types/topic
export interface Topic {
  id: number;
  name: string;
}

export const topicFormSchema = z.object({
  name: z
    .string()
    .min(2, "Topic name must be at least 2 characters long")
    .max(20, "Topic name cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9 ]*$/, "Topic name can only contain letters, numbers, and spaces"),
});

export type TopicFormValues = z.infer<typeof topicFormSchema>;

// types/tag
export interface Tag {
  id: number;
  name: string;
  usageCount: number;
  createdAt: Date | string;
}

export const tagFormSchema = z.object({
  name: z
    .string()
    .min(2, "Tag name must be at least 2 characters long")
    .max(20, "Tag name cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9 ]*$/, "Tag name can only contain letters, numbers, and spaces"),
});

export enum QuestionType {
  STRING = "STRING",
  TEXT = "TEXT",
  INTEGER = "INTEGER",
  CHECKBOX = "CHECKBOX",
}

export interface Question {
  id: string;
  title: string;
  description: string;
  questionType: QuestionType;
  position: number;
  showInTable: boolean;
  options?: any;
  correctAnswers?: any; // For future use with select options
}

export interface QuestionToSubmit {
  title: string;
  description: string;
  questionType: QuestionType;
  position: number;
  showInTable: boolean;
  options?: any;
  correctAnswers?: any; // For future use with select options
}

export interface QuestionFormValues {
  title: string;
  description?: string;
  questionType: QuestionType;
  showInTable: boolean;
  options?: string[];
  correctAnswers?: string[] | number | null;
}

export interface Question extends QuestionFormValues {
  id: string;
  position: number;
}

// Add to your types file (e.g., @/types/question.ts)

export const questionFormSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  questionType: z.nativeEnum(QuestionType),
  position: z.number().optional(),
  showInTable: z.boolean(),
  options: z.array(z.string()).default([]),
  correctAnswers: z.union([z.array(z.string()), z.number(), z.null()]).default([]),
});

export const templateFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  topicId: z.coerce.number().min(1, "Topic is required"),
  questions: z.array(questionFormSchema).min(1, "At least one question is required"),
});

export interface Like {
  id: number;
  templateId: number;
  userId: number;
  createdAt: string;
  user: {
    clerkId: string;
  };
}

// Extend this as needed for other entities in your application

export interface Template {
  id: number;
  userId: number;
  topicId: number;
  title: string;
  description: string;
  imageUrl?: string;
  isPublic: boolean;
  isPublished: boolean;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  accessUsers: User[];
  questions: Question[];
  user: User;
  topic: Topic;
  tags: Tag[];
  questionCount: number;
  commentCount: number;
  peopleLiked: string[]; // Array of clerkIds
  submissionCount: number;
}

export interface TemplateFormData {
  title: string;
  description: string;
  topicId: number;
  isPublic: boolean;

  isPublished: boolean;
  imageUrl: string | null;
  tags: string[];
  accessUsers: number[];
  questions: QuestionToSubmit[];
}

export interface TemplatesResponse {
  templates: Template[];
  totalPages: number;
  hasNextPage: boolean;
  totalCount: number;
}

// API Response types
export interface UsersResponse {
  users: User[];
  totalPages: number;
  totalCount: number;
}

export interface UpdateUserPayload {
  id: number;
  isAdmin?: boolean;
  isBlocked?: boolean;
}

// Table column type for TanStack Table
export interface UsersTableColumn {
  id: string;
  header: string;
  accessorKey?: keyof User;
  cell?: (props: any) => React.ReactNode;
}

// Query params for fetching users
export interface UsersQueryParams {
  page?: number;
  limit?: number;
  sortBy?: keyof User;
  sortOrder?: "asc" | "desc";
  email?: string;
}

// Error type
export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface TagCreatePayload {
  name: string;
}

export interface TagUpdatePayload {
  name: string;
}

export interface TopicCreatePayload {
  name: string;
}

export interface TopicUpdatePayload {
  name: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export type QuestionCorrectAnswer = string | string[] | number | number[];

export interface FilterOptions {
  title?: string;
  topicId?: number;
  isPublic?: boolean;
  userId?: number;
  isPublished?: boolean;
  tag?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder?: "asc" | "desc";
}

// Template show Related?

// types/index.ts - Add these to your existing types file

export interface TemplateFilterOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder?: "asc" | "desc";
  topicId?: number;
  isPublished?: boolean;
  isPublic?: boolean;
  [key: string]: any;
}

export interface TagCloud {
  tagId: number;
  tagName: string;
  templateIds: number[];
}

export interface topicsResponse {
  topicId: number;
  topicName: string;
  templateCount: number;
}
