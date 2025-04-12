import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function SignInPage() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) return <Navigate to="/" replace />;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            footerActionLink: "text-blue-600 hover:text-blue-800",
          },
        }}
      />
    </div>
  );
}
