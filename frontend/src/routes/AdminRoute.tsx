// components/AdminRoute.tsx
import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TemplatesSkeleton from "@/components/global/TemplatesSkeleton";

const AdminRoute = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(10);

  const isAdmin = user?.publicMetadata?.isAdmin === true;

  useEffect(() => {
    if (!isAdmin && isLoaded && isSignedIn) {
      const interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);

      const timeout = setTimeout(() => {
        navigate("/", { replace: true });
      }, 10000); // 10 seconds

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isAdmin, isLoaded, isSignedIn, navigate]);

  if (!isLoaded) return <TemplatesSkeleton />;
  if (!isSignedIn) return <Navigate to="/sign-in" state={{ from: location }} replace />;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center space-y-4 px-4">
        <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
        <p className="text-lg">This page requires admin access.</p>
        <p className="text-gray-600">
          You will be redirected in <span className="font-semibold">{secondsLeft}</span> second{secondsLeft !== 1 && "s"}...
        </p>
        <button onClick={() => navigate("/")} className=" cursor-pointer mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Go back to homepage
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminRoute;
