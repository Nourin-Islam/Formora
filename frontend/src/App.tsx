import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import Header from "@/components/global/Header";
import Footer from "@/components/global/Footer";

function App() {
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-black">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-gray-900 dark:text-white min-h-[calc(100vh-350px)]">
          <Outlet />
        </div>
        <Footer />
      </div>
      <Toaster />
    </>
  );
}

export default App;
