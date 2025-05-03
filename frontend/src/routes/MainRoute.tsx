// MainRoutes.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "@/App";

import Home from "@/pages/Home";
import SignInPage from "@/pages/auth/SignInPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import ManageUsers from "@/pages/auth/ManageUsers";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmail";
import { ErrorPage } from "@/pages/auth/ErrorPage";
import Privacy from "@/pages/Privacy";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

import PublicRoute from "@/routes/PublicRoute";
import PrivateRoute from "@/routes/PrivateRoute";
import AdminRoute from "@/routes/AdminRoute";

import TemplateCreation from "@/pages/TemplateCreate";
import TemplateEdit from "@/pages/TemplateEdit";
import FormFill from "@/pages/FormFill";
import FormEdit from "@/pages/FormEdit";
import FormView from "@/pages/FormView";
import ManageTagsPage from "@/pages/ManageTags";
import ManageTopics from "@/pages/ManageTopics";
import TemplatesHome from "@/pages/TemplatesHome";
import SearchPage from "@/pages/Search";
import TemplateView from "@/pages/TemplateView";
import FeatureList from "@/pages/FeatureCheckList";

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
          { path: "privacy", element: <Privacy /> },
          { path: "about", element: <About /> },
          { path: "contact", element: <Contact /> },
          { path: "view-template/:id", element: <TemplateView /> },
          { path: "feature-check-list", element: <FeatureList /> },
        ],
      },
      {
        element: <PrivateRoute />,
        children: [
          { path: "templates", element: <TemplatesHome /> },
          { path: "create-template", element: <TemplateCreation /> },
          { path: "manage-template/:id", element: <TemplateEdit /> },
          { path: "check-form/:id", element: <FormFill /> },
          { path: "edit-form/:id", element: <FormEdit /> },
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
