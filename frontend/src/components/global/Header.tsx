import { Input } from "@/components/ui/input";
import { House, Search } from "lucide-react";
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
      <div className="mx-auto max-w-7xl px-4 py-3 md:py-6 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center  justify-center md:justify-between   md:items-center">
        <Link className="flex justify-center gap-2 items-center" to="/">
          <House className=" mt-1 inline " />
          <h1 className="   text-3xl md:text-3xl font-bold text-gray-900 dark:text-white">Formora</h1>
        </Link>
        {!isLoaded ? (
          <Skeleton className="h-[30px] w-full max-w-3xl rounded-md" />
        ) : (
          <div className="grid grid-cols-[auto_auto]   lg:grid-cols-[auto_auto_auto] gap-y-4 lg:gap-y-0 lg:gap-x-4 items-center  ">
            {/* First item - always spans full width on mobile, medium+ gets A position */}
            <div className="col-start-1 col-end-2 row-start-2 row-end-3 lg:col-start-1 lg:col-end-2  lg:row-start-1 lg:row-end-2 relative ">
              <Search className="absolute left-2 md:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground   dark:text-gray-500 " />
              <Input placeholder={t("Search templates...")} className="pl-7 md:pl-10 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-800 w-[120px] sm:w-auto" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* Second item - appears first on mobile, then moves to B position on medium+ */}
            <div className="col-start-1 col-end-3 row-start-1 row-end-2  lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 ml-auto lg:ml-0 ">
              {isSignedIn ? (
                <>
                  <nav className="flex space-x-4 items-center">
                    <Link to="/templates" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                      {t("Templates")}
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
            </div>

            {/* Third item - appears second on mobile, then moves to C position on medium+ */}
            <div className="col-start-2 col-end-3 row-start-2 row-end-3  lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2   ">
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
