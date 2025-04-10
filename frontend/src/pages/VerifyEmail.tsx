import { useSignUp, useSignIn, useClerk } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "@/components/global/icons";
import { Button } from "@/components/ui/button";

export function VerifyEmailPage() {
  const { session } = useClerk();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  // const { isLoaded: signInLoaded, signIn } = useSignIn();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  // Debug function
  const logState = () => {
    console.log("Current state:", {
      sessionExists: !!session,
      signUpStatus: signUp?.status,
      emailStatus: signUp?.verifications.emailAddress.status,
      oauthStatus: signUp?.verifications.externalAccount.status,
      identifier: signUp?.emailAddress || signUp?.username || "none",
    });
  };

  useEffect(() => {
    logState();

    // If session exists, redirect immediately
    if (session) {
      navigate("/");
      return;
    }

    if (!signUpLoaded || !signUp) return;

    // Check verification status every 2 seconds
    const interval = setInterval(async () => {
      try {
        await signUp.reload();

        if (signUp.verifications.emailAddress.status === "verified" || signUp.verifications.externalAccount.status === "verified") {
          clearInterval(interval);
          await setActive({ session: signUp.createdSessionId });
          navigate("/");
        }
      } catch (err) {
        console.error("Verification check failed:", err);
        setStatus("error");
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [signUpLoaded, signUp, setActive, navigate, session]);

  if (status === "error") {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-12">
        <h1 className="text-2xl font-bold">Verification Error</h1>
        <p className="text-muted-foreground">Something went wrong during verification</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center gap-4 py-12">
      <Icons.spinner className="h-12 w-12 animate-spin" />
      <h1 className="text-2xl font-bold">Verifying your account</h1>
      <p className="text-muted-foreground">{signUp?.emailAddress ? `Verifying ${signUp.emailAddress}` : "Completing authentication..."}</p>
      <Button variant="ghost" size="sm" onClick={logState} className="mt-4">
        Debug Info
      </Button>
    </div>
  );
}
