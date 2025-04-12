import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import Home from "./pages/Home";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ManageUsers from "./pages/ManageUsers";
import { VerifyEmailPage } from "./pages/VerifyEmail";
import { ErrorPage } from "./pages/ErrorPage";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query";

import PublicRoute from "./components/routes/PublicRoute";
import PrivateRoute from "./components/routes/PrivateRoute";
import AdminRoute from "./components/routes/AdminRoute";

import CreateTemplateForm from "@/pages/CreateTemplate";
import TemplateCreationClaude from "@/pages/TemplateCreationClaude";
import TopicsPage from "@/pages/OldTopicsPage";
import ManageTagsPage from "@/pages/ManageTags";
import ManageTopics from "@/pages/ManageTopics";

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
        ],
      },
      {
        element: <PrivateRoute />,
        children: [{ path: "create-template", element: <TemplateCreationClaude /> }],
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
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
        <RouterProvider router={router} />
      </ClerkProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
