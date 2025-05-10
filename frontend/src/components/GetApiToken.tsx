import { useAuth } from "@clerk/clerk-react";
import { createAuthenticatedApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function GetApiToken() {
  const { getToken } = useAuth();
  const [apiToken, setApiToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showToken, setShowToken] = useState<boolean>(false);

  const handleFetchToken = async () => {
    setIsLoading(true);
    try {
      const { authenticatedApi } = await createAuthenticatedApi(getToken);
      const response = await authenticatedApi.get("/odoo/get-api-token");
      // console.log("API token response:", response);
      setApiToken(response.data.apiToken);
      toast.success("API token fetched successfully");
    } catch (error) {
      console.error("Error fetching API token:", error);
      toast.error("Failed to fetch API token");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (!apiToken) return;
    navigator.clipboard.writeText(apiToken);
    toast.success("API token copied to clipboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Token</CardTitle>
        <CardDescription>Manage your API token for integration purposes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-token">Your API Token</Label>
          <div className="flex items-center space-x-2">
            <Input id="api-token" type={showToken ? "text" : "password"} value={apiToken || "Click below to fetch your token"} readOnly className="font-mono" />

            {apiToken && (
              <>
                <Button variant="outline" size="icon" onClick={() => setShowToken(!showToken)}>
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={handleCopyToken} disabled={!apiToken}>
                  <Copy className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <Button onClick={handleFetchToken} disabled={isLoading}>
          {isLoading ? "Fetching..." : "Get API Token"}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <h3 className="font-medium">About API Token</h3>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>This token allows secure, read-only access to your form templates from external systems like Odoo.</li>
          <li>Only aggregated results (e.g., averages, popular answers) are accessible via this token.</li>
          <li>Each token is unique to your account and grants access only to your own templates.</li>
          <li>{"You can use the token by sending GET request to https://taskseven-lmgn.onrender.com/api/odoo?templateId={template id}&apiToken={your  api token}"}</li>
          <li>Keep this token private. Treat it like a password — do not share it publicly.</li>
        </ul>
      </CardFooter>
    </Card>
  );
}

export default GetApiToken;
