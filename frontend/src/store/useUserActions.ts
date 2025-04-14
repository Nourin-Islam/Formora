import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { User } from "@/types";
import { useAuth } from "@clerk/clerk-react";

type UserUpdateVariables = {
  userId: number;
  isAdmin?: boolean;
  isBlocked?: boolean;
};

type MutationContext = {
  previousUsers?: User[];
};

export function useUserActions() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const updateUser = async ({ userId, ...data }: UserUpdateVariables): Promise<User> => {
    const token = await getToken();
    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update user");
    }

    return response.json();
  };

  // Shared mutation options (excluding mutationFn and onSuccess)
  const baseMutationOptions: Omit<UseMutationOptions<User, Error, UserUpdateVariables, MutationContext>, "mutationFn" | "onSuccess"> = {
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      const previousUsers = queryClient.getQueryData<User[]>(["users"]);

      queryClient.setQueryData<User[]>(["users"], (old = []) => old.map((user) => (user.id === variables.userId ? { ...user, ...variables } : user)));

      return { previousUsers };
    },
    onError: (err, _variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      toast.error("Error", {
        description: err.message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  };

  const toggleAdmin = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => updateUser({ userId, isAdmin }),
    ...baseMutationOptions,
    onSuccess: (_data, variables) => {
      toast.success("Success", {
        description: `User ${variables.isAdmin ? "promoted to admin" : "demoted from admin"}`,
      });
    },
  });

  const toggleBlock = useMutation({
    mutationFn: ({ userId, isBlocked }: { userId: number; isBlocked: boolean }) => updateUser({ userId, isBlocked }),
    ...baseMutationOptions,
    onSuccess: (_data, variables) => {
      toast.success("Success", {
        description: `User ${variables.isBlocked ? "blocked" : "unblocked"}`,
      });
    },
  });

  // New: Proper delete mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      return response.json();
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      const previousUsers = queryClient.getQueryData<User[]>(["users"]);

      queryClient.setQueryData<User[]>(["users"], (old = []) => old.filter((user) => user.id !== userId));

      return { previousUsers };
    },
    onError: (err, _userId, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
      toast.error("Error", {
        description: err.message,
      });
    },
    onSuccess: (data) => {
      toast.success("Success", {
        description: data.message || "User deleted successfully",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    handleToggleAdmin: toggleAdmin.mutate,
    handleToggleBlock: toggleBlock.mutate,
    handleDeleteUser: deleteUserMutation.mutate,
    isUpdating: toggleAdmin.isPending || toggleBlock.isPending || deleteUserMutation.isPending,
  };
}
