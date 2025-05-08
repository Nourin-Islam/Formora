import axios from "axios";

async function getSalesforceAccessData() {
  const response = await axios.post("https://login.salesforce.com/services/oauth2/token", null, {
    params: {
      grant_type: "password",
      client_id: process.env.SALESFORCE_CLIENT_ID,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET,
      username: process.env.SALESFORCE_USERNAME,
      password: (process.env.SALESFORCE_PASSWORD ?? "") + (process.env.SALESFORCE_SECURITY_TOKEN ?? ""),
    },
  });

  return response.data;
}

export default getSalesforceAccessData;
