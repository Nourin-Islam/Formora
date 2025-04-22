import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/global/ThemeToggle";
import { UserButton } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useAuth } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

function Header() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { setUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 700);
  const { t } = useTranslation();

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

  return (
    <header className="bg-white dark:bg-black shadow dark:shadow-neutral-800">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Formora</h1>
        </Link>
        {!isLoaded ? (
          <Skeleton className="h-[30px] w-full max-w-3xl rounded-md" />
        ) : (
          <div className="flex items-center space-x-4 flex-col md:flex-row justify-end ">
            <div className="relative ml-auto mr-0 md:mr-3 order-2 md:order-1 mt-3 md:mt-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input placeholder={t("Search templates...")} className="pl-10 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-800" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center order-1 md:order-2">
              {isSignedIn ? (
                <>
                  <nav className="flex space-x-4 items-center">
                    <Link to="/templates" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                      {t("My Templates")}
                    </Link>

                    {Boolean(user?.publicMetadata?.isAdmin) && (
                      <>
                        <Link to="/manage-tags" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                          {t("Tags")}
                        </Link>
                        <Link to="/manage-users" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                          {t("Users")}
                        </Link>
                      </>
                    )}

                    <UserButton />
                  </nav>
                </>
              ) : (
                <div className="flex gap-4">
                  <Link to="/sign-in" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    {t("Sign In")}
                  </Link>
                  <Link to="/sign-up" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    {t("Sign Up")}
                  </Link>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
