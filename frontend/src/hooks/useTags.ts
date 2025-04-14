import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAuthenticatedApi, publicApi } from "@/lib/api";
import { Tag, tagFormSchema } from "@/types";
import { z } from "zod";
import { useAuth } from "@clerk/clerk-react";

export type TagsResponse = {
  tags: Tag[];
  totalPages: number;
  hasNextPage: boolean;
};

type TagQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  name?: string;
};

// Fetch tags with pagination and filtering (public)
export const useTags = (params: TagQueryParams) => {
  return useQuery<TagsResponse, Error>({
    queryKey: ["tags", params],
    queryFn: async () => {
      const response = await publicApi.get("/tags", { params });
      return response.data;
    },
    staleTime: 30000, // Adjust the stale time as needed
  });
};

// Search tags for autocomplete (public)
export const useSearchTags = (query: string) => {
  return useQuery<Tag[], Error>({
    queryKey: ["tags", "search", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const response = await publicApi.get("/tags/search", {
        params: {
          q: query,
          limit: 10,
        },
      });
      return response.data;
    },
    enabled: !!query.trim(),
  });
};

// Create a new tag (authenticated)
export const useCreateTag = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (values: z.infer<typeof tagFormSchema>) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.post("/tags", values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

// Update an existing tag (authenticated)
export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, values }: { id: number; values: z.infer<typeof tagFormSchema> }) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.patch(`/tags/${id}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

// Delete a tag (authenticated)
export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: number) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.delete(`/tags/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

// Bulk delete tags (authenticated)
export const useBulkDeleteTags = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const responses = await Promise.all(ids.map((id) => authenticatedApi.delete(`/tags/${id}`)));
      return responses.map((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};
