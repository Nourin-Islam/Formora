import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAuthenticatedApi, publicApi } from "@/lib/api";
import { Template, TemplateFormData, TemplatesResponse, FilterOptions, TagCloud, topicsResponse } from "@/types";
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
      // console.log("Current time:", new Date().toLocaleString()); // Log the current time
      // console.log("Response from API:", response.data); // Log the response data
      return response.data;
    },
    staleTime: 30000, // 30 seconds,
    refetchInterval: false,
  });
};

export const usePopularTemplates = () => {
  return useQuery<TemplatesResponse, Error>({
    queryKey: ["popular-templates"],
    queryFn: async () => {
      const response = await publicApi.get("/home/popular");
      // console.log("Current time:", new Date().toLocaleString()); // Log the current time
      // console.log("Popular Templates:", response.data); // Log the response data

      return response.data;
    },
  });
};

export const useLatestTemplates = () => {
  return useQuery<TemplatesResponse, Error>({
    queryKey: ["latest-templates"],
    queryFn: async () => {
      const response = await publicApi.get("/home/latest");
      // console.log("Current time:", new Date().toLocaleString()); // Log the current time
      // console.log("Response from API:", response.data); // Log the response data

      return response.data;
    },
  });
};

export const useTagCloud = () => {
  return useQuery<TagCloud, Error>({
    queryKey: ["tag-cloud"],
    queryFn: async () => {
      const response = await publicApi.get("/home/tags");
      // console.log("Current time:", new Date().toLocaleString()); // Log the current time
      // console.log("Tag data:", response.data); // Log the response data

      return response.data;
    },
  });
};

export const useTopicsData = () => {
  return useQuery<topicsResponse[], Error>({
    queryKey: ["topics-data"],
    queryFn: async () => {
      const response = await publicApi.get("/home/topics");
      // console.log("Current time:", new Date().toLocaleString()); // Log the current time
      // console.log("Topics Data:", response.data); // Log the response data

      return response.data;
    },
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
      queryClient.invalidateQueries({ queryKey: [["templates"], ["popular-templates"]] });
    },
  });
};
