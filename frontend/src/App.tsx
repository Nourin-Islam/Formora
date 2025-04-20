import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { useAuthStore } from "./store/authStore";
import { useNavigate } from "react-router-dom";
import { Link, Outlet } from "react-router-dom";
import LoadingSpinner from "./components/global/LoadingSpinner";
import { Toaster } from "sonner";
import { Input } from "@/components/ui/input";
import { useDebounce } from "use-debounce";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

function App() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { setUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 700);

  useEffect(() => {
    if (isLoaded && user) {
      setUser(user);
    }
  }, [isLoaded, user, setUser]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      navigate(`/search?query=${encodeURIComponent(debouncedSearchTerm)}`);
      setSearchTerm("");
    }
  }, [debouncedSearchTerm, navigate]);

  if (!isLoaded) return <LoadingSpinner />;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between">
            <Link to="/">
              <h1 className="text-3xl font-bold text-gray-900">Formora</h1>
            </Link>
            <div className="relative  ml-auto mr-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search templates..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {isSignedIn ? (
              <>
                <nav className="flex space-x-4 items-center">
                  <Link to="/templates" className="text-gray-900 hover:text-blue-600">
                    My Templates
                  </Link>

                  {Boolean(user?.publicMetadata?.isAdmin) && (
                    <>
                      <Link to="/manage-tags" className="text-gray-900 hover:text-blue-600">
                        Tags
                      </Link>
                      {/* <Link to="/manage-topics" className="text-gray-900 hover:text-blue-600">
                        Topics
                      </Link> */}
                      <Link to="/manage-users" className="text-gray-900 hover:text-blue-600">
                        Users
                      </Link>
                    </>
                  )}

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
