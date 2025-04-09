import { useAuth } from "@clerk/clerk-react";

export async function getToken(): Promise<string | null> {
  console.log("Fetching token...");
  const { getToken } = useAuth();
  return await getToken(); // Returns a JWT for API use
}
