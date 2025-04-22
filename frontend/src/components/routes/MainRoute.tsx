// MainRoutes.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./../../App";

import Home from "@/pages/Home";
import SignInPage from "@/pages/auth/SignInPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import ManageUsers from "@/pages/auth/ManageUsers";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmail";
import { ErrorPage } from "@/pages/auth/ErrorPage";

import PublicRoute from "@/components/routes/PublicRoute";
import PrivateRoute from "@/components/routes/PrivateRoute";
import AdminRoute from "@/components/routes/AdminRoute";

import TemplateCreation from "@/pages/TemplateCreate";
import TemplateEdit from "@/pages/TemplateEdit";
import FormFill from "@/pages/FormFill";
import FormView from "@/pages/FormView";
import ManageTagsPage from "@/pages/ManageTags";
import ManageTopics from "@/pages/ManageTopics";
import TemplatesHome from "@/pages/TemplatesHome";
import SearchPage from "@/pages/Search";

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
          { path: "manage-topics", element: <ManageTopics /> },
          { path: "manage-tags", element: <ManageTagsPage /> },
        ],
      },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "*", element: <ErrorPage /> },
    ],
  },
]);

export default function MainRoutes() {
  return <RouterProvider router={router} />;
}
