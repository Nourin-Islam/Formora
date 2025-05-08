async function getSalesforceAccessData() {
  const params = new URLSearchParams({
    grant_type: "password",
    client_id: process.env.SALESFORCE_CLIENT_ID || "",
    client_secret: process.env.SALESFORCE_CLIENT_SECRET || "",
    username: process.env.SALESFORCE_USERNAME || "",
    password: (process.env.SALESFORCE_PASSWORD ?? "") + (process.env.SALESFORCE_SECURITY_TOKEN ?? ""),
  });

  const res = await fetch("https://login.salesforce.com/services/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Salesforce access token");
  }

  return await res.json();
}

export default getSalesforceAccessData;
