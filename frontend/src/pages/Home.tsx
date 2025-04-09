import { SignIn, useAuth } from "@clerk/clerk-react";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="py-12  ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isSignedIn && (
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Welcome!</h2>
            <SignIn
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                },
              }}
            />
          </div>
        )}

        {isSignedIn && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">You're signed in!</h2>
            <p className="text-gray-600">Start exploring the app</p>
          </div>
        )}
      </div>
    </div>
  );
}
