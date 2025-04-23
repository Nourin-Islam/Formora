import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import "./index.css";
import "./i18n.ts";

import { ThemeProvider } from "@/components/global/ThemeProvider";
import { AuthProvider } from "@/components/global/AuthProvider";
import MainRoutes from "@/components/routes/MainRoute.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <AuthProvider>
          <ThemeProvider>
            <MainRoutes />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);
