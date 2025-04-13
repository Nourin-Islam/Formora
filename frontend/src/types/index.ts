// src/types/index.ts

// Base User type
export interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string | Date;
  // Add other fields from your Prisma model as needed
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

// Extend this as needed for other entities in your application
export interface Template {
  id: number;
  title: string;
  description: string;
  // Add other template fields
}

// types/tag
export interface Tag {
  id: number;
  name: string;
  usageCount: number;
  createdAt: Date | string;
}

export interface TagCreatePayload {
  name: string;
}

export interface TagUpdatePayload {
  name: string;
}

// types/topic
export interface Topic {
  id: number;
  name: string;
  createdAt: Date | string;
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

export interface Template {
  title: string;
  description: string;
  topicId: number;
  isPublic: boolean;
  isPublished: boolean;
  imageUrl: string | null;
  likesCount: number;
  tags: string[];
  accessUsers: number[];
  questions?: Question[];
  // Add any additional fields as needed
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
