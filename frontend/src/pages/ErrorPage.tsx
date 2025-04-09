import { useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="container flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Oops!</h1>
      <p className="text-lg">Sorry, an unexpected error has occurred.</p>
      <Button onClick={() => window.location.reload()}>Refresh Page</Button>
    </div>
  );
}
