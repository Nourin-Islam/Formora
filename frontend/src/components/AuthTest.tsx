import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useAuthStore } from "../store/authStore";

export default function AuthTest() {
  const { isSignedIn } = useAuth();
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      {!isSignedIn ? (
        <div className="grid grid-cols-2 gap-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Sign In</h2>
            <SignIn routing="path" path="/sign-in" />
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Sign Up</h2>
            <SignUp routing="path" path="/sign-up" />
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">User Info</h2>
          <pre className="mb-6 overflow-auto rounded bg-gray-50 p-4">{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
