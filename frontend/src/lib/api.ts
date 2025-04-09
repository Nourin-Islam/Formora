// src/lib/api.ts
export async function fetchUsers(params: { page: number; limit: number; sortBy?: string; sortOrder?: "asc" | "desc"; email?: string }) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, String(value));
  });

  const response = await fetch(`/api/admin/users?${queryParams}`);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}
