import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import LoadingSpinner from "./components/global/LoadingSpinner";
import { Toaster } from "sonner";

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (isLoaded && user) {
      setUser(user);
    }
  }, [isLoaded, user, setUser]);

  if (!isLoaded) return <LoadingSpinner />;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between">
            <Link to="/">
              <h1 className="text-3xl font-bold text-gray-900">My App</h1>
            </Link>

            {isSignedIn ? (
              <>
                <nav className="flex space-x-4 items-center">
                  {Boolean(user?.publicMetadata?.isAdmin) && (
                    <>
                      <Link to="/manage-tags" className="text-gray-900 hover:text-blue-600">
                        Tags
                      </Link>
                      <Link to="/manage-topics" className="text-gray-900 hover:text-blue-600">
                        Topics
                      </Link>
                      <Link to="/manage-users" className="text-gray-900 hover:text-blue-600">
                        Users
                      </Link>
                    </>
                  )}

                  <Link to="/templates" className="text-gray-900 hover:text-blue-600">
                    Templates
                  </Link>

                  <UserButton />
                </nav>
              </>
            ) : (
              <div className="flex gap-4">
                <Link to="/sign-in" className="text-blue-600 hover:text-blue-800">
                  Sign In
                </Link>
                <Link to="/sign-up" className="text-blue-600 hover:text-blue-800">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </>
  );
}

export default App;
