// lib/api.ts
import axios from "axios";

// Base API instance for public routes
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Function to create authenticated API instance
export const createAuthenticatedApi = async (getToken: () => Promise<string | null>) => {
  const token = await getToken();

  const authenticatedApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // Shared response interceptor
  const responseInterceptor = (error: any) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access - please login again");
    }
    return Promise.reject(error.response?.data?.error || error.message || "An error occurred");
  };

  // Apply interceptors
  authenticatedApi.interceptors.response.use((response) => response, responseInterceptor);

  publicApi.interceptors.response.use((response) => response, responseInterceptor);

  return { publicApi, authenticatedApi };
};
