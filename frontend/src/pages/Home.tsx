import { SignIn, useAuth } from "@clerk/clerk-react";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className=" ">
      {!isSignedIn && (
        <>
          <h2 className="text-2xl font-bold mb-6 text-center">Welcome!</h2>
          <SignIn
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              },
            }}
          />
        </>
      )}

      {isSignedIn && <h2 className="text-9xl">Hi!</h2>}
    </div>
  );
}
