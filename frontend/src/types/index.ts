import { z } from "zod";
// Base User type
export interface User {
  id: number;
  email: string;
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
  createdAt: Date | string;
}

export const topicFormSchema = z.object({
  name: z.string().min(2, {
    message: "Topic name must be at least 2 characters.",
  }),
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
  name: z.string().min(2, {
    message: "Tag name must be at least 2 characters.",
  }),
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
  user: User;
  topic: Topic;
  tags: Tag[];
  questionCount: number;
  commentCount: number;
  peopleLiked: string[]; // Array of clerkIds
}

export interface TemplatesResponse {
  templates: Template[];
  totalPages: number;
  hasNextPage: boolean;
  totalCount: number;
}

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
  sortOrder: string;
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

export interface TemplateFormData {
  title: string;
  description: string;
  topicId: number;
  isPublic: boolean;
  imageUrl: string | null;
  tags: string[];
  accessUsers: number[];
  questions: Question[];
}
