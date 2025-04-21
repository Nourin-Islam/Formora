import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAuthenticatedApi } from "@/lib/api";
import { Template, Question, TemplateFormData, TemplatesResponse, FilterOptions } from "@/types";
import { useAuth } from "@clerk/clerk-react";
// refetchInterval default value set to 300000 (5 minutes)
export const useTemplates = (filters?: FilterOptions) => {
  const { getToken } = useAuth();

  return useQuery<TemplatesResponse, Error>({
    queryKey: ["templates", filters],
    queryFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get("/templates", {
        params: filters,
      });
      // console.log current time
      console.log("Current time:", new Date().toLocaleString()); // Log the current time
      console.log("Response from API:", response.data); // Log the response data
      return response.data;
    },
    staleTime: 0,
    refetchInterval: false,
  });
};

export const useTemplateById = (id: string) => {
  const { getToken } = useAuth();

  return useQuery<Template, Error>({
    queryKey: ["templates", id],
    queryFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get(`/templates/${id}`);
      return response.data;
    },
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (templateData: TemplateFormData) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.post("/templates", templateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, templateData }: { id: string; templateData: TemplateFormData }) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.put(`/templates/${id}`, templateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: number) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.delete(`/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
};

// Question-specific hooks
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ templateId, questionData }: { templateId: string; questionData: Omit<Question, "id"> }) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.post("/questions", {
        ...questionData,
        templateId,
      });
      return response.data;
    },
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ questionId, questionData }: { questionId: string; questionData: Partial<Question> }) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.put(`/questions/${questionId}`, questionData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["templates", data.templateId] });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (questionId: string) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.delete(`/questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
};

export const useReorderQuestions = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ templateId, questionOrder }: { templateId: string; questionOrder: string[] }) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      await authenticatedApi.post("/questions/reorder", {
        templateId,
        questionOrder,
      });
    },
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
    },
  });
};
