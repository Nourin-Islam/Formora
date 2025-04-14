import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAuthenticatedApi } from "@/lib/api";
import { User } from "@/types";
import { useAuth } from "@clerk/clerk-react";

export type UsersResponse = {
  users: User[];
  totalPages: number;
  hasNextPage: boolean;
};

type UserQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  email?: string;
};

// Fetch users with pagination and filtering
export const useUsers = (params: UserQueryParams) => {
  const { getToken } = useAuth();
  return useQuery<UsersResponse, Error>({
    queryKey: ["users", params],
    queryFn: async () => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get("/users", { params });
      return response.data;
    },
    staleTime: 30000, // Adjust the stale time as needed
  });
};

// Update user admin status
export const useUpdateUserAdmin = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.patch(`/users/${userId}/admin`, { isAdmin });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Update user block status
export const useUpdateUserBlock = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: number; isBlocked: boolean }) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.patch(`/users/${userId}/block`, { isBlocked });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Delete user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (userId: number) => {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
