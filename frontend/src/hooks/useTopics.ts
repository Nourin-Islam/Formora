// hooks/useTopics.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios"; // assuming axios is configured with baseURL and headers

const fetchTopics = async (page = 1, limit = 10) => {
  const { data } = await axios.get(`/api/topics?page=${page}&limit=${limit}`);
  return data;
};

export const useTopics = (page: number, limit: number) => {
  return useQuery(["topics", page], () => fetchTopics(page, limit), {
    keepPreviousData: true,
  });
};

export const useCreateTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTopic: { title: string; description: string; categoryId: string }) => axios.post("/api/topics", newTopic),
    onSuccess: () => {
      queryClient.invalidateQueries(["topics"]);
    },
  });
};

export const useUpdateTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updateData: { id: string; title: string; description: string; categoryId: string }) => axios.patch(`/api/topics/${updateData.id}`, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries(["topics"]);
    },
  });
};

export const useDeleteTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.delete(`/api/topics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["topics"]);
    },
  });
};
