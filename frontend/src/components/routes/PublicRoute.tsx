// components/PublicRoute.tsx
// components/routes/PublicRoute.tsx
import { Outlet } from "react-router-dom";
// import { useAuth } from "@clerk/clerk-react";
// import LoadingSpinner from "../global/LoadingSpinner";

const PublicRoute = () => {
  // const { isSignedIn, isLoaded } = useAuth();

  // if (!isLoaded) return <LoadingSpinner />; // or a spinner

  // If signed in and you want to redirect from public pages:
  // if (isSignedIn) return <Navigate to="/create-template" />;

  return <Outlet />;
};

export default PublicRoute;
