import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { createAuthenticatedApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { TemplatesResponse } from "@/types";

type Action = "like" | "unlike";

/**
 * Update a template inside multiple caches based on the action
 */
const updateTemplateInCache = (queryClient: ReturnType<typeof useQueryClient>, templateId: number, userId: string, action: Action, queryKeys: QueryKey[]) => {
  for (const key of queryKeys) {
    const currentData = queryClient.getQueryData<TemplatesResponse>(key);
    if (!currentData) continue;

    const updated = {
      ...currentData,
      templates: currentData.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              likesCount: action === "like" ? t.likesCount + 1 : Math.max(0, t.likesCount - 1),
              peopleLiked: action === "like" ? [...(t.peopleLiked || []), userId] : (t.peopleLiked || []).filter((id) => id !== userId),
            }
          : t
      ),
    };

    queryClient.setQueryData(key, updated);
  }
};

export const useLikeTemplate = (queryKeysToUpdate: QueryKey[] = []) => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation<number, Error, number>({
    mutationFn: async (templateId: number) => {
      if (!userId) throw new Error("User not authenticated");
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.post(`/interact/templates/${templateId}/like`);
      return templateId;
    },
    onMutate: async (templateId: number) => {
      if (!userId) return;
      updateTemplateInCache(queryClient, templateId, userId, "like", queryKeysToUpdate);
    },
    onSuccess: () => {
      toast.success("Liked template!");
    },
    onError: (err) => {
      console.error("Failed to like template:", err);
      toast.error("Failed to like template");
    },
  });
};

export const useUnlikeTemplate = (queryKeysToUpdate: QueryKey[] = []) => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation<number, Error, number>({
    mutationFn: async (templateId: number) => {
      if (!userId) throw new Error("User not authenticated");
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.delete(`/interact/templates/${templateId}/like`);
      return templateId;
    },
    onMutate: async (templateId: number) => {
      if (!userId) return;
      updateTemplateInCache(queryClient, templateId, userId, "unlike", queryKeysToUpdate);
    },
    onSuccess: () => {
      toast.success("Unliked template!");
    },
    onError: (err) => {
      console.error("Failed to unlike template:", err);
      toast.error("Failed to unlike template");
    },
  });
};
