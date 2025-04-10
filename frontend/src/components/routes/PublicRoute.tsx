// components/PublicRoute.tsx
import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
  const { isSignedIn } = useUser();

  // Optional: Redirect signed-in users away from public pages
  if (isSignedIn) return <Navigate to="/" />;
  return <Outlet />;
};

export default PublicRoute;
