// useTemplateInteractions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAuthenticatedApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { TemplatesResponse } from "@/types";
// useTemplateInteractions.ts
export const useLikeTemplate = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (templateId: number) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.post(`/interact/templates/${templateId}/like`);
      return templateId;
    },
    onMutate: async (templateId) => {
      // Cancel ongoing queries to prevent overwrites
      const queryKey = ["templates"] as const;
      await queryClient.cancelQueries({ queryKey });
      // await queryClient.cancelQueries(["templates"]);

      // Snapshot current data
      const previousData = queryClient.getQueryData<TemplatesResponse>(["templates"]);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData(["templates"], {
          ...previousData,
          templates: previousData.templates.map((t) =>
            t.id === templateId
              ? {
                  ...t,
                  likesCount: t.likesCount + 1,
                  peopleLiked: [...t.peopleLiked, userId],
                }
              : t
          ),
        });
      }

      return { previousData };
    },
    onError: (err, templateId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["templates"], context.previousData);
      }
      toast.error("Failed to like template");
      console.error("Error liking template: ", templateId, err);
    },
    onSettled: () => {
      // Silently refetch in background
      const queryKey = ["templates"] as const;
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useUnlikeTemplate = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (templateId: number) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.delete(`/interact/templates/${templateId}/like`);
      return templateId;
    },
    onMutate: async (templateId) => {
      const queryKey = ["templates"] as const;

      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TemplatesResponse>(["templates"]);

      if (previousData) {
        queryClient.setQueryData(["templates"], {
          ...previousData,
          templates: previousData.templates.map((t) =>
            t.id === templateId
              ? {
                  ...t,
                  likesCount: t.likesCount - 1,
                  peopleLiked: t.peopleLiked.filter((id) => id !== userId),
                }
              : t
          ),
        });
      }

      return { previousData };
    },
    onError: (err, templateId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["templates"], context.previousData);
      }
      toast.error("Failed to unlike template");
      console.error("Error unliking template: ", templateId, err);
    },
    onSettled: () => {
      const queryKey = ["templates"] as const;
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
