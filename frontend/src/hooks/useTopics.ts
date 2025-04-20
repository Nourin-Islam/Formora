import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAuthenticatedApi, publicApi } from "@/lib/api";
import { topicFormSchema } from "@/types";
import { z } from "zod";
import { useAuth } from "@clerk/clerk-react";

export type Topic = {
  id: number;
  name: string;
};

export type TopicsResponse = {
  topics: Topic[];
  totalPages: number;
  hasNextPage: boolean;
};

type TopicQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  name?: string;
};

// Fetch topics with pagination and filtering (public)
export const useTopics = (params: TopicQueryParams) => {
  return useQuery<TopicsResponse, Error>({
    queryKey: ["topics", params],
    queryFn: async () => {
      const response = await publicApi.get("/topics", { params });
      return response.data;
    },
    staleTime: 300000,
  });
};

// Search topics for autocomplete (public)
export const useSearchTopics = (query: string) => {
  return useQuery<Topic[], Error>({
    queryKey: ["topics", "search", query],
    queryFn: async () => {
      const response = await publicApi.get("/topics/search", { params: { q: query } });
      return response.data;
    },
    enabled: !!query,
  });
};

// Create a new topic (authenticated)
export const useCreateTopic = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (values: z.infer<typeof topicFormSchema>) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.post("/topics", values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
};

// Update an existing topic (authenticated)
export const useUpdateTopic = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: z.infer<typeof topicFormSchema> }) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.patch(`/topics/${id}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
};

// Delete a topic (authenticated)
export const useDeleteTopic = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: number) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.delete(`/topics/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
};

// Bulk delete topics (authenticated)
export const useBulkDeleteTopics = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const responses = await Promise.all(ids.map((id) => authenticatedApi.delete(`/topics/${id}`)));
      return responses.map((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
};
