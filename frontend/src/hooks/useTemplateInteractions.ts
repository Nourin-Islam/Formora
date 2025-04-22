import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAuthenticatedApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { TemplatesResponse } from "@/types";
import { FilterOptions } from "@/types/index";

export const useLikeTemplate = (filters: FilterOptions) => {
  const queryKey = ["templates", filters];
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (templateId: number) => {
      if (!userId) throw new Error("User not authenticated");

      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.post(`/interact/templates/${templateId}/like`);
      return { templateId, userId };
    },
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TemplatesResponse>(queryKey);

      if (previousData && userId) {
        const updatedData: TemplatesResponse = {
          ...previousData,
          templates: previousData.templates.map((t) =>
            t.id === templateId
              ? {
                  ...t,
                  likesCount: t.likesCount + 1,
                  peopleLiked: [...(t.peopleLiked || []), userId],
                }
              : t
          ),
        };
        queryClient.setQueryData(queryKey, updatedData);
      }

      return { previousData };
    },
    onError: (err, templateId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to like template");
    },
    onSettled: () => {
      // This is intentional to avoid refetching the data after adding/removing like. Because Backend has View and Cache. First View refreshes then cache refreshes. If we refetch here then we get old data. So will refetch manually after 20/30 seconds.
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useUnlikeTemplate = (filters: FilterOptions) => {
  const queryKey = ["templates", filters];
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (templateId: number) => {
      if (!userId) throw new Error("User not authenticated");

      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.delete(`/interact/templates/${templateId}/like`);
      return { templateId, userId };
    },
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TemplatesResponse>(queryKey);

      if (previousData && userId) {
        const updatedData: TemplatesResponse = {
          ...previousData,
          templates: previousData.templates.map((t) =>
            t.id === templateId
              ? {
                  ...t,
                  likesCount: Math.max(0, t.likesCount - 1),
                  peopleLiked: (t.peopleLiked || []).filter((id) => id !== userId),
                }
              : t
          ),
        };
        queryClient.setQueryData(queryKey, updatedData);
      }

      return { previousData };
    },
    onError: (err, templateId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to unlike template");
    },
    onSettled: () => {
      // This is intentional to avoid refetching the data after adding/removing like. Because Backend has View and Cache. First View refreshes then cache refreshes. If we refetch here then we get old data. So will refetch manually after 20/30 seconds.
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
