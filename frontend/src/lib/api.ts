// lib/api.ts
import axios from "axios";

// Base API instance for public routes
export const publicApi = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Function to create authenticated API instance
export const createAuthenticatedApi = async (getToken: () => Promise<string | null>) => {
  const token = await getToken();

  const authenticatedApi = axios.create({
    baseURL: "http://localhost:3000/api",
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

/*

For public routes (no token needed):
typescript
Copy
import { publicApi } from "@/lib/api";

const fetchPublicData = async () => {
  const response = await publicApi.get("/public-route");
  // ...
};

For private routes (token required):
typescript
Copy
import { createAuthenticatedApi } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";

function PrivateComponent() {
  const { getToken } = useAuth();

  const fetchPrivateData = async () => {
    const { authenticatedApi } = await createAuthenticatedApi(getToken);
    const response = await authenticatedApi.get("/private-route");
    // ...
  };
}

If you're using React Query, you can combine it with Solution 2 like this:

typescript
Copy
// hooks/useTopics.ts
import { createAuthenticatedApi } from "@/lib/api";

export const useTopics = () => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const api = await createAuthenticatedApi(getToken);
      const response = await api.get('/topics');
      return response.data;
    }
  });
};

*/
