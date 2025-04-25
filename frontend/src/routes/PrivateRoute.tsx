// components/PrivateRoute.tsx
import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import TemplatesSkeleton from "@/components/global/TemplatesSkeleton";

const PrivateRoute = () => {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  if (!isLoaded) return <TemplatesSkeleton />;
  if (!isSignedIn) return <Navigate to="/sign-in" state={{ from: location }} replace />;
  return <Outlet />;
};

export default PrivateRoute;
