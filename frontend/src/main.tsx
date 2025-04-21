import React from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import Home from "./pages/Home";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import ManageUsers from "./pages/auth/ManageUsers";
import { VerifyEmailPage } from "./pages/auth/VerifyEmail";
import { ErrorPage } from "./pages/auth/ErrorPage";
import "./index.css";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { queryClient } from "@/lib/react-query";

import PublicRoute from "./components/routes/PublicRoute";
import PrivateRoute from "./components/routes/PrivateRoute";
import AdminRoute from "./components/routes/AdminRoute";

import TemplateCreation from "@/pages/TemplateCreate";
import TemplateEdit from "@/pages/TemplateEdit";
import FormFill from "@/pages/FormFill";

import ManageTagsPage from "@/pages/ManageTags";
import ManageTopics from "@/pages/ManageTopics";
import TemplatesHome from "@/pages/TemplatesHome";
import FormView from "@/pages/FormView";
import SearchPage from "@/pages/Search";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <PublicRoute />,
        children: [
          { index: true, element: <Home /> },
          { path: "sign-in", element: <SignInPage /> },
          { path: "sign-in/*", element: <SignInPage /> },
          { path: "sign-up", element: <SignUpPage /> },
          { path: "sign-up/*", element: <SignUpPage /> },
          { path: "search", element: <SearchPage /> },
        ],
      },
      {
        element: <PrivateRoute />,
        children: [
          { path: "templates", element: <TemplatesHome /> },
          { path: "create-template", element: <TemplateCreation /> },
          { path: "edit-template/:id", element: <TemplateEdit /> },
          { path: "fill-form/:id", element: <FormFill /> },
          { path: "forms/:id", element: <FormView /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          { path: "manage-users", element: <ManageUsers /> },
          // { path: "manage-topics", element: <TopicsPage /> },
          { path: "manage-topics", element: <ManageTopics /> },
          { path: "manage-tags", element: <ManageTagsPage /> },
        ],
      },
      {
        path: "verify-email",
        element: <VerifyEmailPage />,
      },
      {
        path: "*",
        element: <ErrorPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools initialIsOpen={false} />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);
