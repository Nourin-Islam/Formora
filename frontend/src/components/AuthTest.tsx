import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { useAuthStore } from "../store/authStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "../schemas/authSchema";

export default function AuthTest() {
  const { isSignedIn } = useAuth();
  const { user } = useAuthStore();
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = (data: any) => {
    console.log("Form data:", data);
  };

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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input {...register("email")} placeholder="Test Zod validation" className="w-full rounded border p-2" />
            <button type="submit" className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
